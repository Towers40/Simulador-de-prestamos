import { useEffect, useRef, useState } from 'react';
import { formatCompactCOP, formatCOP, formatPct } from '../lib/format.js';
import { MARKET_PRODUCTS, fetchMarketRates } from '../lib/market.js';
import { AnimatedNumber, Icon, LogoMark, img3d } from './ui.jsx';

const NAV_LINKS = [
  { href: '#simulador', label: 'Simulador' },
  { href: '#graficos', label: 'Gráfico' },
  { href: '#mercado', label: 'Bancos' },
  { href: '#como-funciona', label: 'Cómo funciona' },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Principal">
        <a
          href="#inicio"
          className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          <LogoMark className="h-8 w-8" />
          <span className="text-[15px] font-semibold tracking-tight text-ink">Simulador de Préstamos</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg text-[15px] text-ink transition hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href="#simulador"
          className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-ink ring-1 ring-inset ring-ink/80 transition hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          Simular
        </a>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden px-4 pb-20 pt-6 sm:px-6 sm:pb-28 sm:pt-12 lg:pt-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 top-0 h-[560px] w-[560px] rounded-full bg-brand-100/60 blur-3xl sm:right-0" />
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-4 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="order-2 lg:order-1">
          <h1 className="display-1 animate-fade-up" style={{ animationDelay: '40ms' }}>
            Conoce tu cuota antes de pedir tu préstamo
          </h1>
          <p className="lead mt-6 max-w-lg animate-fade-up" style={{ animationDelay: '140ms' }}>
            Calcula tu cuota mensual, convierte entre tasas E.A., N.M.V. y mensual, y compara las tasas reales de los
            bancos.
          </p>
          <div
            className="mt-10 flex animate-fade-up flex-col gap-2 sm:flex-row sm:items-center sm:gap-6"
            style={{ animationDelay: '220ms' }}
          >
            <a href="#simulador" className="btn-primary">
              Simular mi préstamo
            </a>
            <a
              href="#mercado"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl text-base font-medium text-ink transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              Ver tasas de bancos
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>
        <div className="order-1 animate-fade-up lg:order-2" style={{ animationDelay: '80ms' }}>
          <img
            src={img3d('hero')}
            width="1200"
            height="1080"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="mx-auto w-full max-w-[400px] select-none sm:max-w-[520px] lg:max-w-none"
            draggable="false"
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- Destacados (cuadrícula de tarjetas) ---------- */

const VIVIENDA = MARKET_PRODUCTS.find((p) => p.id === 'vivienda');
const VIVIENDA_VARIANT = VIVIENDA.variants.find((v) => v.id === VIVIENDA.defaultVariant);

/** Mejor tasa de vivienda de la semana (comparte la caché con la sección de bancos). */
function useBestHousingRate() {
  const ref = useRef(null);
  const [state, setState] = useState({ status: 'idle', row: null });
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    let ignore = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setState({ status: 'loading', row: null });
        fetchMarketRates(VIVIENDA, VIVIENDA_VARIANT)
          .then((data) => !ignore && setState({ status: data.rows[0] ? 'ready' : 'error', row: data.rows[0] ?? null }))
          .catch(() => !ignore && setState({ status: 'error', row: null }));
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(node);
    return () => {
      ignore = true;
      io.disconnect();
    };
  }, []);
  return [ref, state];
}

function RateHighlight() {
  const [ref, { status, row }] = useBestHousingRate();
  return (
    <a
      ref={ref}
      href="#mercado"
      className="block-xl group flex min-h-[300px] flex-col items-center justify-center bg-gradient-to-b from-white via-white to-brand-200 p-8 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 lg:min-h-0"
    >
      {status === 'error' ? (
        <>
          <span className="text-base font-medium text-brand-600">Compara</span>
          <span className="mt-1 text-7xl font-display tracking-[-0.04em] text-brand-600">Top 5</span>
          <span className="mt-2 text-base font-medium text-brand-600">tasas por producto</span>
        </>
      ) : (
        <>
          <span className="text-base font-medium text-brand-600">Vivienda desde</span>
          <span className="mt-1 text-7xl font-display tabular-nums tracking-[-0.04em] text-brand-600" aria-live="polite">
            {row ? formatPct(row.rate) : <span className="inline-block h-[72px] w-48 animate-pulse rounded-2xl bg-brand-50" />}
          </span>
          <span className="mt-2 text-base font-medium text-brand-600">
            {row ? `E.A. en ${row.name}` : 'Efectiva anual'}
          </span>
        </>
      )}
      <span className="mt-6 inline-flex items-center gap-1 text-sm text-ink-soft transition group-hover:text-ink">
        Ver las mejores tasas <Icon name="arrowRight" className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
    </a>
  );
}

