import { useEffect, useMemo, useRef, useState } from 'react';
import { annuityPayment, monthlyRateFromEA } from '../lib/finance.js';
import { formatCOP, formatDate, formatPct } from '../lib/format.js';
import { MARKET_PRODUCTS, TOP_N, fetchMarketRates } from '../lib/market.js';
import { Icon, Segmented } from './ui.jsx';

const timeFormatter = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const initials = (name) =>
  name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(banco|de|del|la|las|los)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();

function EntityLogo({ row, rank, best }) {
  const [failed, setFailed] = useState(false);
  const showImage = row.logo && !failed;
  return (
    <span className="relative mt-0.5 h-11 w-11 shrink-0 self-start">
      <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-line">
        {showImage ? (
          <img
            src={row.logo}
            alt=""
            width="44"
            height="44"
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm font-semibold tracking-tight text-ink-soft" aria-hidden="true">
            {initials(row.name)}
          </span>
        )}
      </span>
      <span
        className={`absolute -bottom-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums ring-2 ${
          best ? 'bg-brand-600 text-white ring-brand-50' : 'bg-field text-ink-muted ring-white'
        }`}
        aria-hidden="true"
      >
        {rank}
      </span>
    </span>
  );
}

function SkeletonRows() {
  return (
    <ol className="mt-2 divide-y divide-line" aria-hidden="true">
      {Array.from({ length: TOP_N }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 py-4">
          <span className="h-11 w-11 rounded-xl bg-field" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-2/5 rounded bg-field" />
            <span className="block h-3 w-1/4 rounded bg-field" />
          </span>
          <span className="h-5 w-16 rounded bg-field" />
        </li>
      ))}
    </ol>
  );
}

