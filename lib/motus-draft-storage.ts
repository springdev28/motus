import { isUntouchedRetiredDemo } from './motus-demo-cleanup.ts';
import { restoreNewestProject } from './motus-model.ts';

export const LEGACY_STORAGE_KEY = 'motus.project.v2';
export const DRAFT_SLOT_A_KEY = 'motus.project.slot.a.v4';
export const DRAFT_SLOT_B_KEY = 'motus.project.slot.b.v4';
export const DRAFT_POINTER_KEY = 'motus.project.active-slot.v4';

type DraftReadStorage = Pick<Storage, 'getItem'> &
  Partial<Pick<Storage, 'removeItem'>>;

export function readNewestMotusDraft(storage: DraftReadStorage) {
  function readSlot(key: string) {
    const encoded = storage.getItem(key);
    if (!isUntouchedRetiredDemo(encoded)) return encoded;
    try {
      storage.removeItem?.(key);
    } catch {
      /* Ignore a retired demo even in read-only storage. */
    }
    return null;
  }
  const activeSlot = storage.getItem(DRAFT_POINTER_KEY) === 'b' ? 'b' : 'a';
  return restoreNewestProject([
    {
      source: 'legacy',
      value: readSlot(LEGACY_STORAGE_KEY),
      priority: -1,
    },
    {
      source: 'slot-a',
      value: readSlot(DRAFT_SLOT_A_KEY),
      priority: activeSlot === 'a' ? 1 : 0,
    },
    {
      source: 'slot-b',
      value: readSlot(DRAFT_SLOT_B_KEY),
      priority: activeSlot === 'b' ? 1 : 0,
    },
  ]);
}
