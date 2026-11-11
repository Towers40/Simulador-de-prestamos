import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { annuityPayment, monthlyRateFromEA } from '../lib/finance.js';
import { formatCOP, formatDate, formatPct } from '../lib/format.js';
import { MARKET_PRODUCTS, TOP_N, fetchMarketRates } from '../lib/market.js';
import { Icon, Segmented, img3d } from './ui.jsx';

const timeFormatter = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const initials = (name) =>
  name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(banco|de|del|la|las|los)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();

/** Logo de la entidad en un recuadro blanco; si no hay logo, sus iniciales. */
function LogoTile({ row, size = 44, className = '' }) {
  const [failed, setFailed] = useState(false);
  const showImage = row.logo && !failed;
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-line ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={row.logo}
          alt=""
          width={size}
          height={size}
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
  );
}

function EntityLogo({ row, rank, best }) {
  return (
    <span className="relative mt-0.5 h-11 w-11 shrink-0 self-start">
      <LogoTile row={row} />
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


/* ---------- Carrusel de productos ---------- */

/** Etiqueta flotante con la mejor tasa del producto (sobre la imagen 3D). */
function BestRateChip({ summary, kind }) {
  if (!summary || summary.status === 'loading') {
    return (
      <span className="flex items-center gap-3 rounded-2xl bg-ink/75 p-2.5 backdrop-blur-md" aria-hidden="true">
        <span className="h-8 w-8 animate-pulse rounded-lg bg-white/20" />
        <span className="flex-1 space-y-1.5">
          <span className="block h-3 w-20 animate-pulse rounded bg-white/25" />
          <span className="block h-2.5 w-14 animate-pulse rounded bg-white/15" />
        </span>
      </span>
    );
  }
  if (summary.status === 'error' || !summary.row) {
    return (
      <span className="block rounded-2xl bg-ink/75 px-3.5 py-2.5 text-xs text-white/80 backdrop-blur-md">
        Tasas no disponibles por ahora
      </span>
    );
  }
  const { row } = summary;
  return (
    <span className="flex items-center gap-3 rounded-2xl bg-ink/80 p-2.5 pr-3 text-white backdrop-blur-md">
      <LogoTile row={row} size={32} className="rounded-lg ring-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-tight">
          {formatPct(row.rate)} <span className="text-xs font-normal text-white/70">E.A.</span>
        </span>
        <span className="block truncate text-xs text-white/70">{row.name}</span>
      </span>
      <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-brand-200 ring-1 ring-inset ring-brand-300/70">
        {kind === 'credit' ? 'Más baja' : 'Paga más'}
      </span>
    </span>
  );
}

function ProductCard({ product, active, summary, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={`block-xl group flex h-full w-full flex-col overflow-hidden bg-white text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${
        active ? 'ring-2 ring-brand-600' : 'ring-1 ring-transparent hover:ring-line'
      }`}
    >
      <span className="relative block aspect-[6/5] bg-gradient-to-b from-brand-50 to-white">
        <img
          src={img3d(product.id)}
          alt=""
          width="960"
          height="960"
          loading="lazy"
          decoding="async"
          draggable="false"
          className="absolute inset-0 h-full w-full select-none object-contain px-6 pb-12 pt-2 transition duration-500 ease-out group-hover:scale-[1.03]"
        />
        <span className="absolute inset-x-3 bottom-3">
          <BestRateChip summary={summary} kind={product.kind} />
        </span>
      </span>
      <span className="flex flex-1 flex-col px-5 pb-6 pt-5 sm:px-6">
        <span className="flex items-center justify-between gap-3">
          <span className="title-3">{product.label}</span>
          {active && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.25} /> Viendo
            </span>
          )}
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">{product.description}</span>
      </span>
    </button>
  );
}

function useCarousel(count) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = [...track.children];
    const left = track.scrollLeft + parseFloat(getComputedStyle(track).scrollPaddingLeft || '0');
    let best = 0;
    items.forEach((el, i) => {
      if (Math.abs(el.offsetLeft - left) < Math.abs(items[best].offsetLeft - left)) best = i;
    });
    setIndex(best);
    setEdges({ start: track.scrollLeft <= 4, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    measure();
    track.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      track.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const goTo = useCallback((i) => {
    const track = trackRef.current;
    const el = track?.children[Math.max(0, Math.min(count - 1, i))];
    if (!el) return;
    const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft || '0');
    track.scrollTo({ left: el.offsetLeft - pad, behavior: 'smooth' });
  }, [count]);

  return { trackRef, index, edges, goTo };
}