function RatesCard() {
  return (
    <div className="block-xl relative flex min-h-[340px] flex-col justify-end overflow-hidden bg-white p-7 sm:p-8 lg:col-span-2">
      <img
        src={img3d('percent')}
        alt=""
        width="900"
        height="900"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute -right-6 -top-4 w-[62%] max-w-[320px] select-none sm:right-6 sm:top-1/2 sm:w-[44%] sm:-translate-y-1/2"
        draggable="false"
      />
      <div className="relative max-w-xs">
        <h3 className="title-3">E.A., N.M.V. y mensual</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Escribe la tasa como te la dio el banco y calculamos sus equivalentes al instante.
        </p>
      </div>
    </div>
  );
}

function ExtrasCard() {
  // Coordenadas en % para que el trazo se adapte al ancho sin deformar textos ni el marcador.
  const line = 'non-scaling-stroke';
  return (
    <div className="block-xl flex flex-col bg-white p-3 lg:col-span-2">
      <div
        className="relative h-48 rounded-3xl bg-field/60 sm:h-56"
        role="img"
        aria-label="Con abonos la deuda llega a cero antes que sin abonos"
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-5 bottom-10 top-10 h-[calc(100%-5rem)] w-[calc(100%-2.5rem)]" aria-hidden="true">
          {[25, 50, 75].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#e7e5df" strokeWidth="1" vectorEffect={line} />
          ))}
          <line x1="0" y1="100" x2="100" y2="100" stroke="#e7e5df" strokeWidth="1" vectorEffect={line} />
          <path d="M0,4 C45,6 78,42 100,100" fill="none" stroke="#9aa39f" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round" vectorEffect={line} />
          <path d="M0,4 C30,8 54,50 66,100" fill="none" stroke="#138a73" strokeWidth="3" strokeLinecap="round" vectorEffect={line} />
        </svg>
        <span className="absolute left-5 top-4 text-xs text-ink-muted">Tu deuda</span>
        <span
          aria-hidden="true"
          className="absolute bottom-10 left-[calc(1.25rem+(100%-2.5rem)*0.66)] h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full border-[4px] border-brand-500 bg-white"
        />
        <span className="absolute bottom-3 left-[calc(1.25rem+(100%-2.5rem)*0.66)] -translate-x-1/2 whitespace-nowrap text-xs font-medium text-brand-700">
          Con abonos
        </span>
        <span className="absolute bottom-3 right-5 text-xs text-ink-muted">Sin abonos</span>
      </div>
      <div className="px-4 pb-4 pt-5">
        <h3 className="title-3">Abonos que se notan</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Cada abono va directo a capital: pagas menos intereses y terminas antes.
        </p>
      </div>
    </div>
  );
}

