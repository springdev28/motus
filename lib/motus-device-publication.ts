import { readNewestMotusDraft } from './motus-draft-storage.ts';
import {
  PROJECT_SCHEMA_VERSION,
  cloneProject,
  getProjectScenes,
  normalizeReaderPresentation,
  resolveReaderSource,
  restoreProject,
  type MotusProject,
  type MotusPublicationRevision,
  type MotusReaderSource,
} from './motus-model.ts';

export const DEVICE_PUBLICATION_SLUG_PREFIX = 'on-device-';
export const DEVICE_FOLLOWED_WORKS_STORAGE_KEY =
  'motus:device-followed-works:v1';
export const DEVICE_READING_PROGRESS_STORAGE_KEY =
  'motus:device-reading-progress:v1';
export const DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY =
  'motus:device-publications:v1';
export const MAX_DEVICE_PUBLICATIONS = 12;
const MAX_DEVICE_PUBLICATION_REGISTRY_CHARACTERS = 24_000_000;
const MAX_DEVICE_PREFERENCE_ENTRIES = 100;

type DeviceReadStorage = Pick<Storage, 'getItem'>;
type DeviceWriteStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type DevicePublicationRecord = {
  projectId: string;
  revision: MotusPublicationRevision;
};

export type DevicePublication = {
  slug: string;
  projectId: string;
  revision: MotusPublicationRevision;
  source: MotusReaderSource;
  project: MotusProject;
};

export type DeviceReadingProgress = {
  chapterId: string;
  sceneId: string;
  updatedAt: string;
};

function stableProjectHash(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

export function getDevicePublicationSlug(projectId: string) {
  const normalizedId = projectId.trim();
  const identity = stableProjectHash(`motus-publication:${normalizedId}`);
  const collisionGuard = stableProjectHash(`${normalizedId}:reader-route`);
  return `${DEVICE_PUBLICATION_SLUG_PREFIX}${identity}${collisionGuard}`;
}

export function isDevicePublicationSlug(slug: string) {
  return /^on-device-[a-z0-9]{8,20}$/.test(slug);
}

function createPublishedProject(
  projectId: string,
  revision: MotusPublicationRevision,
): MotusProject {
  type LegacyPublicationRevision = Omit<
    MotusPublicationRevision,
    'readerPresentation'
  > & {
    readerPresentation?: MotusPublicationRevision['readerPresentation'];
  };
  const legacySnapshot = structuredClone(revision) as LegacyPublicationRevision;
  const snapshot: MotusPublicationRevision = {
    ...legacySnapshot,
    readerPresentation:
      legacySnapshot.readerPresentation === undefined
        ? normalizeReaderPresentation()
        : legacySnapshot.readerPresentation,
  };
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: projectId,
    title: snapshot.title,
    creatorName: snapshot.creatorName,
    description: snapshot.description,
    tags: [...snapshot.tags],
    language: snapshot.language,
    contentRating: snapshot.contentRating,
    visibility: snapshot.visibility,
    metadata: structuredClone(snapshot.metadata),
    format: snapshot.format,
    readerPresentation: structuredClone(snapshot.readerPresentation),
    coverSceneId: snapshot.coverSceneId,
    publishedRevision: snapshot.revision,
    publications: [snapshot],
    chapters: structuredClone(snapshot.chapters),
    updatedAt: snapshot.createdAt,
  };
}

function revisionUsesCurrentRigSchema(revision: unknown) {
  if (!revision || typeof revision !== 'object' || Array.isArray(revision)) {
    return false;
  }
  const chapters = (revision as Record<string, unknown>).chapters;
  if (!Array.isArray(chapters)) return false;
  return chapters.every((chapter) => {
    if (!chapter || typeof chapter !== 'object' || Array.isArray(chapter)) {
      return false;
    }
    const scenes = (chapter as Record<string, unknown>).scenes;
    return (
      Array.isArray(scenes) &&
      scenes.every((scene) => {
        if (!scene || typeof scene !== 'object' || Array.isArray(scene)) {
          return false;
        }
        const elements = (scene as Record<string, unknown>).elements;
        return (
          Array.isArray(elements) &&
          elements.every((element) => {
            if (
              !element ||
              typeof element !== 'object' ||
              Array.isArray(element)
            ) {
              return false;
            }
            const layer = element as Record<string, unknown>;
            return (
              (layer.parentId === null || typeof layer.parentId === 'string') &&
              typeof layer.pivotX === 'number' &&
              Number.isFinite(layer.pivotX) &&
              typeof layer.pivotY === 'number' &&
              Number.isFinite(layer.pivotY)
            );
          })
        );
      })
    );
  });
}

