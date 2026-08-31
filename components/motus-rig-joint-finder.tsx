'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bone, BrainCircuit, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getRigJointPivot,
  type HolisticRigJoint,
  type HolisticWorkerResponse,
} from '@/lib/motus-ai/holistic-joints';
import {
  getFramedCanvasSize,
  getFramedImageDrawRect,
} from '@/lib/motus-image-framing';
import type { ElementImageRigPart } from '@/lib/motus-model';

type JointFinderState = 'idle' | 'loading' | 'detecting' | 'complete' | 'error';

type MotusRigJointFinderProps = {
  aspectRatio: number;
  crop: ElementImageRigPart;
  focalX: number;
  focalY: number;
  imageFit: 'contain' | 'cover';
  imageName: string;
  imageSrc: string;
  onApplyPivot: (
    pivot: { x: number; y: number },
    joint: HolisticRigJoint,
  ) => void;
};

const MIN_JOINT_CONFIDENCE = 0.45;

export function MotusRigJointFinder({
  aspectRatio,
  crop,
  focalX,
  focalY,
  imageFit,
  imageName,
  imageSrc,
  onApplyPivot,
}: MotusRigJointFinderProps) {
  const workerRef = useRef<Worker | null>(null);
  const imageAbortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(0);
  const requestSequence = useRef(0);
  const [state, setState] = useState<JointFinderState>('idle');
  const [status, setStatus] = useState('Local body model not loaded');
  const [progress, setProgress] = useState(0);
  const [joints, setJoints] = useState<HolisticRigJoint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedJoint = joints.find((joint) => joint.id === selectedId) ?? null;
  const selectedPivot = selectedJoint
    ? getRigJointPivot(selectedJoint, crop)
    : null;

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      imageAbortRef.current?.abort();
      workerRef.current?.postMessage({
        type: 'dispose',
        requestId: 'holistic-dispose',
      });
      workerRef.current?.terminate();
    };
  }, []);

  const jointsWithPivots = useMemo(
    () =>
      joints.map((joint) => ({
        joint,
        pivot: getRigJointPivot(joint, crop),
      })),
    [crop, joints],
  );

  const sendImage = async (worker: Worker, session: number) => {
    imageAbortRef.current?.abort();
    const controller = new AbortController();
    imageAbortRef.current = controller;
    setState('detecting');
    setStatus('Preparing artwork for local body tracking');
    try {
      const response = await fetch(imageSrc, { signal: controller.signal });
      if (!response.ok)
        throw new Error('The source artwork could not be opened.');
      const source = await createImageBitmap(await response.blob());
      if (sessionRef.current !== session || workerRef.current !== worker) {
        source.close();
        return;
      }
      const size = getFramedCanvasSize(aspectRatio);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext('2d');
      if (!context) {
        source.close();
        throw new Error('The image renderer is unavailable.');
      }
      const draw = getFramedImageDrawRect(
        source.width,
        source.height,
        canvas.width,
        canvas.height,
        imageFit,
        focalX,
        focalY,
      );
      context.drawImage(source, draw.x, draw.y, draw.width, draw.height);
      source.close();
      const bitmap = await createImageBitmap(canvas);
      if (sessionRef.current !== session || workerRef.current !== worker) {
        bitmap.close();
        return;
      }
      requestSequence.current += 1;
      worker.postMessage(
        {
          type: 'detect',
          requestId: `holistic-detect-${requestSequence.current}`,
          image: bitmap,
        },
        [bitmap],
      );
    } catch (error) {
      if (
        controller.signal.aborted ||
        sessionRef.current !== session ||
        workerRef.current !== worker
      ) {
        return;
      }
      setState('error');
      setStatus(
        error instanceof Error
          ? error.message
          : 'The artwork could not be analyzed.',
      );
    } finally {
      if (imageAbortRef.current === controller) imageAbortRef.current = null;
    }
  };

  const analyze = () => {
    if (!imageSrc) {
      setState('error');
      setStatus('The source artwork is missing.');
      return;
    }
    sessionRef.current += 1;
    const session = sessionRef.current;
    imageAbortRef.current?.abort();
    workerRef.current?.terminate();
    setJoints([]);
    setSelectedId(null);
    setProgress(0);
    setState('loading');
    setStatus('Loading local Holistic body model');
    const worker = new Worker(
      new URL(
        '../workers/motus-holistic-landmarker.worker.ts',
        import.meta.url,
      ),
      { type: 'module' },
    );
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<HolisticWorkerResponse>) => {
      if (sessionRef.current !== session || workerRef.current !== worker) {
        return;
      }
      const response = event.data;
      if (response.type === 'progress') {
        setStatus(response.message);
        if (response.ratio !== undefined) setProgress(response.ratio);
        return;
      }
      if (response.type === 'ready') {
        setStatus(`Body model ready · ${response.backend.toUpperCase()}`);
        void sendImage(worker, session);
        return;
      }
      if (response.type === 'result') {
        if (!response.joints.length) {
          setState('error');
          setStatus(
            'No human pose found · keep using the manual pivot controls',
          );
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          return;
        }
        const nextSelected =
          response.joints.find((joint) => {
            const pivot = getRigJointPivot(joint, crop);
            return pivot.inside && joint.confidence >= MIN_JOINT_CONFIDENCE;
          }) ?? response.joints[0];
        setJoints(response.joints);
        setSelectedId(nextSelected.id);
        setState('complete');
        setProgress(1);
        setStatus(`${response.joints.length} body joints found locally`);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        return;
      }
      if (response.type === 'error') {
        setState('error');
        setStatus(response.error.message);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      }
    };
    worker.onerror = () => {
      if (sessionRef.current !== session || workerRef.current !== worker) {
        return;
      }
      setState('error');
      setStatus('The body-tracking worker stopped unexpectedly.');
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    requestSequence.current += 1;
    worker.postMessage({
      type: 'initialize',
      requestId: `holistic-initialize-${requestSequence.current}`,
      preferGpu: true,
      verifyIntegrity: true,
    });
  };

  const busy = state === 'loading' || state === 'detecting';

  return (
    <div className="rig-joint-finder">
      <div className="rig-joint-finder-heading">
        <div>
          <Bone aria-hidden="true" />
          <div>
            <strong>Joint finder</strong>
            <span>HOLISTIC · LOCAL AI</span>
          </div>
        </div>
        <Button
          disabled={busy || !imageSrc}
          onClick={analyze}
          size="sm"
          type="button"
          variant="outline"
        >
          {state === 'complete' || state === 'error' ? (
            <RotateCcw aria-hidden="true" />
          ) : (
            <BrainCircuit aria-hidden="true" />
          )}
          {state === 'idle' ? 'Find joints' : busy ? 'Working…' : 'Scan again'}
        </Button>
      </div>
      <p>
        Detect human landmarks in the source artwork and snap this part&apos;s
        pivot to a shoulder, elbow, wrist, hip, knee, or head center. Nothing is
        uploaded.
      </p>
      {state === 'complete' ? (
        <>
          <div
            aria-label={`${imageName} body-joint reference`}
            className="rig-joint-preview"
            style={{ aspectRatio }}
          >
            <span
              aria-hidden="true"
              className="rig-joint-artwork"
              style={{
                backgroundImage: `url(${imageSrc})`,
                backgroundPosition: `${focalX}% ${focalY}%`,
                backgroundSize: imageFit,
              }}
            />
            <span
              aria-hidden="true"
              className="rig-joint-crop"
              style={{
                height: `${crop.cropHeight}%`,
                left: `${crop.cropX}%`,
                top: `${crop.cropY}%`,
                width: `${crop.cropWidth}%`,
              }}
            />
            {jointsWithPivots.map(({ joint, pivot }) => (
              <button
                aria-label={`${joint.label}, ${pivot.inside ? 'inside' : 'outside'} this part, ${Math.round(joint.confidence * 100)} percent confidence`}
                aria-pressed={selectedId === joint.id}
                className="rig-joint-point"
                data-inside={pivot.inside || undefined}
                data-selected={selectedId === joint.id || undefined}
                key={joint.id}
                onClick={() => setSelectedId(joint.id)}
                style={{ left: `${joint.x * 100}%`, top: `${joint.y * 100}%` }}
                title={`${joint.label} · ${Math.round(joint.confidence * 100)}%`}
                type="button"
              />
            ))}
          </div>
          <div className="rig-joint-selection">
            <div>
              <strong>{selectedJoint?.label}</strong>
              <span>
                {selectedPivot?.inside
                  ? `Pivot ${Math.round(selectedPivot.x)}, ${Math.round(selectedPivot.y)}`
                  : 'This joint is outside the selected part'}
                {selectedJoint
                  ? ` · ${Math.round(selectedJoint.confidence * 100)}% confidence`
                  : ''}
              </span>
            </div>
            <Button
              disabled={
                !selectedJoint ||
                !selectedPivot?.inside ||
                selectedJoint.confidence < MIN_JOINT_CONFIDENCE
              }
              onClick={() => {
                if (selectedJoint && selectedPivot?.inside) {
                  onApplyPivot(selectedPivot, selectedJoint);
                }
              }}
              size="sm"
              type="button"
            >
              <Check aria-hidden="true" />
              Use pivot
            </Button>
          </div>
        </>
      ) : null}
      <output className="rig-joint-status" data-state={state}>
        <span>{status}</span>
        {busy ? <progress max="1" value={progress || undefined} /> : null}
      </output>
    </div>
  );
}
