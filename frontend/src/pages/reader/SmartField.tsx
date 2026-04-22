// MARK: - SmartField (dev-only)
// A field (single-line <input> or multiline <textarea>) that hides the native
// caret and overlays a thicker blinking cyan caret. Used by both the chapter
// title and the chapter body so they share identical caret behavior.
// The caret only renders while the field has focus, so switching focus
// between fields never shows two carets at once.
// Updates to caret position and textarea auto-size are coalesced via
// requestAnimationFrame so bursts of keystrokes never trigger more than one
// layout pass per frame.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  centerOnType?: boolean;
};

export default function SmartField({
  value, onChange, multiline = false, placeholder, className = '', style, centerOnType = false,
}: Props) {
  const fieldRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);

  // MARK: - Heavy work: resize textarea + position caret. Done once per frame.
  const performUpdate = useCallback(() => {
    rafRef.current = null;
    const f = fieldRef.current;
    if (!f) return;

    if (multiline) {
      f.style.height = 'auto';
      f.style.height = `${f.scrollHeight}px`;
    }

    const mirror = mirrorRef.current;
    const caret = caretRef.current;
    if (!mirror || !caret) return;

    const cs = getComputedStyle(f);
    mirror.style.font = cs.font;
    mirror.style.lineHeight = cs.lineHeight;
    mirror.style.letterSpacing = cs.letterSpacing;
    mirror.style.padding = cs.padding;
    mirror.style.border = cs.border;
    mirror.style.boxSizing = cs.boxSizing;
    mirror.style.width = `${f.clientWidth}px`;
    mirror.style.whiteSpace = multiline ? 'pre-wrap' : 'pre';

    const text = f.value;
    const pos = f.selectionStart ?? text.length;
    const before = text.slice(0, pos);
    const safe = before.endsWith('\n') ? before + '\u200b' : before;
    mirror.textContent = safe;
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.appendChild(marker);

    const lineHeight = parseFloat(cs.lineHeight) || 24;
    caret.style.left = `${marker.offsetLeft}px`;
    caret.style.top = `${marker.offsetTop}px`;
    caret.style.height = `${lineHeight}px`;
    caret.classList.add('mystory-caret--typing');
    window.clearTimeout((caret as unknown as { _t?: number })._t);
    (caret as unknown as { _t?: number })._t = window.setTimeout(
      () => caret.classList.remove('mystory-caret--typing'),
      400,
    );

    if (centerOnType) {
      const caretY = f.getBoundingClientRect().top + marker.offsetTop;
      const target = window.innerHeight * 0.5;
      const delta = caretY - target;
      if (Math.abs(delta) > 1) {
        window.scrollBy({ top: delta, behavior: 'smooth' });
      }
    }
  }, [multiline, centerOnType]);

  const schedule = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(performUpdate);
  }, [performUpdate]);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  // MARK: - Sync after value changes (covers programmatic updates, mount, etc.)
  useLayoutEffect(() => { if (focused) schedule(); }, [focused, value, schedule]);

  const baseClass = `block w-full border-0 bg-transparent p-0 text-[var(--text)] caret-transparent outline-none focus:ring-0 ${
    multiline ? 'resize-none font-[inherit] text-[length:inherit] leading-[inherit]' : ''
  } ${className}`;

  const sharedProps = {
    ref: fieldRef,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    onKeyUp: schedule,
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); schedule(); },
    onFocus: () => { setFocused(true); schedule(); },
    onBlur: () => setFocused(false),
    spellCheck: false,
    placeholder,
    className: baseClass,
    style,
  };

  return (
    <div className="relative">
      {multiline
        ? <textarea {...sharedProps} />
        : <input type="text" {...sharedProps} />
      }
      {focused && <span ref={caretRef} className="mystory-caret" aria-hidden />}
      <div
        ref={mirrorRef}
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          top: 0,
          left: 0,
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
