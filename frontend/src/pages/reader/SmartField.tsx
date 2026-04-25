// MARK: - SmartField (dev-only)
// A field (input or textarea) with the native caret hidden and a thicker
// blinking cyan caret overlaid via a hidden mirror div. Both the chapter
// title and chapter body use this so caret behavior is identical.
// The custom caret only renders while focused, so two carets can never
// appear at once.

import { useLayoutEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function SmartField({
  value, onChange, multiline = false, placeholder, className = '', style,
}: Props) {
  const fieldRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);

  // MARK: - Resize + caret update in one pass; preserves window scrollY around
  // the height reset so the page never jumps when the textarea recomputes.
  function update() {
    rafRef.current = null;
    const f = fieldRef.current;
    if (!f) return;

    if (multiline) {
      const sy = window.scrollY;
      f.style.height = 'auto';
      f.style.height = `${f.scrollHeight}px`;
      if (window.scrollY !== sy) window.scrollTo({ top: sy });
    }

    const mirror = mirrorRef.current;
    const caret = caretRef.current;
    if (!mirror || !caret) return;

    const cs = getComputedStyle(f);
    mirror.style.cssText =
      `position:absolute;visibility:hidden;top:0;left:0;pointer-events:none;` +
      `font:${cs.font};line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};` +
      `padding:${cs.padding};border:${cs.border};box-sizing:${cs.boxSizing};` +
      `width:${f.clientWidth}px;white-space:${multiline ? 'pre-wrap' : 'pre'};` +
      `word-wrap:break-word;overflow-wrap:break-word;`;

    const text = f.value;
    const pos = f.selectionStart ?? text.length;
    const before = text.slice(0, pos);
    mirror.textContent = before.endsWith('\n') ? before + '\u200b' : before;
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.appendChild(marker);

    caret.style.left = `${marker.offsetLeft}px`;
    caret.style.top = `${marker.offsetTop}px`;
    caret.style.height = cs.lineHeight;
    caret.classList.add('museum-caret--typing');
    window.clearTimeout((caret as unknown as { _t?: number })._t);
    (caret as unknown as { _t?: number })._t = window.setTimeout(
      () => caret.classList.remove('museum-caret--typing'),
      400,
    );
  }

  function schedule() {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(update);
  }

  // MARK: - One sync pass per value change. Resize always runs (programmatic
  // updates need it). Caret reposition only matters while focused.
  useLayoutEffect(() => {
    update();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused, multiline]);

  const baseClass =
    `block w-full border-0 bg-transparent p-0 text-[var(--text)] caret-transparent outline-none focus:ring-0 ${
      multiline ? 'resize-none overflow-hidden font-[inherit] text-[length:inherit] leading-[inherit]' : ''
    } ${className}`;

  const props = {
    ref: fieldRef,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onSelect: schedule,
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); schedule(); },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    spellCheck: false,
    placeholder,
    className: baseClass,
    style,
  };

  return (
    <div className="relative">
      {multiline ? <textarea {...props} /> : <input type="text" {...props} />}
      {focused && <span ref={caretRef} className="museum-caret" aria-hidden />}
      <div ref={mirrorRef} aria-hidden />
    </div>
  );
}

