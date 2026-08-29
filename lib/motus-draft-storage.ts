import { restoreNewestProject } from '@/lib/motus-model';

export const LEGACY_STORAGE_KEY = 'motus.project.v2';
export const DRAFT_SLOT_A_KEY = 'motus.project.slot.a.v4';
export const DRAFT_SLOT_B_KEY = 'motus.project.slot.b.v4';
export const DRAFT_POINTER_KEY = 'motus.project.active-slot.v4';

type DraftReadStorage = Pick<Storage, 'getItem'>;

export function readNewestMotusDraft(storage: DraftReadStorage) {
  const activeSlot = storage.getItem(DRAFT_POINTER_KEY) === 'b' ? 'b' : 'a';
  return restoreNewestProject([
    {
      source: 'legacy',
      value: storage.getItem(LEGACY_STORAGE_KEY),
      priority: -1,
    },
    {
      source: 'slot-a',
      value: storage.getItem(DRAFT_SLOT_A_KEY),
      priority: activeSlot === 'a' ? 1 : 0,
    },
    {
      source: 'slot-b',
      value: storage.getItem(DRAFT_SLOT_B_KEY),
      priority: activeSlot === 'b' ? 1 : 0,
    },
  ]);
}
