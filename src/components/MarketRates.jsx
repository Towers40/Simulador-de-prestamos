import { useEffect, useMemo, useRef, useState } from 'react';
import { annuityPayment, monthlyRateFromEA } from '../lib/finance.js';
import { formatCOP, formatDate, formatPct } from '../lib/format.js';
import { MARKET_PRODUCTS, SOURCES, fetchMarketRates } from '../lib/market.js';
import { Icon, Segmented } from './ui.jsx';

const PREVIEW = 5;

const timeFormatter = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const shortDate = (iso) => {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

function SkeletonRows() {
  return (
    <ol className="mt-2 divide-y divide-line" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex animate-pulse items-center gap-3 py-4">
          <span className="h-7 w-7 rounded-full bg-field" />
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
      ? `${row.type} · ${row.credits.toLocaleString('es-CO')} ${row.credits === 1 ? 'crédito' : 'créditos'}`
      : `${row.type} · último reporte ${shortDate(row.lastReport)}`;

  return (
    <li className={`flex gap-3 py-4 ${best ? '-mx-3 rounded-2xl bg-brand-50/70 px-3' : ''}`}>
      <span
        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums ${
          best ? 'bg-brand-600 text-white' : 'bg-field text-ink-muted'
        }`}
      >
        {index + 1}
      </span>
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
              title={`Abre el sitio oficial de ${row.name} en una pestaña nueva`}
              aria-label={`Ir al sitio oficial de ${row.name} (se abre en una pestaña nueva)`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-ink ring-1 ring-inset ring-line transition hover:ring-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              Sitio oficial
              <Icon name="external" className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          ) : (
            <a
              href={row.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Esta entidad aún no tiene un sitio verificado en el simulador"
              aria-label={`Buscar el sitio oficial de ${row.name} (se abre en una pestaña nueva)`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-ink-soft border border-dashed border-ink-muted/40 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
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
  const [expanded, setExpanded] = useState(false);
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  const product = MARKET_PRODUCTS.find((p) => p.id === productId);
  const variant =
    product.variants.find((v) => v.id === (variants[productId] ?? product.defaultVariant)) ?? product.variants[0];

  // Se consulta la fuente cuando la sección se acerca a la pantalla.
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
      .catch((err) => {
        if (!ignore) setState((s) => ({ ...s, status: 'error', error: err instanceof TypeError ? null : err.message }));
      });
    return () => {
      ignore = true;
    };
  }, [armed, product, variant, reload]);

  const data = state.data;
  const sameSelection = data && data.kind === product.kind;
  const rows = useMemo(() => (sameSelection ? data.rows : []), [sameSelection, data]);
  const visible = expanded ? rows : rows.slice(0, PREVIEW);
  const source = product.kind === 'deposit' ? SOURCES.deposit : SOURCES.credit;
  const days = Number(variant.id) || 360;

  const selectProduct = (id) => {
    setProductId(id);
    setExpanded(false);
  };

  return (
    <section ref={sectionRef} id="mercado" className="card scroll-mt-24 p-5 sm:p-7" aria-labelledby="mercado-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="eyebrow">Mercado</p>
          <h2 id="mercado-title" className="mt-1.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Tasas reales de bancos y entidades
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            Compara lo que cobra (o paga) cada entidad según sus propios reportes a la Superintendencia Financiera. Toca una
            tasa para simularla o ve directo al sitio oficial.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-save-soft px-3 py-1.5 text-xs font-medium text-save">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-save/50 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-save" />
          </span>
          Datos oficiales en vivo
        </span>
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
                  selectProduct(p.id);
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
            onChange={(v) => {
              setVariants((prev) => ({ ...prev, [productId]: v }));
              setExpanded(false);
            }}
            options={product.variants.map((v) => ({ value: v.id, label: v.label }))}
          />
        )}
      </div>

      {/* Estado / frescura */}
      <div className="mt-4 rounded-2xl bg-field/70 px-4 py-3 text-xs leading-relaxed text-ink-muted" aria-live="polite">
        {state.status === 'loading' && !sameSelection && 'Consultando la Superintendencia Financiera…'}
        {state.status === 'idle' && 'Las tasas se cargan al llegar a esta sección.'}
        {sameSelection && (
          <>
            {data.kind === 'credit' ? (
              <>
                Semana con corte al <strong className="font-semibold text-ink">{formatDate(data.date)}</strong> · la
                fuente se actualiza cada semana · mínimo {data.minCredits} créditos por entidad.
              </>
            ) : (
              <>
                Promedio de los últimos 7 días, al <strong className="font-semibold text-ink">{formatDate(data.date)}</strong>{' '}
                · la fuente se actualiza a diario.
              </>
            )}{' '}
            Consultado hoy a las {timeFormatter.format(data.fetchedAt)}.
          </>
        )}
      </div>

      {state.status === 'error' && (
        <div role="alert" className="mt-4 flex flex-col gap-3 rounded-2xl bg-danger-soft p-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
          <span>
            No pudimos consultar la fuente oficial{state.error ? ` (${state.error})` : ''}. Revisa tu conexión e inténtalo de
            nuevo.
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => setReload((n) => n + 1)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-ink ring-1 ring-line"
            >
              <Icon name="refresh" className="h-3.5 w-3.5" strokeWidth={2} /> Reintentar
            </button>
            <a
              href={source.page}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-danger ring-1 ring-danger/30"
            >
              Ver la fuente <Icon name="external" className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          </span>
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
            {visible.map((row, i) => (
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
          {rows.length > PREVIEW && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-field text-sm font-semibold text-ink transition hover:bg-line/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              {expanded ? 'Mostrar menos' : `Ver las ${rows.length} entidades`}
              <Icon name="chevronDown" className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Verificación */}
      <div className="mt-6 space-y-3 border-t border-line pt-5 text-xs leading-relaxed text-ink-muted">
        <p>
          <strong className="font-semibold text-ink-soft">Fuente:</strong> Superintendencia Financiera de Colombia, conjunto
          “{source.name}” en datos.gov.co. Las cifras se consultan en vivo cada vez que abres la página; no son valores
          escritos a mano.
        </p>
        <p className="flex flex-wrap gap-2">
          <a
            href={source.page}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-field px-3 py-1.5 font-medium text-ink-soft transition hover:text-ink"
          >
            Ver conjunto de datos <Icon name="external" className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
          {sameSelection && (
            <a
              href={data.queryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-field px-3 py-1.5 font-medium text-ink-soft transition hover:text-ink"
            >
              Ver la consulta exacta <Icon name="external" className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          )}
        </p>
        <p>
          {product.kind === 'credit'
            ? 'Son tasas promedio ponderadas de los créditos que cada entidad desembolsó a personas en esa semana, no ofertas personalizadas: tu tasa depende de tu perfil, plazo, monto y garantías.'
            : 'Son tasas promedio ponderadas de los CDT emitidos por cada entidad en el periodo; la rentabilidad real depende del monto, el plazo y la retención en la fuente.'}{' '}
          Confirma siempre las condiciones con la entidad antes de decidir.
        </p>
      </div>
    </section>
  );
}