function EntityRow({ row, index, kind, amount, months, currentPayment, days, onUseRate }) {
  const best = index === 0;
  const monthly = monthlyRateFromEA(row.rate);
  const nmv = monthly * 1200;

  let detail = null;
  if (kind === 'credit' && amount > 0 && months > 0) {
    const payment = annuityPayment(amount, monthly, months);
    const diff = payment - currentPayment;
    detail = (
      <>
        Tu cuota con esta tasa: <strong className="font-semibold text-ink">{formatCOP(payment)}</strong>
        {Number.isFinite(currentPayment) && Math.abs(diff) >= 1 && (
          <span className="text-ink-muted"> · {formatCOP(Math.abs(diff))} {diff < 0 ? 'menos' : 'más'} que tu simulación</span>
        )}
      </>
    );
  }
  if (kind === 'deposit' && amount > 0) {
    const earned = amount * (Math.pow(1 + row.rate / 100, days / 365) - 1);
    detail = (
      <>
        Con {formatCOP(amount)} a {days} días ganarías ≈{' '}
        <strong className="font-semibold text-ink">{formatCOP(earned)}</strong>
        <span className="text-ink-muted"> (antes de impuestos)</span>
      </>
    );
  }

  const meta =
    kind === 'credit'
      ? `${row.type} · ${row.credits.toLocaleString('es-CO')} ${row.credits === 1 ? 'crédito' : 'créditos'} en la semana`
      : row.type;

  const applyLabel = row.direct ? (kind === 'credit' ? 'Solicitar' : 'Abrir CDT') : 'Sitio oficial';
  const linkClass =
    'inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-ink ring-1 ring-inset ring-line transition hover:ring-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50';

  return (
    <li className={`flex gap-3.5 py-4 ${best ? '-mx-3 rounded-2xl bg-brand-50/70 px-3' : ''}`}>
      <EntityLogo row={row} rank={index + 1} best={best} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold leading-snug text-ink">
              <span className="break-words">{row.name}</span>
              {best && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                  {kind === 'credit' ? 'Tasa más baja' : 'Paga más'}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">{meta}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold leading-tight tracking-tight text-ink">
              {formatPct(row.rate)}
              <span className="ml-1 text-xs font-medium text-ink-muted">E.A.</span>
            </p>
            <p className="text-xs tabular-nums text-ink-muted">{formatPct(nmv)} N.M.V.</p>
          </div>
        </div>

        {detail && <p className="mt-2 text-xs leading-relaxed text-ink-soft">{detail}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {kind === 'credit' && (
            <button
              type="button"
              onClick={() => onUseRate(row.rate)}
              aria-label={`Simular con la tasa de ${row.name}: ${formatPct(row.rate)} E.A.`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-50 px-3.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              Simular con esta tasa
            </button>
          )}
          {row.url ? (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              title={
                row.direct
                  ? `Abre la página del producto en el sitio oficial de ${row.name}`
                  : `Abre el sitio oficial de ${row.name}`
              }
              aria-label={`${row.direct ? `${applyLabel} en` : 'Ir al sitio oficial de'} ${row.name} (se abre en una pestaña nueva)`}
              className={linkClass}
            >
              {applyLabel}
              <Icon name="external" className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          ) : (
            <a
              href={row.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Esta entidad aún no tiene un sitio verificado en el simulador"
              aria-label={`Buscar el sitio oficial de ${row.name} (se abre en una pestaña nueva)`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-ink-muted/40 px-3.5 text-xs font-semibold text-ink-soft transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              Buscar sitio oficial
              <Icon name="external" className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

export function MarketRates({ amount, months, currentPayment, onUseRate }) {
  const sectionRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [productId, setProductId] = useState('vivienda');
  const [variants, setVariants] = useState({});
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  const product = MARKET_PRODUCTS.find((p) => p.id === productId);
  const variant =
    product.variants.find((v) => v.id === (variants[productId] ?? product.defaultVariant)) ?? product.variants[0];

  // Las tasas se consultan cuando la sección se acerca a la pantalla.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return undefined;
    let ignore = false;
    setState((s) => ({ ...s, status: 'loading', error: null }));
    fetchMarketRates(product, variant)
      .then((data) => {
        if (!ignore) setState({ status: 'ready', data, error: null });
      })
      .catch(() => {
        if (!ignore) setState((s) => ({ ...s, status: 'error' }));
      });
    return () => {
      ignore = true;
    };
  }, [armed, product, variant, reload]);

  const data = state.data;
  const sameSelection = data && data.kind === product.kind;
  const rows = useMemo(() => (sameSelection ? data.rows.slice(0, TOP_N) : []), [sameSelection, data]);
  const days = Number(variant.id) || 360;

  return (
    <section ref={sectionRef} id="mercado" className="card scroll-mt-24 p-5 sm:p-7" aria-labelledby="mercado-title">
      <div className="max-w-xl">
        <p className="eyebrow">Mercado</p>
        <h2 id="mercado-title" className="mt-1.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Las mejores tasas del mercado
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          Las {TOP_N} entidades con mejor tasa en cada producto. Simula cualquiera o solicítala directo en la entidad.
        </p>
      </div>

      {/* Productos */}
      <div className="-mx-5 mt-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2" role="group" aria-label="Producto">
          {MARKET_PRODUCTS.map((p) => {
            const active = p.id === productId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={(e) => {
                  setProductId(p.id);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }}
                className={`h-10 whitespace-nowrap rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                  active ? 'bg-ink text-white' : 'bg-field text-ink-soft hover:bg-line/70 hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{product.description}</p>
        {product.variants.length > 1 && (
          <Segmented
            size="sm"
            label={product.kind === 'deposit' ? 'Plazo del CDT' : 'Tipo de vivienda'}
            value={variant.id}
            onChange={(v) => setVariants((prev) => ({ ...prev, [productId]: v }))}
            options={product.variants.map((v) => ({ value: v.id, label: v.label }))}
          />
        )}
      </div>

      {/* Fecha de las tasas */}
      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted" aria-live="polite">
        <Icon name="calendar" className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {state.status === 'idle' && 'Las tasas se cargan al llegar a esta sección.'}
        {state.status === 'loading' && !sameSelection && 'Buscando las mejores tasas…'}
        {sameSelection && (
          <span>
            {data.kind === 'credit' ? 'Tasas de la semana al ' : 'Promedio de los últimos 7 días al '}
            <strong className="font-semibold text-ink-soft">{formatDate(data.date)}</strong> · actualizado hoy a las{' '}
            {timeFormatter.format(data.fetchedAt)}
          </span>
        )}
        {state.status === 'error' && !sameSelection && 'Sin conexión con las tasas.'}
      </p>

      {state.status === 'error' && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-2xl bg-danger-soft p-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
        >
          <span>No pudimos cargar las tasas en este momento. Revisa tu conexión e inténtalo de nuevo.</span>
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-3.5 text-xs font-semibold text-ink ring-1 ring-line sm:self-auto"
          >
            <Icon name="refresh" className="h-3.5 w-3.5" strokeWidth={2} /> Reintentar
          </button>
        </div>
      )}

      {/* Lista */}
      {!sameSelection && state.status === 'loading' ? (
        <SkeletonRows />
      ) : (
        <div className={`transition-opacity duration-200 ${state.status === 'loading' ? 'opacity-50' : ''}`}>
          {sameSelection && rows.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-muted">No hay entidades con datos suficientes esta semana.</p>
          )}
          <ol className="mt-2 divide-y divide-line">
            {rows.map((row, i) => (
              <EntityRow
                key={row.key}
                row={row}
                index={i}
                kind={data.kind}
                amount={amount}
                months={months}
                currentPayment={currentPayment}
                days={days}
                onUseRate={onUseRate}
              />
            ))}
          </ol>
        </div>
      )}

      <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-ink-muted">
        {product.kind === 'credit'
          ? 'Son tasas promedio de lo que cada entidad prestó esa semana; la tuya depende de tu perfil, plazo y monto.'
          : 'Son tasas promedio de los CDT emitidos; tu rentabilidad depende del monto, el plazo y la retención en la fuente.'}{' '}
        Confirma las condiciones con la entidad antes de decidir.
      </p>
    </section>
  );
}
