'use client';
import {
  cloneElement,
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { getPageTurnGeometry } from '@/lib/motus-page-turn';

type Page = ReactElement<{ snapshot?: boolean }>;
type Props = {
  pageKey: string;
  pages: Page[];
  layout: 'page' | 'spread';
  direction: 'ltr' | 'rtl';
  transition: 'cut' | 'slide' | 'book';
  entryEdge: 'left' | 'right';
  durationMs: number;
};
export function MotusPageTurn(props: Props) {
  const [display, setDisplay] = useState({
    key: props.pageKey,
    pages: props.pages,
    layout: props.layout,
    direction: props.direction,
    previous: null as Page[] | null,
  });
  if (display.key !== props.pageKey) {
    setDisplay({
      key: props.pageKey,
      pages: props.pages,
      layout: props.layout,
      direction: props.direction,
      previous:
        props.transition !== 'cut' &&
        display.layout === props.layout &&
        display.direction === props.direction
          ? display.pages
          : null,
    });
  }
  useEffect(() => {
    if (!display.previous) return;
    const timer = window.setTimeout(
      () =>
        setDisplay((current) =>
          current.key === display.key
            ? { ...current, previous: null }
            : current,
        ),
      props.durationMs + 80,
    );
    return () => window.clearTimeout(timer);
  }, [display.key, display.previous, props.durationMs]);
  const physical = (pages: Page[]) => {
    const slots =
      props.layout === 'spread'
        ? [pages[0] ?? null, pages[1] ?? null]
        : [pages[0] ?? null];
    return props.layout === 'spread' && props.direction === 'rtl'
      ? slots.reverse()
      : slots;
  };
  const current = physical(props.pages);
  const previous = display.previous ? physical(display.previous) : null;
  const geometry = getPageTurnGeometry(props.entryEdge);
  const frozen = (page: Page | null) =>
    page ? cloneElement(page, { snapshot: true }) : null;
  const active = previous && props.transition !== 'cut';
  return (
    <div
      className="motus-page-turn"
      data-layout={props.layout}
      data-animation={active ? props.transition : 'cut'}
      data-edge={props.entryEdge}
      style={
        {
          '--page-duration': `${props.durationMs}ms`,
          '--page-rotation': `${geometry.rotation}deg`,
          '--slide-sign': geometry.slideSign,
        } as CSSProperties
      }
    >
      <div className="motus-page-base" key={props.pageKey}>
        {current.map((page, index) => (
          <div className="motus-page-slot" key={index}>
            {page}
          </div>
        ))}
      </div>
      {active ? (
        <div
          className="motus-page-snapshot"
          aria-hidden="true"
          inert
          key={`old-${props.pageKey}`}
        >
          {props.transition === 'slide' ? (
            <div className="motus-page-old-grid">
              {previous.map((page, index) => (
                <div className="motus-page-slot" key={index}>
                  {frozen(page)}
                </div>
              ))}
            </div>
          ) : (
            <>
              {props.layout === 'spread' ? (
                <div
                  className="motus-page-stationary"
                  data-side={geometry.landingSide}
                >
                  {frozen(previous[geometry.landingIndex])}
                </div>
              ) : null}
              <div
                className="motus-turning-leaf"
                data-side={geometry.departingSide}
                onAnimationEnd={() =>
                  setDisplay((state) => ({ ...state, previous: null }))
                }
              >
                <div className="motus-leaf-front">
                  {frozen(
                    previous[
                      props.layout === 'spread' ? geometry.departingIndex : 0
                    ],
                  )}
                </div>
                <div className="motus-leaf-back">
                  {props.layout === 'spread'
                    ? frozen(current[geometry.landingIndex])
                    : null}
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
