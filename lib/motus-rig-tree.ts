import type { MotusElement } from './motus-model.ts';

export type FlatRigLayerRow = {
  element: MotusElement;
  depth: number;
};

export type VisibleRigLayerTreeRow = FlatRigLayerRow & {
  childIds: readonly string[];
  firstChildId: string | null;
  hasChildren: boolean;
  isCollapsed: boolean;
  nextVisibleId: string | null;
  parentId: string | null;
  previousVisibleId: string | null;
};

export type CollapsibleRigLayerTree = {
  /** Existing branch IDs that are actively collapsed, in row order. */
  activeCollapsedIds: readonly string[];
  /** Maps any retained row to itself or its nearest visible collapsed ancestor. */
  focusTargetIdByElementId: ReadonlyMap<string, string>;
  rowById: ReadonlyMap<string, VisibleRigLayerTreeRow>;
  rows: readonly VisibleRigLayerTreeRow[];
};

type NormalizedRigLayerNode = FlatRigLayerRow & {
  childIds: string[];
  parentId: string | null;
};

/**
 * Derives a collapsible tree view from rows that are already in depth-first
 * display order. Depth is normalized iteratively so malformed input cannot
 * introduce recursive traversal or cyclic keyboard relationships.
 */
export function buildCollapsibleRigLayerTree(
  fullRows: readonly FlatRigLayerRow[],
  collapsedIds: Iterable<string> = [],
): CollapsibleRigLayerTree {
  const nodes: NormalizedRigLayerNode[] = [];
  const nodeById = new Map<string, NormalizedRigLayerNode>();
  const ancestorIds: string[] = [];

  for (const source of fullRows) {
    const element = source?.element;
    if (
      !element ||
      typeof element.id !== 'string' ||
      !element.id ||
      nodeById.has(element.id)
    ) {
      continue;
    }
    const requestedDepth = Number.isFinite(source.depth)
      ? Math.max(0, Math.floor(source.depth))
      : 0;
    const depth = Math.min(requestedDepth, ancestorIds.length);
    ancestorIds.length = depth;
    const parentId = depth > 0 ? (ancestorIds[depth - 1] ?? null) : null;
    const node: NormalizedRigLayerNode = {
      element,
      depth,
      childIds: [],
      parentId,
    };
    nodes.push(node);
    nodeById.set(element.id, node);
    if (parentId) nodeById.get(parentId)?.childIds.push(element.id);
    ancestorIds.push(element.id);
  }

  const requestedCollapsedIds = new Set(collapsedIds);
  const activeCollapsedIds = nodes
    .filter(
      (node) =>
        node.childIds.length > 0 && requestedCollapsedIds.has(node.element.id),
    )
    .map((node) => node.element.id);
  const activeCollapsedIdSet = new Set(activeCollapsedIds);
  const visibilityById = new Map<string, boolean>();
  const focusTargetIdByElementId = new Map<string, string>();
  const visibleNodes: NormalizedRigLayerNode[] = [];

  for (const node of nodes) {
    const parentVisible = node.parentId
      ? visibilityById.get(node.parentId) === true
      : true;
    const visible = Boolean(
      parentVisible &&
      (!node.parentId || !activeCollapsedIdSet.has(node.parentId)),
    );
    visibilityById.set(node.element.id, visible);
    if (visible) {
      visibleNodes.push(node);
      focusTargetIdByElementId.set(node.element.id, node.element.id);
      continue;
    }
    const parentTarget = node.parentId
      ? focusTargetIdByElementId.get(node.parentId)
      : undefined;
    if (parentTarget) {
      focusTargetIdByElementId.set(node.element.id, parentTarget);
    }
  }

  const rows = visibleNodes.map<VisibleRigLayerTreeRow>((node, index) => ({
    element: node.element,
    depth: node.depth,
    childIds: [...node.childIds],
    firstChildId: node.childIds[0] ?? null,
    hasChildren: node.childIds.length > 0,
    isCollapsed: activeCollapsedIdSet.has(node.element.id),
    nextVisibleId: visibleNodes[index + 1]?.element.id ?? null,
    parentId: node.parentId,
    previousVisibleId: visibleNodes[index - 1]?.element.id ?? null,
  }));

  return {
    activeCollapsedIds,
    focusTargetIdByElementId,
    rowById: new Map(rows.map((row) => [row.element.id, row])),
    rows,
  };
}
