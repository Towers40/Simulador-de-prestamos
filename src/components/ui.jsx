import { useEffect, useRef, useState } from 'react';

/* ---------- Logo (calculadora + moneda) ---------- */
export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#138a73" />
      <rect x="12" y="9" width="29" height="41" rx="6.5" fill="#fff" />
      <rect x="17" y="14" width="19" height="9.5" rx="2.5" fill="#138a73" />
      <g fill="#138a73">
        <circle cx="20.5" cy="31" r="2.6" />
        <circle cx="26.5" cy="31" r="2.6" />
        <circle cx="32.5" cy="31" r="2.6" />
        <circle cx="20.5" cy="38" r="2.6" />
        <circle cx="26.5" cy="38" r="2.6" />
        <circle cx="20.5" cy="45" r="2.6" />
      </g>
      <circle cx="44" cy="44" r="13.5" fill="#138a73" />
      <circle cx="44" cy="44" r="11" fill="#ef9b62" />
      <g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M47.8 39.9h-5a2.15 2.15 0 0 0 0 4.3h2.5a2.15 2.15 0 0 1 0 4.3h-5.2" />
        <path d="M44 37.4v13.4" />
      </g>
    </svg>
  );
}

/* ---------- Íconos de trazo (24px, 1.75) ---------- */
const paths = {
  arrowDown: <path d="M12 5v14m0 0-6-6m6 6 6-6" />,
  arrowRight: <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
  download: <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  zap: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
  shield: <path d="M12 3 5 6v5.5c0 4.3 3 7.9 7 9.5 4-1.6 7-5.2 7-9.5V6l-7-3Z" />,
  file: <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9.5 13h5M9.5 16.5h5" />,
  percent: (
    <>
      <path d="M18 6 6 18" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </>
  ),
  calendar: <path d="M7 3v3m10-3v3M4.5 9.5h15M6 5h12a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V6.5A1.5 1.5 0 0 1 6 5Z" />,
  coins: (
    <>
      <ellipse cx="9" cy="7" rx="5.5" ry="2.5" />
      <path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7" />
      <path d="M9.5 15.4c.9.4 2.1.6 3.5.6 3 0 5.5-1.1 5.5-2.5v-4c0-1.2-1.8-2.2-4.2-2.5" />
      <path d="M3.5 11v4c0 1.4 2.5 2.5 5.5 2.5 1 0 2-.1 2.8-.4" />
    </>
  ),
  trendDown: <path d="M3 7l6 6 4-4 8 8m0 0v-5.5m0 5.5h-5.5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </>
  ),
  bank: <path d="M3.5 9.5 12 4l8.5 5.5M5.5 10v7.5m4.33-7.5v7.5m4.34-7.5v7.5m4.33-7.5v7.5M3.5 20h17" />,
  external: <path d="M14 4h6v6m0-6-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />,
  refresh: <path d="M20 11a8 8 0 0 0-14.5-4.5M4 4v3.5h3.5M4 13a8 8 0 0 0 14.5 4.5M20 20v-3.5h-3.5" />,
  sparkle: <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9-5.7-1.8L10.2 9 12 3.5Z" />,
};

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.75 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/* ---------- Control segmentado con indicador deslizante ---------- */
export function Segmented({ options, value, onChange, label, size = 'md', className = '' }) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <div
      role="group"
      aria-label={label}
      className={`relative inline-grid rounded-full bg-field p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-1 top-1 rounded-full bg-white shadow-[0_1px_3px_rgba(23,33,31,0.12)] transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`relative z-10 whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${pad} ${
              active ? 'text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Slider ---------- */
export function RangeSlider({ min, max, step = 1, value, onChange, label, valueText }) {
  const safe = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  const pct = ((safe - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="range"
      min={min}
      max={max}
      step={step}
      value={safe}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={label}
      aria-valuetext={valueText}
      style={{ '--pct': `${pct}%` }}
    />
  );
}

/* ---------- Número animado (interpola entre valores) ---------- */
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function AnimatedNumber({ value, format, duration = 450, className }) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const from = current.current;
    if (!Number.isFinite(value) || !Number.isFinite(from) || from === value || reducedMotion()) {
      current.current = value;
      setDisplay(value);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      current.current = from + (value - from) * eased;
      setDisplay(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className={className}>{Number.isFinite(display) ? format(display) : '—'}</span>;
}

/* ---------- Campo con prefijo / sufijo ---------- */
export function InputShell({ prefix, suffix, children, invalid = false, className = '' }) {
  return (
    <div
      className={`flex h-14 items-center gap-2 rounded-2xl bg-field px-4 ring-1 transition focus-within:bg-white focus-within:ring-2 ${
        invalid ? 'ring-danger/60 focus-within:ring-danger/60' : 'ring-transparent focus-within:ring-brand-500/50'
      } ${className}`}
    >
      {prefix && <span className="text-lg font-medium text-ink-muted">{prefix}</span>}
      {children}
      {suffix && <span className="whitespace-nowrap text-sm font-medium text-ink-muted">{suffix}</span>}
    </div>
  );
}

export const inputClass =
  'w-full min-w-0 flex-1 bg-transparent text-xl font-semibold tracking-tight text-ink outline-none placeholder:font-normal placeholder:text-ink-muted/60';

/* ---------- Ayuda contextual "i" ---------- */
export function InfoButton({ open, onToggle, controls, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      title={label}
      className={`-my-1 inline-grid h-7 w-7 shrink-0 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
        open ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-brand-50 hover:text-brand-700'
      }`}
    >
      <Icon name="info" className="h-[17px] w-[17px]" strokeWidth={2} />
    </button>
  );
}

/** Panel explicativo que se despliega en línea (sin tapar contenido en móvil). */
export function InfoPanel({ id, open, title, children, onClose }) {
  return (
    <div className="collapsible" data-open={open}>
      <div inert={!open}>
        <div
          id={id}
          role="region"
          aria-label={title}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          className="mt-2.5 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-soft ring-1 ring-inset ring-line"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-ink">{title}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar explicación"
              className="-m-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-muted transition hover:bg-field hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              <Icon name="close" className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <div className="mt-1.5 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Pequeña muestra de color para leyendas (rect = barras/áreas, line = líneas). */
export function Swatch({ color, shape = 'rect' }) {
  return shape === 'line' ? (
    <span aria-hidden="true" className="inline-block h-[3px] w-3 shrink-0 rounded-full" style={{ background: color }} />
  ) : (
    <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
  );
}