function createDevicePublication(
  projectId: string,
  revision: MotusPublicationRevision,
): DevicePublication {
  const project = createPublishedProject(projectId, revision);
  const immutableRevision = project.publications[0];
  return {
    slug: getDevicePublicationSlug(projectId),
    projectId,
    revision: structuredClone(immutableRevision),
    source: resolveReaderSource(project, immutableRevision),
    project,
  };
}

function getPublicationTimestamp(publication: DevicePublication) {
  const timestamp = Date.parse(publication.revision.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function compareDevicePublications(
  left: DevicePublication,
  right: DevicePublication,
) {
  return (
    getPublicationTimestamp(right) - getPublicationTimestamp(left) ||
    right.revision.revision - left.revision.revision
  );
}

function restoreDevicePublicationRecord(
  candidate: unknown,
): DevicePublication | null {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return null;
  }
  const record = candidate as Record<string, unknown>;
  if (
    typeof record.projectId !== 'string' ||
    !record.projectId.trim() ||
    !record.revision ||
    typeof record.revision !== 'object' ||
    Array.isArray(record.revision)
  ) {
    return null;
  }
  try {
    const revision = record.revision as MotusPublicationRevision;
    const candidate = createPublishedProject(record.projectId, revision);
    const project = restoreProject(
      JSON.stringify(
        revisionUsesCurrentRigSchema(record.revision)
          ? candidate
          : { ...candidate, schemaVersion: 9 },
      ),
    );
    if (!project || project.publications.length !== 1) return null;
    return getDevicePublicationFromProject(project);
  } catch {
    return null;
  }
}

export function listDevicePublications(
  storage: DeviceReadStorage,
): DevicePublication[] {
  try {
    const encoded = storage.getItem(DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY);
    if (
      !encoded ||
      encoded.length > MAX_DEVICE_PUBLICATION_REGISTRY_CHARACTERS
    ) {
      return [];
    }
    const parsed: unknown = JSON.parse(encoded);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [];
    }
    const envelope = parsed as Record<string, unknown>;
    if (envelope.schemaVersion !== 1 || !Array.isArray(envelope.publications)) {
      return [];
    }
    const publications: DevicePublication[] = [];
    const slugs = new Set<string>();
    for (const candidate of envelope.publications.slice(
      0,
      MAX_DEVICE_PUBLICATIONS,
    )) {
      const publication = restoreDevicePublicationRecord(candidate);
      if (!publication || slugs.has(publication.slug)) continue;
      slugs.add(publication.slug);
      publications.push(publication);
    }
    return publications.sort(compareDevicePublications);
  } catch {
    return [];
  }
}

export function saveDevicePublication(
  storage: DeviceWriteStorage,
  projectId: string,
  revision: MotusPublicationRevision,
) {
  let previous: string | null | undefined;
  try {
    const publication = createDevicePublication(projectId, revision);
    const existing = listDevicePublications(storage).filter(
      (candidate) => candidate.slug !== publication.slug,
    );
    if (existing.length >= MAX_DEVICE_PUBLICATIONS) return false;
    const publications: DevicePublicationRecord[] = [
      publication,
      ...existing,
    ].map((candidate) => ({
      projectId: candidate.projectId,
      revision: structuredClone(candidate.revision),
    }));
    const encoded = JSON.stringify({ schemaVersion: 1, publications });
    if (encoded.length > MAX_DEVICE_PUBLICATION_REGISTRY_CHARACTERS) {
      return false;
    }
    previous = storage.getItem(DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY);
    storage.setItem(DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY, encoded);
    const verified = listDevicePublications(storage).find(
      (candidate) => candidate.slug === publication.slug,
    );
    if (verified?.revision.revision !== publication.revision.revision) {
      throw new Error('Publication registry verification failed');
    }
    return true;
  } catch {
    try {
      if (previous === null) {
        storage.removeItem(DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY);
      } else if (previous !== undefined) {
        storage.setItem(DEVICE_PUBLICATION_REGISTRY_STORAGE_KEY, previous);
      }
    } catch {
      // The original value remains the best available recovery source.
    }
    return false;
  }
}

