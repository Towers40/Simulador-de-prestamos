import { useMemo, useRef, useState } from 'react';
import { balancePoints, groupPeriods } from '../lib/finance.js';
import { formatCompactCOP, formatCOP } from '../lib/format.js';
import { Segmented, Swatch } from './ui.jsx';

const COLORS = {
  capital: '#138a73',
  interest: '#ef9b62',
  extra: '#6f63d3',
  baseline: '#a3aaa6',
};

const VB_W = 1000;
const VB_H = 300;

const niceStep = (raw) => {
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
};

const niceScale = (max, count = 3) => {
  if (!(max > 0)) return { top: 1, ticks: [0] };
  const step = niceStep(max / count);
  const top = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return { top, ticks };
};

const pickStep = (n, candidates, maxLabels = 6) => candidates.find((s) => n / s <= maxLabels) ?? candidates.at(-1);
const MONTH_STEPS = [1, 2, 3, 6, 12, 24, 36, 60, 120];
const YEAR_STEPS = [1, 2, 5, 10];

function ReadoutItem({ color, shape, label, value }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-ink-muted">
        {color && <Swatch color={color} shape={shape} />}
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-ink sm:text-[15px]">{value}</dd>
    </div>
  );
}

function YAxis({ scale }) {
  return scale.ticks.map((t) => {
    const pct = (t / scale.top) * 100;
    return (
      <div key={t}>
        <div
          className={`absolute left-12 right-0 h-px ${t === 0 ? 'bg-[#d5d3cb]' : 'bg-line'}`}
          style={{ bottom: `${pct}%` }}
        />
        <span
          className="absolute left-0 w-10 text-right text-[11px] leading-none tabular-nums text-ink-muted"
          style={{ bottom: `calc(${pct}% - 5px)` }}
        >
          {formatCompactCOP(t)}
        </span>
      </div>
    );
  });
}

