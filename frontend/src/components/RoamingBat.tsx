import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MOBILE_MQ } from '@/utils/batTransition';
import './bat.css';
const DESKTOP_BAT_SCALE = 4;
const MOBILE_BAT_SCALE = 2.5;
const READER_CONTENT_MAX = 768;
const LIBRARY_CONTENT_MAX = 1024;

function isMobileViewport() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function batMetrics() {
  const mobile = isMobileViewport();
  const scale = mobile ? MOBILE_BAT_SCALE : DESKTOP_BAT_SCALE;
  const offset = 32 * scale;
  return { mobile, scale, padding: offset + 16 };
}

type Point = { x: number; y: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function contentWidth(pathname: string) {
  return pathname.includes('/reader/') ? READER_CONTENT_MAX : LIBRARY_CONTENT_MAX;
}

function flyBounds(pathname: string, padding: number): Bounds {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const panel = Math.min(vw, contentWidth(pathname));
  const side = (vw - panel) / 2;
  const sideRoom = side - padding;

  if (sideRoom >= 40) {
    const useLeft = Math.random() < 0.5;
    const minX = useLeft ? padding : side + panel + padding;
    const maxX = useLeft ? side - padding : vw - padding;
    return { minX, maxX: Math.max(minX, maxX), minY: padding, maxY: Math.max(padding, vh - padding) };
  }

  const topEnd = Math.max(padding, Math.min(vh * 0.16, 96));
  const bottomStart = Math.min(vh - padding, Math.max(vh * 0.84, vh - 96));
  const useTop = Math.random() < 0.5;

  return {
    minX: padding,
    maxX: Math.max(padding, vw - padding),
    minY: useTop ? padding : bottomStart,
    maxY: useTop ? topEnd : Math.max(padding, vh - padding),
  };
}

function nextPoint(current: Point, bounds: Bounds): Point {
  let x = randomBetween(bounds.minX, bounds.maxX);
  let y = randomBetween(bounds.minY, bounds.maxY);

  const minDistance = Math.min(window.innerWidth, window.innerHeight) * 0.08;
  let attempts = 0;
  while (attempts < 8) {
    const dx = x - current.x;
    const dy = y - current.y;
    if (Math.hypot(dx, dy) >= minDistance) break;
    x = randomBetween(bounds.minX, bounds.maxX);
    y = randomBetween(bounds.minY, bounds.maxY);
    attempts += 1;
  }

  return { x, y };
}

export default function RoamingBat() {
  const { pathname } = useLocation();
  const hideOnMobileReader = pathname.includes('/reader/') && isMobileViewport();
  const [{ padding }, setMetrics] = useState(batMetrics);
  const [position, setPosition] = useState<Point>(() => {
    const { padding: p } = batMetrics();
    const bounds = flyBounds(pathname, p);
    return {
      x: randomBetween(bounds.minX, bounds.maxX),
      y: randomBetween(bounds.minY, bounds.maxY),
    };
  });
  const [facingLeft, setFacingLeft] = useState(false);
  const positionRef = useRef(position);
  const paddingRef = useRef(padding);
  const mobileRef = useRef(isMobileViewport());
  const pathnameRef = useRef(pathname);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    paddingRef.current = padding;
  }, [padding]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onResize = () => {
      const metrics = batMetrics();
      mobileRef.current = metrics.mobile;
      paddingRef.current = metrics.padding;
      setMetrics(metrics);
    };
    mq.addEventListener('change', onResize);
    window.addEventListener('resize', onResize);
    return () => {
      mq.removeEventListener('change', onResize);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (pathname.includes('/reader/') && isMobileViewport()) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const wander = () => {
      const bounds = flyBounds(pathnameRef.current, paddingRef.current);
      const target = nextPoint(positionRef.current, bounds);
      setFacingLeft(target.x < positionRef.current.x);
      setPosition(target);

      const delay = randomBetween(2800, 6200);
      timeoutRef.current = window.setTimeout(wander, delay);
    };

    const metrics = batMetrics();
    mobileRef.current = metrics.mobile;
    paddingRef.current = metrics.padding;
    const bounds = flyBounds(pathname, metrics.padding);
    setPosition({
      x: randomBetween(bounds.minX, bounds.maxX),
      y: randomBetween(bounds.minY, bounds.maxY),
    });
    timeoutRef.current = window.setTimeout(wander, randomBetween(1200, 2400));

    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  if (hideOnMobileReader) return null;

  return (
    <div aria-hidden className="roaming-bat pointer-events-none fixed inset-0 z-[5]">
      <div
        className="roaming-bat__sprite"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) scaleX(${facingLeft ? -1 : 1})`,
          transition:
            'left 2.8s cubic-bezier(0.45, 0.05, 0.25, 1), top 2.8s cubic-bezier(0.45, 0.05, 0.25, 1), transform 0.4s ease',
        }}
      >
        <div className="bat" />
      </div>
    </div>
  );
}