export function getCurrentDevicePublication(
  storage: DeviceReadStorage,
): DevicePublication | null {
  try {
    const restored = readNewestMotusDraft(storage);
    return restored ? getDevicePublicationFromProject(restored.project) : null;
  } catch {
    return null;
  }
}

export function getDevicePublicationFromProject(
  project: MotusProject,
): DevicePublication | null {
  const revision = project.publications.find(
    (candidate) => candidate.revision === project.publishedRevision,
  );
  if (!revision) return null;
  return createDevicePublication(project.id, revision);
}

export function resolveDevicePublication(
  storage: DeviceReadStorage,
  slug: string,
): DevicePublication | null {
  if (!isDevicePublicationSlug(slug)) return null;
  const registered = listDevicePublications(storage).find(
    (publication) => publication.slug === slug,
  );
  const current = getCurrentDevicePublication(storage);
  const matchingCurrent = current?.slug === slug ? current : null;
  if (!registered) return matchingCurrent;
  if (!matchingCurrent) return registered;
  return [registered, matchingCurrent].sort(compareDevicePublications)[0];
}

export function parseDeviceFollowedSlugs(
  value: string | null,
  publication: Pick<DevicePublication, 'slug'>,
): Set<string> {
  if (!value) return new Set();
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .slice(0, MAX_DEVICE_PREFERENCE_ENTRIES)
        .filter(
          (candidate): candidate is string =>
            typeof candidate === 'string' &&
            (candidate === publication.slug ||
              isDevicePublicationSlug(candidate)),
        ),
    );
  } catch {
    return new Set();
  }
}

export function parseDeviceReadingProgress(
  value: string | null,
  publication: DevicePublication,
): Record<string, DeviceReadingProgress> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, DeviceReadingProgress> = {};
    for (const [slug, candidate] of Object.entries(parsed).slice(
      0,
      MAX_DEVICE_PREFERENCE_ENTRIES,
    )) {
      if (
        !isDevicePublicationSlug(slug) ||
        !candidate ||
        typeof candidate !== 'object' ||
        Array.isArray(candidate)
      ) {
        continue;
      }
      const progress = candidate as Record<string, unknown>;
      if (
        typeof progress.chapterId !== 'string' ||
        typeof progress.sceneId !== 'string' ||
        typeof progress.updatedAt !== 'string' ||
        !Number.isFinite(Date.parse(progress.updatedAt))
      ) {
        continue;
      }
      if (slug === publication.slug) {
        const chapter = publication.project.chapters.find(
          (item) => item.id === progress.chapterId,
        );
        if (!chapter?.scenes.some((scene) => scene.id === progress.sceneId)) {
          continue;
        }
      }
      result[slug] = {
        chapterId: progress.chapterId,
        sceneId: progress.sceneId,
        updatedAt: progress.updatedAt,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function getDevicePublicationCover(publication: DevicePublication) {
  const scenes = getProjectScenes(publication.project);
  const cover =
    scenes.find((scene) => scene.id === publication.source.coverSceneId) ??
    scenes[0];
  const accent =
    cover?.elements.find((element) => element.visible)?.fill ?? '#e5ff73';
  return {
    background: cover?.background ?? '#28223c',
    accent,
  };
}

export function cloneDevicePublication(publication: DevicePublication) {
  return {
    ...publication,
    revision: structuredClone(publication.revision),
    source: structuredClone(publication.source),
    project: cloneProject(publication.project),
  };
}