function ScheduleCard({ sim }) {
  const rows = sim?.rows.slice(0, 3) ?? [];
  return (
    <div className="block-xl flex flex-col bg-white p-7 sm:p-8">
      <h3 className="title-3">Tu tabla, mes a mes</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">Cuánto va a capital y cuánto a intereses. Descárgala en PDF.</p>
      <ul className="mt-6 flex flex-1 flex-col justify-center gap-2.5" aria-label="Primeros meses de tu simulación">
        {(rows.length ? rows : [null, null, null]).map((r, i) => (
          <li
            key={i}
            className={`flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-inset transition ${
              i === 1 ? 'scale-[1.03] ring-brand-200' : 'ring-line'
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
              <Icon name="calendar" className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">{r ? formatCOP(r.payment) : '—'}</span>
              <span className="block text-xs text-ink-muted">Mes {r ? r.month : i + 1}</span>
            </span>
            {r && (
              <span className="shrink-0 rounded-lg bg-save-soft px-2 py-1 text-[11px] font-medium text-save">
                Capital {formatCompactCOP(r.capital)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Highlights({ sim }) {
  return (
    <section className="section pt-0 sm:pt-0 lg:pt-0" aria-labelledby="destacados-title">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="destacados-title" className="display-2">
            Decide con números claros
          </h2>
          <p className="lead mx-auto mt-5 max-w-md">Todo lo que necesitas saber antes de pedir un préstamo, en un solo lugar.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-3">
          <RateHighlight />
          <RatesCard />
          <ExtrasCard />
          <ScheduleCard sim={sim} />
        </div>
      </div>
    </section>
  );
}

/* ---------- Cómo funciona (bloque oscuro) ---------- */

const STEPS = [
  {
    title: 'E.A., N.M.V. y mensual',
    body: 'Escribe la tasa como te la dio el banco y calculamos sus equivalentes. Para comparar ofertas, fíjate siempre en la E.A.',
    formula: 'N.M.V. = 12 × [(1 + E.A.)^(1/12) − 1]',
  },
  {
    title: 'Cuota fija mensual',
    body: 'Usamos el sistema francés: pagas la misma cuota cada mes. Al principio pagas más intereses; al final, más capital.',
  },
  {
    title: 'Abonos a capital',
    body: 'Cada abono extraordinario reduce el saldo: conservas la cuota, pagas menos intereses y terminas antes.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-16 bg-ink px-4 py-20 text-white sm:px-6 sm:py-28 lg:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-24">
        <div>
          <h2 className="display-2 text-white">Así calculamos tu préstamo</h2>
          <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-white/65 sm:text-lg">
            Fórmulas financieras estándar, sin letra pequeña. Puedes verificar cada número en tu tabla.
          </p>
          <a
            href="#simulador"
            className="mt-10 inline-flex h-12 items-center rounded-2xl px-6 text-base font-medium text-white ring-1 ring-inset ring-white/70 transition hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            Simular ahora
          </a>
        </div>
        <ol className="space-y-10">
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3 className="text-lg font-display tracking-[-0.01em] text-white">{s.title}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">{s.body}</p>
              {s.formula && (
                <p className="mt-4 inline-block rounded-xl bg-white/10 px-3 py-2 font-mono text-xs text-white/80">{s.formula}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Pie de página ---------- */

const FOOTER_COLUMNS = [
  {
    title: 'Simulador',
    links: [
      { href: '#simulador', label: 'Simular préstamo' },
      { href: '#graficos', label: 'Gráfico de pagos' },
      { href: '#tabla', label: 'Tabla de amortización' },
    ],
  },
  {
    title: 'Mercado',
    links: [
      { href: '#mercado', label: 'Mejores tasas' },
      { href: '#como-funciona', label: 'Cómo funciona' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-white px-4 pb-28 pt-14 sm:px-6 lg:pb-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <span className="text-[15px] font-semibold text-ink">Simulador de Préstamos</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">Calcula, compara y decide con calma.</p>
          </div>
          <nav aria-label="Pie de página" className="grid grid-cols-2 gap-10 sm:gap-20">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-ink">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-sm text-ink-soft transition hover:text-brand-700">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs leading-relaxed text-ink-muted sm:flex-row sm:justify-between sm:gap-6">
          <p className="max-w-xl">Valores aproximados con fines informativos; no constituyen una oferta de crédito.</p>
          <p className="shrink-0">© {new Date().getFullYear()} Simulador de Préstamos</p>
        </div>
      </div>
    </footer>
  );
}

/** Barra inferior en móvil: muestra la cuota mientras se editan los datos. */
export function MobileSummaryBar({ visible, sim, onView }) {
  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-[120%]'
      }`}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-3xl bg-white/95 p-2.5 pl-4 shadow-lift ring-1 ring-line/80 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-ink-muted">
            Tu cuota mensual
            {sim?.interestSaved > 0 && <span className="text-save"> · ahorras {formatCompactCOP(sim.interestSaved)}</span>}
          </p>
          <p className="truncate text-lg font-semibold tracking-tight text-ink">
            {sim ? <AnimatedNumber value={sim.payment} format={formatCOP} /> : '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={onView}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-brand-600 px-4 text-sm font-medium text-white transition active:scale-[0.98]"
        >
          Ver resumen
          <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
