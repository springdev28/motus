'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Square } from 'lucide-react';

import {
  buildMotionTimelineTracks,
  clampMotionTimelineTime,
  getMotionTimelineDuration,
  getMotionTimelineSpanPercentages,
  getMotionTimelineTicks,
  type MotionTimelineScope,
  type MotionTimelineSpan,
} from '@/lib/motus-motion-timeline';
import type { MotusScene } from '@/lib/motus-model';

type MotusMotionTimelineProps = {
  active: boolean;
  collapsed: boolean;
  getCurrentTime: () => number;
  onFinish: () => void;
  onPause: () => void;
  onPlay: () => void;
  onScopeChange: (scope: MotionTimelineScope) => void;
  onSeek: (timeMs: number) => void;
  onSelectSpan: (elementId: string, span: MotionTimelineSpan) => void;
  onStop: () => void;
  onToggleCollapsed: () => void;
  playing: boolean;
  scene: MotusScene;
  scope: MotionTimelineScope;
  selectedElementId?: string;
  sessionKey: number;
};

function formatTimecode(value: number): string {
  const milliseconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const remainder = milliseconds % 1_000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(remainder).padStart(3, '0')}`;
}

export function MotusMotionTimeline({
  active,
  collapsed,
  getCurrentTime,
  onFinish,
  onPause,
  onPlay,
  onScopeChange,
  onSeek,
  onSelectSpan,
  onStop,
  onToggleCollapsed,
  playing,
  scene,
  scope,
  selectedElementId,
  sessionKey,
}: MotusMotionTimelineProps) {
  const tracks = useMemo(
    () => buildMotionTimelineTracks(scene.elements, scope, selectedElementId),
    [scene.elements, scope, selectedElementId],
  );
  const durationMs = getMotionTimelineDuration(tracks);
  const ticks = useMemo(
    () => getMotionTimelineTicks(durationMs, 5),
    [durationMs],
  );
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const timelineSelectionKey =
    scope === 'selected' ? (selectedElementId ?? '') : 'scene';
  const timelineProgramKey = tracks
    .map((track) =>
      [
        track.elementId,
        track.durationMs,
        ...track.spans.flatMap((span) => [
          span.instanceId,
          span.startsAtMs,
          span.durationMs,
        ]),
      ].join(':'),
    )
    .join('|');
  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setCurrentTimeMs(0);
    });
    return () => {
      mounted = false;
    };
  }, [scope, sessionKey, timelineProgramKey, timelineSelectionKey]);

  useEffect(() => {
    if (!active || !playing || durationMs <= 0) return;
    let frame = 0;
    const update = () => {
      const nextTime = clampMotionTimelineTime(getCurrentTime(), durationMs);
      setCurrentTimeMs(nextTime);
      if (nextTime >= durationMs - 1) {
        onFinish();
        return;
      }
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [active, durationMs, getCurrentTime, onFinish, playing, sessionKey]);

  const seek = (timeMs: number) => {
    const nextTime = clampMotionTimelineTime(timeMs, durationMs);
    setCurrentTimeMs(nextTime);
    onSeek(nextTime);
  };
  const playheadPercent = durationMs
    ? (clampMotionTimelineTime(currentTimeMs, durationMs) / durationMs) * 100
    : 0;

  return (
    <section
      aria-label="Motion timeline"
      className="motion-timeline"
      data-collapsed={collapsed || undefined}
      data-playing={playing || undefined}
    >
      <header className="motion-timeline-header">
        <div className="motion-timeline-transport">
          <button
            aria-label={
              playing ? 'Pause motion timeline' : 'Play motion timeline'
            }
            className="motion-timeline-play"
            disabled={durationMs <= 0}
            onClick={playing ? onPause : onPlay}
            type="button"
          >
            {playing ? (
              <Pause aria-hidden="true" fill="currentColor" />
            ) : (
              <Play aria-hidden="true" fill="currentColor" />
            )}
          </button>
          <button
            aria-label="Stop motion timeline"
            className="motion-timeline-stop"
            disabled={!active}
            onClick={onStop}
            type="button"
          >
            <Square aria-hidden="true" fill="currentColor" />
          </button>
        </div>

        <div className="motion-timeline-title">
          <span>TIMELINE</span>
          <strong>
            {scope === 'selected'
              ? (tracks[0]?.elementName ?? 'Selected layer')
              : `${tracks.length} motion ${tracks.length === 1 ? 'track' : 'tracks'}`}
          </strong>
        </div>

        <fieldset aria-label="Timeline scope" className="motion-timeline-scope">
          <button
            aria-pressed={scope === 'selected'}
            onClick={() => onScopeChange('selected')}
            type="button"
          >
            Selected
          </button>
          <button
            aria-pressed={scope === 'scene'}
            onClick={() => onScopeChange('scene')}
            type="button"
          >
            Scene
          </button>
        </fieldset>

        <output aria-live="polite" className="motion-timeline-time">
          <strong>{formatTimecode(currentTimeMs)}</strong>
          <span>/ {formatTimecode(durationMs)}</span>
        </output>

        <button
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? 'Expand motion timeline' : 'Collapse motion timeline'
          }
          className="motion-timeline-collapse"
          onClick={onToggleCollapsed}
          type="button"
        >
          {collapsed ? (
            <ChevronUp aria-hidden="true" />
          ) : (
            <ChevronDown aria-hidden="true" />
          )}
        </button>
      </header>

      {!collapsed ? (
        <div className="motion-timeline-body">
          {tracks.length && durationMs > 0 ? (
            <>
              <div className="motion-timeline-ruler-row">
                <span className="motion-timeline-corner">LAYER</span>
                <div className="motion-timeline-ruler">
                  {ticks.map((tick, index) => (
                    <span
                      key={`${tick}-${index}`}
                      style={{
                        left: `${(index / Math.max(ticks.length - 1, 1)) * 100}%`,
                      }}
                    >
                      {formatTimecode(tick).replace(/^0:/, '')}
                    </span>
                  ))}
                  <i
                    aria-hidden="true"
                    className="motion-timeline-ruler-playhead"
                    style={{ left: `${playheadPercent}%` }}
                  />
                </div>
              </div>

              <label className="motion-timeline-scrubber">
                <span className="sr-only">Timeline playhead</span>
                <input
                  aria-valuetext={`${formatTimecode(currentTimeMs)} of ${formatTimecode(durationMs)}`}
                  max={Math.max(durationMs, 1)}
                  min="0"
                  onChange={(event) => seek(Number(event.target.value))}
                  step="1"
                  type="range"
                  value={clampMotionTimelineTime(currentTimeMs, durationMs)}
                />
              </label>

              <div className="motion-timeline-tracks">
                {tracks.map((track) => (
                  <div className="motion-timeline-track" key={track.elementId}>
                    <button
                      className="motion-timeline-track-label"
                      onClick={() =>
                        track.spans[0] &&
                        onSelectSpan(track.elementId, track.spans[0])
                      }
                      title={track.elementName}
                      type="button"
                    >
                      <strong>{track.elementName}</strong>
                      <small>{formatTimecode(track.durationMs)}</small>
                    </button>
                    <div
                      className="motion-timeline-track-rail"
                      style={
                        {
                          '--timeline-lanes': track.laneCount,
                        } as CSSProperties
                      }
                    >
                      {ticks.map((tick, index) => (
                        <i
                          aria-hidden="true"
                          className="motion-timeline-gridline"
                          key={`${tick}-${index}`}
                          style={{
                            left: `${(index / Math.max(ticks.length - 1, 1)) * 100}%`,
                          }}
                        />
                      ))}
                      {track.spans.map((span) => {
                        const position = getMotionTimelineSpanPercentages(
                          span,
                          durationMs,
                        );
                        return (
                          <button
                            aria-label={`${track.elementName}: ${span.label}, ${formatTimecode(span.startsAtMs)} to ${formatTimecode(span.endMs)}`}
                            className="motion-timeline-span"
                            data-category={span.category}
                            key={span.instanceId}
                            onClick={() => {
                              seek(span.startsAtMs);
                              onSelectSpan(track.elementId, span);
                            }}
                            style={{
                              left: `${position.left}%`,
                              top: `${span.lane * 24 + 5}px`,
                              width: `${position.width}%`,
                            }}
                            title={`${span.label} · ${formatTimecode(span.startsAtMs)}–${formatTimecode(span.endMs)} · ${span.easing}`}
                            type="button"
                          >
                            <span>{span.label}</span>
                          </button>
                        );
                      })}
                      <i
                        aria-hidden="true"
                        className="motion-timeline-playhead"
                        style={{ left: `${playheadPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="motion-timeline-empty">
              <strong>No motion on this scope</strong>
              <span>
                {scope === 'selected'
                  ? 'Select a visible layer with an enabled action block.'
                  : 'Add an enabled action block to a visible scene layer.'}
              </span>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
