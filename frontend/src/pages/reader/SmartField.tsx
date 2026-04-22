// MARK: - SmartField (dev-only)
// A field (single-line <input> or multiline <textarea>) that hides the native
// caret and overlays a thicker blinking cyan caret. Used by both the chapter
// title and the chapter body so they share identical caret behavior.
// The caret only renders while the field has focus, so switching focus
// between fields never shows two carets at once.

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [focused, setFocused] = useState(false);

  // MARK: - Auto-resize textarea
  const autoSize = useCallback(() => {
    const f = fieldRef.current;
    if (!f || !multiline) return;
    f.style.height = 'auto';
    f.style.height = `${f.scrollHeight}px`;
  }, [multiline]);
  useEffect(() => { autoSize(); }, [value, autoSize]);

  // MARK: - Position caret using a hidden mirror that copies field metrics
  const updateCaret = useCallback(() => {
    const f = fieldRef.current;
    const mirror = mirrorRef.current;
    const caret = caretRef.current;
    if (!f || !mirror || !caret) return;

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

  useEffect(() => { if (focused) updateCaret(); }, [focused, value, updateCaret]);

  const baseClass = `block w-full border-0 bg-transparent p-0 text-[var(--text)] caret-transparent outline-none focus:ring-0 ${
    multiline ? 'resize-none font-[inherit] text-[length:inherit] leading-[inherit]' : ''
  } ${className}`;

  const sharedProps = {
    ref: fieldRef,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
      autoSize();
      updateCaret();
    },
    onKeyUp: updateCaret,
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); updateCaret(); },
    onFocus: () => { setFocused(true); updateCaret(); },
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