export function MarketRates({ amount, months, currentPayment, onUseRate }) {
  const sectionRef = useRef(null);
  const listRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [productId, setProductId] = useState('vivienda');
  const [variants, setVariants] = useState({});
  const [reload, setReload] = useState(0);
  const [state, setState] = useState({ status: 'idle', data: null, error: null });
  const [summaries, setSummaries] = useState({});
  const carousel = useCarousel(MARKET_PRODUCTS.length);

  const variantFor = useCallback(
    (p) => p.variants.find((v) => v.id === (variants[p.id] ?? p.defaultVariant)) ?? p.variants[0],
    [variants],
  );
  const product = MARKET_PRODUCTS.find((p) => p.id === productId);
  const variant = variantFor(product);

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

  // Mejor tasa de cada producto para las tarjetas del carrusel (comparte caché con la lista).
  useEffect(() => {
    if (!armed) return undefined;
    let ignore = false;
    for (const p of MARKET_PRODUCTS) {
      const v = variantFor(p);
      const key = `${p.id}:${v.id}`;
      setSummaries((s) => (s[key]?.status === 'ready' ? s : { ...s, [key]: { status: 'loading' } }));
      fetchMarketRates(p, v)
        .then((data) => !ignore && setSummaries((s) => ({ ...s, [key]: { status: 'ready', row: data.rows[0] ?? null } })))
        .catch(() => !ignore && setSummaries((s) => ({ ...s, [key]: { status: 'error' } })));
    }
    return () => {
      ignore = true;
    };
  }, [armed, variantFor, reload]);

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

  const selectProduct = (id, i) => {
    setProductId(id);
    carousel.goTo(i);
    // Si la lista no se ve (móvil), la acercamos para mostrar el resultado del cambio.
    const top = listRef.current?.getBoundingClientRect().top ?? 0;
    if (top > window.innerHeight * 0.8) listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section ref={sectionRef} id="mercado" className="section scroll-mt-16" aria-labelledby="mercado-title">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 id="mercado-title" className="display-2">
            Las mejores tasas del mercado
          </h2>
          <p className="lead mt-5 max-w-lg">
            Elige un producto y mira las {TOP_N} entidades con mejor tasa. Simula cualquiera o solicítala directo en la
            entidad.
          </p>
        </div>

        {/* Carrusel */}
        <ul
          ref={carousel.trackRef}
          aria-label="Productos financieros"
          className="-mx-4 mt-12 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 pt-1 [scrollbar-width:none] sm:-mx-6 sm:mt-16 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {MARKET_PRODUCTS.map((p, i) => (
            <li
              key={p.id}
              className="w-[80%] max-w-[360px] shrink-0 snap-start sm:w-[calc((100%-1rem)/2.2)] lg:w-[calc((100%-2rem)/3.25)] lg:max-w-none"
            >
              <ProductCard
                product={p}
                active={p.id === productId}
                summary={summaries[`${p.id}:${variantFor(p).id}`]}
                onSelect={() => selectProduct(p.id, i)}
              />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {MARKET_PRODUCTS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => carousel.goTo(i)}
                aria-label={`Ir a ${p.label}`}
                aria-current={carousel.index === i ? 'true' : undefined}
                className="grid h-6 place-items-center rounded-full px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    carousel.index === i ? 'w-8 bg-ink' : 'w-1.5 bg-ink/20'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              { dir: -1, label: 'Producto anterior', disabled: carousel.edges.start, icon: 'rotate-180' },
              { dir: 1, label: 'Producto siguiente', disabled: carousel.edges.end, icon: '' },
            ].map((b) => (
              <button
                key={b.dir}
                type="button"
                onClick={() => carousel.goTo(carousel.index + b.dir)}
                disabled={b.disabled}
                aria-label={b.label}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink transition hover:bg-ink hover:text-white disabled:bg-field disabled:text-ink-muted/50 disabled:hover:bg-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                <Icon name="arrowRight" className={`h-4 w-4 ${b.icon}`} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        {/* Top 5 del producto elegido */}
        <div ref={listRef} className="card mt-10 scroll-mt-20 p-5 sm:mt-12 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h3 className="title-3">
                Las {TOP_N} mejores · {product.label}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">{product.description}</p>
            </div>
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
          <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-muted" aria-live="polite">
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
        </div>
      </div>
    </section>
  );
}
