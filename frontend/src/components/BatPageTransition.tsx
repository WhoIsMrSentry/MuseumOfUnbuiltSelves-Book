import { useEffect, useState, type CSSProperties } from 'react';
import { BAT_COUNT, BAT_SPAWN_INTERVAL_MS, BAT_WING_CYCLE_MS } from '@/utils/batTransition';
import './bat.css';

type BatSpot = {
  id: number;
  x: number;
  y: number;
  flip: boolean;
};

type BatLayout = {
  spots: BatSpot[];
  scale: number;
};

const SPRITE_W = 64;
const SPRITE_H = 54;
const BAT_GAP = 14;

function rectsOverlap(
  a: { x: number; y: number },
  b: { x: number; y: number },
  w: number,
  h: number,
) {
  return Math.abs(a.x - b.x) < w && Math.abs(a.y - b.y) < h;
}

function computeBatLayout(count: number): BatLayout {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const padX = vw * 0.1;
  const padY = vh * 0.09;
  const cols = 2;
  const rows = Math.ceil(count / cols);
  const colW = (vw - padX * 2) / cols;
  const rowH = (vh - padY * 2) / rows;

  const maxScale = Math.min(
    (colW - BAT_GAP) / SPRITE_W,
    (rowH - BAT_GAP) / SPRITE_H,
    2.2,
  );
  const scale = Math.max(1.35, Math.floor(maxScale * 100) / 100);
  const boxW = SPRITE_W * scale + BAT_GAP;
  const boxH = SPRITE_H * scale + BAT_GAP;

  const slots: { x: number; y: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (slots.length >= count) break;
      const stagger = row % 2 === 0 ? -colW * 0.06 : colW * 0.06;
      slots.push({
        x: padX + colW * (col + 0.5) + stagger,
        y: padY + rowH * (row + 0.5),
      });
    }
  }

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (rectsOverlap(slots[i], slots[j], boxW, boxH)) {
        const tighter = Math.max(1.2, scale - 0.1);
        return computeBatLayoutWithScale(count, tighter, vw, vh);
      }
    }
  }

  const spots = slots.map((slot, id) => ({
    id,
    x: (slot.x / vw) * 100,
    y: (slot.y / vh) * 100,
    flip: id % 2 === 0,
  }));

  return { spots, scale };
}

function computeBatLayoutWithScale(
  count: number,
  scale: number,
  vw: number,
  vh: number,
): BatLayout {
  const padX = vw * 0.1;
  const padY = vh * 0.09;
  const cols = 2;
  const rows = Math.ceil(count / cols);
  const colW = (vw - padX * 2) / cols;
  const rowH = (vh - padY * 2) / rows;
  const boxW = SPRITE_W * scale + BAT_GAP;
  const boxH = SPRITE_H * scale + BAT_GAP;

  const spots: BatSpot[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (spots.length >= count) break;
      const stagger = row % 2 === 0 ? -colW * 0.05 : colW * 0.05;
      const x = padX + colW * (col + 0.5) + stagger;
      const y = padY + rowH * (row + 0.5);

      const overlaps = spots.some((spot) => {
        const sx = (spot.x / 100) * vw;
        const sy = (spot.y / 100) * vh;
        return rectsOverlap({ x, y }, { x: sx, y: sy }, boxW, boxH);
      });

      if (!overlaps) {
        spots.push({
          id: spots.length,
          x: (x / vw) * 100,
          y: (y / vh) * 100,
          flip: spots.length % 2 === 0,
        });
      }
    }
  }

  return { spots, scale };
}

export default function BatPageTransition({ active }: { active: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [layout, setLayout] = useState<BatLayout>({ spots: [], scale: 1.85 });

  useEffect(() => {
    if (!active) {
      setVisibleCount(0);
      setLayout({ spots: [], scale: 1.85 });
      return;
    }

    setLayout(computeBatLayout(BAT_COUNT));
    setVisibleCount(1);

    const interval = window.setInterval(() => {
      setVisibleCount((count) => {
        if (count >= BAT_COUNT) {
          window.clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, BAT_SPAWN_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [active]);

  if (!active) return null;

  const visibleBats = layout.spots.slice(0, visibleCount);

  const wingDelay = (id: number) =>
    -((id * BAT_SPAWN_INTERVAL_MS) % BAT_WING_CYCLE_MS) / 1000;

  return (
    <div
      aria-hidden
      className="bat-page-transition pointer-events-auto fixed inset-0 z-[90] bg-[var(--bg)]"
      style={{ '--bat-transition-scale': layout.scale } as CSSProperties}
    >
      {visibleBats.map((bat) => (
        <div
          key={bat.id}
          className="bat-page-transition__bat"
          style={{
            left: `${bat.x}%`,
            top: `${bat.y}%`,
            transform: `translate(-50%, -50%) scaleX(${bat.flip ? -1 : 1})`,
          }}
        >
          <div className="bat-page-transition__inner">
            <div
              className="bat bat--transition"
              style={{ animationDelay: `${wingDelay(bat.id)}s` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