export function PaymentsChart({ sim }) {
  const [view, setView] = useState('payments');
  const [granularityPref, setGranularityPref] = useState(null);
  const [active, setActive] = useState(null);
  const plotRef = useRef(null);

  const hasExtras = sim.totalExtra > 0;
  const granularity = granularityPref ?? (sim.baselineRows.length > 60 ? 'year' : 'month');
  const unit = granularity === 'month' ? 'mes' : 'año';

  const periods = useMemo(() => groupPeriods(sim.rows, granularity), [sim.rows, granularity]);
  const points = useMemo(() => balancePoints(sim, granularity), [sim, granularity]);

  const count = view === 'payments' ? periods.length : points.length;
  const activeIdx = active != null && active < count ? active : null;

  /* ---------- Escalas ---------- */
  const barScale = useMemo(
    () => niceScale(Math.max(...periods.map((p) => p.capital + p.interest + p.extra))),
    [periods],
  );
  const balanceScale = useMemo(() => niceScale(sim.principal), [sim.principal]);
  const horizon = sim.baselineRows.length;

  /* ---------- Interacción ---------- */
  const indexAt = (clientX) => {
    const rect = plotRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    if (view === 'payments') return Math.min(count - 1, Math.floor(ratio * count));
    const month = ratio * horizon;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(points[i].month - month) < Math.abs(points[best].month - month)) best = i;
    }
    return best;
  };

  const pointerHandlers = {
    onPointerDown: (e) => setActive(indexAt(e.clientX)),
    onPointerMove: (e) => setActive(indexAt(e.clientX)),
    onPointerLeave: (e) => {
      if (e.pointerType === 'mouse') setActive(null);
    },
    onKeyDown: (e) => {
      const last = count - 1;
      const moves = {
        ArrowRight: (a) => (a == null ? 0 : Math.min(last, a + 1)),
        ArrowLeft: (a) => (a == null ? last : Math.max(0, a - 1)),
        Home: () => 0,
        End: () => last,
        Escape: () => null,
      };
      if (moves[e.key]) {
        e.preventDefault();
        setActive((a) => moves[e.key](a != null && a < count ? a : null));
      }
    },
  };

  const switchView = (v) => {
    setView(v);
    setActive(null);
  };
  const switchGranularity = (g) => {
    setGranularityPref(g);
    setActive(null);
  };

  /* ---------- Lectura (leyenda + valores) ---------- */
  let title;
  let subtitle = '';
  let items;

  if (view === 'payments') {
    const p = activeIdx != null ? periods[activeIdx] : null;
    if (p) {
      title = p.label;
      if (granularity === 'year') subtitle = ` · meses ${p.from}–${p.to}`;
      items = [
        { key: 'capital', color: COLORS.capital, label: 'Capital', value: formatCOP(p.capital) },
        { key: 'interest', color: COLORS.interest, label: 'Interés', value: formatCOP(p.interest) },
        hasExtras && { key: 'extra', color: COLORS.extra, label: 'Abono', value: formatCOP(p.extra) },
        { key: 'balance', label: 'Saldo al cierre', value: formatCOP(p.balance) },
      ];
    } else {
      title = 'Todo el préstamo';
      items = [
        { key: 'capital', color: COLORS.capital, label: 'Capital en cuotas', value: formatCOP(sim.principal - sim.totalExtra) },
        { key: 'interest', color: COLORS.interest, label: 'Intereses', value: formatCOP(sim.totalInterest) },
        hasExtras && { key: 'extra', color: COLORS.extra, label: 'Abonos', value: formatCOP(sim.totalExtra) },
        { key: 'total', label: 'Total pagado', value: formatCOP(sim.totalPaid) },
      ];
    }
  } else {
    const pt = activeIdx != null ? points[activeIdx] : null;
    if (pt) {
      title = pt.label;
      items = [
        { key: 'balance', color: COLORS.capital, shape: 'line', label: hasExtras ? 'Saldo con abonos' : 'Saldo', value: formatCOP(pt.balance) },
        hasExtras && { key: 'baseline', color: COLORS.baseline, shape: 'line', label: 'Sin abonos', value: formatCOP(pt.baseline) },
        { key: 'paid', label: 'Capital pagado', value: formatCOP(sim.principal - pt.balance) },
      ];
    } else if (hasExtras) {
      title = '¿Cuándo terminas de pagar?';
      items = [
        { key: 'actual', color: COLORS.capital, shape: 'line', label: 'Con abonos', value: `Mes ${sim.rows.length}` },
        { key: 'baseline', color: COLORS.baseline, shape: 'line', label: 'Sin abonos', value: `Mes ${sim.baselineRows.length}` },
        { key: 'start', label: 'Saldo inicial', value: formatCOP(sim.principal) },
      ];
    } else {
      title = 'Evolución de tu deuda';
      items = [
        { key: 'start', label: 'Saldo inicial', value: formatCOP(sim.principal) },
        { key: 'end', label: 'Terminas de pagar', value: `Mes ${sim.rows.length}` },
      ];
    }
  }
  items = items.filter(Boolean);

  /* ---------- Eje X ---------- */
  let xTicks;
  if (view === 'payments') {
    const step = pickStep(periods.length, granularity === 'month' ? MONTH_STEPS : YEAR_STEPS);
    xTicks = periods
      .map((p, i) => ({ key: p.key, label: p.tick, left: ((i + 0.5) / periods.length) * 100 }))
      .filter((t) => t.key % step === 0 || (t.key === 1 && step >= 3));
  } else {
    const stepMonths =
      granularity === 'month' ? pickStep(horizon, MONTH_STEPS) : pickStep(horizon / 12, YEAR_STEPS) * 12;
    xTicks = [];
    for (let m = stepMonths; m <= horizon; m += stepMonths) {
      xTicks.push({ key: m, label: String(granularity === 'month' ? m : m / 12), left: (m / horizon) * 100 });
    }
  }

  /* ---------- Geometría de la curva de saldo ---------- */
  const curve = useMemo(() => {
    const x = (m) => (m / horizon) * VB_W;
    const y = (v) => VB_H - (v / balanceScale.top) * VB_H;
    // La curva con abonos termina exactamente en el mes de pago, aunque se agrupe por año.
    const payoffMonth = sim.rows.length;
    const actual = [...points.filter((p) => p.month < payoffMonth), { month: payoffMonth, balance: 0 }];
    const line = actual.map((p, i) => `${i ? 'L' : 'M'}${x(p.month).toFixed(2)},${y(p.balance).toFixed(2)}`).join('');
    const area = `${line}L${x(payoffMonth).toFixed(2)},${VB_H}L0,${VB_H}Z`;
    const base = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.month).toFixed(2)},${y(p.baseline).toFixed(2)}`).join('');
    return { line, area, base };
  }, [points, horizon, balanceScale.top, sim.rows.length]);

  const dense = periods.length > 120 ? 0 : periods.length > 60 ? 0.5 : 1;
  const growStagger = Math.min(8, 360 / Math.max(1, periods.length));

  return (
    <section id="graficos" className="card scroll-mt-24 p-5 sm:p-7" aria-labelledby="graficos-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Visualización</p>
          <h2 id="graficos-title" className="mt-1.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {view === 'payments' ? 'Así se reparten tus cuotas' : 'Así baja tu deuda'}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="[@media(hover:hover)]:hidden">Toca o desliza sobre</span>
            <span className="hidden [@media(hover:hover)]:inline">Pasa el cursor sobre</span> el gráfico para ver
            cada {unit}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            label="Tipo de gráfico"
            value={view}
            onChange={switchView}
            options={[
              { value: 'payments', label: 'Cuotas' },
              { value: 'balance', label: 'Saldo' },
            ]}
          />
          <Segmented
            size="sm"
            label="Agrupar por"
            value={granularity}
            onChange={switchGranularity}
            options={[
              { value: 'month', label: 'Mes' },
              { value: 'year', label: 'Año' },
            ]}
          />
        </div>
      </div>

      {/* Lectura: actúa como leyenda y como tooltip fijo (no tapa el gráfico en móvil). */}
      <div className="mt-5 rounded-2xl bg-field/70 p-4">
        <div className="flex min-h-[1.5rem] items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">
            {title}
            <span className="font-normal text-ink-muted">{subtitle}</span>
          </p>
          {activeIdx != null && (
            <button
              type="button"
              onClick={() => setActive(null)}
              className="rounded-full px-2 py-0.5 text-xs font-medium text-brand-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              Ver total
            </button>
          )}
        </div>
        <dl
          className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-12"
          aria-live="polite"
        >
          {items.map(({ key, ...rest }) => (
            <ReadoutItem key={key} {...rest} />
          ))}
        </dl>
      </div>

      {/* Gráfico */}
      <div className="relative mt-6 h-60 select-none sm:h-72">
        <div className="absolute inset-x-0 bottom-7 top-1">
          <YAxis scale={view === 'payments' ? barScale : balanceScale} />

          <div
            ref={plotRef}
            role="group"
            tabIndex={0}
            aria-roledescription="gráfico interactivo"
            aria-label={`${view === 'payments' ? 'Composición de las cuotas' : 'Saldo de la deuda'} por ${unit}. Usa las flechas para recorrer los periodos.`}
            className="absolute bottom-0 left-12 right-0 top-0 cursor-crosshair touch-pan-y rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-4"
            {...pointerHandlers}
          >
            {view === 'payments' ? (
              <div className="absolute inset-0 flex items-end">
                {periods.map((p, i) => {
                  const total = p.capital + p.interest + p.extra;
                  const dim = activeIdx != null && activeIdx !== i;
                  return (
                    <div
                      key={`${granularity}-${p.key}`}
                      className="flex h-full min-w-0 flex-1 items-end justify-center"
                      style={{ paddingInline: dense }}
                    >
                      <div
                        className="flex w-full max-w-[24px] origin-bottom animate-grow flex-col-reverse gap-[2px] overflow-hidden rounded-t-[4px] transition-[height,opacity] duration-500 ease-out"
                        style={{
                          height: `${(total / barScale.top) * 100}%`,
                          opacity: dim ? 0.32 : 1,
                          animationDelay: `${Math.round(i * growStagger)}ms`,
                        }}
                      >
                        {['capital', 'interest', 'extra'].map((k) =>
                          p[k] > 0.005 * total ? (
                            <span
                              key={k}
                              className="min-h-0 basis-0 transition-[flex-grow] duration-500 ease-out"
                              style={{ flexGrow: p[k], background: COLORS[k] }}
                            />
                          ) : null,
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <svg
                  viewBox={`0 0 ${VB_W} ${VB_H}`}
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full overflow-visible"
                  aria-hidden="true"
                >
                  <path d={curve.area} fill={COLORS.capital} fillOpacity="0.1" />
                  {hasExtras && (
                    <path
                      d={curve.base}
                      fill="none"
                      stroke={COLORS.baseline}
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  <path
                    d={curve.line}
                    fill="none"
                    stroke={COLORS.capital}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                {activeIdx != null && (
                  <>
                    <div
                      className="pointer-events-none absolute bottom-0 top-0 w-px bg-ink/25"
                      style={{ left: `${(points[activeIdx].month / horizon) * 100}%` }}
                    />
                    {hasExtras && (
                      <span
                        className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-white"
                        style={{
                          left: `${(points[activeIdx].month / horizon) * 100}%`,
                          bottom: `${(points[activeIdx].baseline / balanceScale.top) * 100}%`,
                          background: COLORS.baseline,
                        }}
                      />
                    )}
                    <span
                      className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-white"
                      style={{
                        left: `${(points[activeIdx].month / horizon) * 100}%`,
                        bottom: `${(points[activeIdx].balance / balanceScale.top) * 100}%`,
                        background: COLORS.capital,
                      }}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Eje X */}
        <div className="absolute bottom-0 left-0 w-10 text-right text-[11px] leading-6 text-ink-muted">
          {granularity === 'month' ? 'Mes' : 'Año'}
        </div>
        <div className="absolute bottom-0 left-12 right-0 h-6">
          {xTicks.map((t) => (
            <span
              key={t.key}
              className="absolute -translate-x-1/2 text-[11px] leading-6 tabular-nums text-ink-muted"
              style={{ left: `${t.left}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {view === 'payments' && (
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          Al inicio la mayor parte de cada cuota se va en intereses; con el tiempo, el capital toma el relevo.
        </p>
      )}
    </section>
  );
}
