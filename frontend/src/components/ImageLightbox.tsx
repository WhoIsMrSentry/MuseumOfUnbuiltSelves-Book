import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string | null;
  alt?: string;
  onClose: () => void;
};

export default function ImageLightbox({ src, alt, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(4, +(s + 0.25).toFixed(2)));
      if (e.key === '-') setScale((s) => Math.max(0.25, +(s - 0.25).toFixed(2)));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    // reset when src changes
    setScale(1);
    setTx(0);
    setTy(0);
  }, [src]);

  // Prevent background scrolling while lightbox is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (src) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [src]);

  if (!src) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        // close when clicking backdrop
        if (e.target === containerRef.current) onClose();
      }}
      onWheel={(e) => { e.preventDefault(); }}
    >
      <div className="relative max-w-full max-h-full">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-20 rounded-md bg-white/10 px-3 py-1 text-sm text-white backdrop-blur"
        >
          Close
        </button>
        <div
          className="flex items-center justify-center touch-none cursor-grab overflow-hidden"
          onPointerDown={(e) => {
            // start drag
            dragging.current = true;
            last.current = { x: e.clientX, y: e.clientY };
            (e.target as Element).setPointerCapture?.(e.pointerId);
          }}
          onPointerUp={(e) => {
            dragging.current = false;
            last.current = null;
            (e.target as Element).releasePointerCapture?.(e.pointerId);
          }}
          onPointerCancel={() => {
            dragging.current = false;
            last.current = null;
          }}
          onPointerMove={(e) => {
            if (!dragging.current || !last.current) return;
            const dx = e.clientX - last.current.x;
            const dy = e.clientY - last.current.y;
            last.current = { x: e.clientX, y: e.clientY };
            setTx((t) => t + dx);
            setTy((t) => t + dy);
          }}
          onWheel={(e) => {
            e.preventDefault();
            const delta = -e.deltaY;
            setScale((s) => {
              const next = Math.min(4, Math.max(0.25, +(s + delta * 0.0015).toFixed(3)));
              return next;
            });
          }}
          style={{ width: 'min(90vw, 1200px)', height: 'min(80vh, 800px)' }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            style={{
              transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: dragging.current ? 'none' : 'transform 120ms ease-out',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            className="select-none pointer-events-none rounded"
          />
        </div>
        <div className="mt-2 flex gap-2 text-xs text-white/80">
          <button
            onClick={() => setScale((s) => Math.min(4, +(s + 0.25).toFixed(2)))}
            className="rounded bg-white/6 px-2 py-1"
          >
            Zoom +
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.25, +(s - 0.25).toFixed(2)))}
            className="rounded bg-white/6 px-2 py-1"
          >
            Zoom -
          </button>
          <button
            onClick={() => {
              setScale(1);
              setTx(0);
              setTy(0);
            }}
            className="rounded bg-white/6 px-2 py-1"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
