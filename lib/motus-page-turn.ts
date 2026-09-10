/** Physical sheet geometry: the departing leaf pivots at the center spine. */
export function getPageTurnGeometry(entryEdge: 'left' | 'right') {
  const fromRight = entryEdge === 'right';
  return {
    departingSide: entryEdge,
    landingSide: fromRight ? 'left' : 'right',
    departingIndex: fromRight ? 1 : 0,
    landingIndex: fromRight ? 0 : 1,
    rotation: fromRight ? -180 : 180,
    slideSign: fromRight ? 1 : -1,
  } as const;
}
