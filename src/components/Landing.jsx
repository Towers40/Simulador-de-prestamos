import { formatCompactCOP, formatCOP } from '../lib/format.js';
import { AnimatedNumber, Icon, LogoMark } from './ui.jsx';

const NAV_LINKS = [
  { href: '#simulador', label: 'Simulador' },
  { href: '#graficos', label: 'Gráfico' },
  { href: '#tabla', label: 'Tabla' },
  { href: '#mercado', label: 'Bancos' },
  { href: '#como-funciona', label: 'Cómo funciona' },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/80 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/70">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Principal">
        <a href="#inicio" className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50">
          <LogoMark className="h-8 w-8" />
          <span className="text-[15px] font-semibold tracking-tight text-ink">Simulador de Préstamos</span>
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm text-ink-soft transition hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href="#simulador"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 md:hidden"
        >
          Simular
        </a>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden">
      {/* Fondo suave decorativo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-100/70 to-transparent blur-3xl" />
        <div className="absolute -right-24 top-24 h-64 w-64 rounded-full bg-interest-soft blur-3xl" />
        <div className="absolute -left-20 top-48 h-56 w-56 rounded-full bg-extra-soft/80 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10 pt-12 text-center sm:px-6 sm:pb-14 sm:pt-20">
        <h1
          className="animate-fade-up text-balance text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl"
          style={{ animationDelay: '40ms' }}
        >
          Conoce tu cuota antes de pedir tu préstamo
        </h1>
        <p
          className="mx-auto mt-5 max-w-xl animate-fade-up text-pretty text-base leading-relaxed text-ink-soft sm:text-lg"
          style={{ animationDelay: '160ms' }}
        >
          Calcula tu cuota mensual, convierte entre tasas E.A., N.M.V. y mensual, descubre cuánto ahorras con abonos y
          compara las tasas reales de los bancos.
        </p>
        <div
          className="mt-8 flex animate-fade-up flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          style={{ animationDelay: '240ms' }}
        >
          <a
            href="#simulador"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,117,99,0.8)] transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2"
          >
            Simular mi préstamo
            <Icon name="arrowDown" className="h-4 w-4" strokeWidth={2.25} />
          </a>
          <a
            href="#como-funciona"
            className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-semibold text-ink-soft ring-1 ring-line transition hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            ¿Cómo funciona?
          </a>
        </div>
        <ul
          className="mx-auto mt-10 grid max-w-lg animate-fade-up grid-cols-3 gap-2 text-xs text-ink-muted sm:text-sm"
          style={{ animationDelay: '320ms' }}
        >
          {[
            { icon: 'zap', label: 'Cálculo en vivo' },
            { icon: 'percent', label: 'E.A. ⇄ N.M.V. ⇄ M.V.' },
            { icon: 'bank', label: 'Tasas de bancos' },
          ].map((f) => (
            <li key={f.label} className="flex flex-col items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-line/80">
                <Icon name={f.icon} className="h-[18px] w-[18px]" />
              </span>
              {f.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: 'percent',
    title: 'E.A., N.M.V. y mensual',
    body: 'Escribe la tasa como te la dio el banco y calculamos sus equivalentes. Para comparar ofertas, fíjate siempre en la E.A.',
    formula: 'N.M.V. = 12 × [(1 + E.A.)^(1/12) − 1]',
  },
  {
    icon: 'calendar',
    title: 'Cuota fija mensual',
    body: 'Usamos el sistema francés: pagas la misma cuota cada mes. Al principio pagas más intereses; al final, más capital.',
  },
  {
    icon: 'coins',
    title: 'Abonos que se notan',
    body: 'Cada abono extraordinario va directo a capital: conservas la cuota, pagas menos intereses y terminas antes.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
            Números claros para decidir con calma
          </h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon name={s.icon} />
                </span>
                <span className="text-sm font-medium tabular-nums text-ink-muted">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              {s.formula && (
                <p className="mt-4 rounded-xl bg-field px-3 py-2 font-mono text-xs text-ink-soft">{s.formula}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line/80 px-4 pb-28 pt-10 sm:px-6 lg:pb-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <span className="text-sm font-semibold text-ink">Simulador de Préstamos</span>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-ink-muted sm:text-right">
          Valores aproximados con fines informativos; no constituyen una oferta de crédito. © {new Date().getFullYear()}
        </p>
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
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-line/80 bg-white/90 p-2.5 pl-4 shadow-lift backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-ink-muted">
            Tu cuota mensual
            {sim?.interestSaved > 0 && (
              <span className="text-save"> · ahorras {formatCompactCOP(sim.interestSaved)}</span>
            )}
          </p>
          <p className="truncate text-lg font-semibold tracking-tight text-ink">
            {sim ? <AnimatedNumber value={sim.payment} format={formatCOP} /> : '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={onView}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          Ver resumen
          <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
