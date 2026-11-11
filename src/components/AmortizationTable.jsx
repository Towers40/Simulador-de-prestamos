import { useState } from 'react';
import { formatCOP } from '../lib/format.js';
import { Icon, Swatch } from './ui.jsx';

const PREVIEW_ROWS = 12;

function SplitBar({ row, className = '' }) {
  const total = row.capital + row.interest + row.extra;
  if (total <= 0) return <div className={`h-1.5 rounded-full bg-line ${className}`} />;
  return (
    <div className={`flex h-1.5 gap-[2px] overflow-hidden rounded-full ${className}`} aria-hidden="true">
      {row.capital > 0 && <span className="bg-capital" style={{ flexGrow: row.capital, flexBasis: 0 }} />}
      {row.interest > 0 && <span className="bg-interest" style={{ flexGrow: row.interest, flexBasis: 0 }} />}
      {row.extra > 0 && <span className="bg-extra" style={{ flexGrow: row.extra, flexBasis: 0 }} />}
    </div>
  );
}

export function AmortizationTable({ sim }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? sim.rows : sim.rows.slice(0, PREVIEW_ROWS);
  const hasMore = sim.rows.length > PREVIEW_ROWS;
  const hasExtras = sim.totalExtra > 0;

  return (
    <section id="tabla" className="card scroll-mt-24 p-6 sm:p-8" aria-labelledby="tabla-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="tabla-title" className="title-3 sm:text-2xl">
            Tabla de amortización
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {sim.rows.length} {sim.rows.length === 1 ? 'mes' : 'meses'} · cuota fija de {formatCOP(sim.payment)}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><Swatch color="#138a73" /> Capital</span>
          <span className="flex items-center gap-1.5"><Swatch color="#ef9b62" /> Interés</span>
          {hasExtras && <span className="flex items-center gap-1.5"><Swatch color="#6f63d3" /> Abono</span>}
        </div>
      </div>

      {/* Móvil: lista compacta */}
      <ol className="mt-5 divide-y divide-line md:hidden">
        {rows.map((r) => (
          <li key={r.month} className={`py-3.5 ${r.extra > 0 ? '-mx-3 rounded-2xl bg-extra-soft/60 px-3' : ''}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-ink">Mes {r.month}</span>
              <span className="text-sm font-semibold tabular-nums text-ink">{formatCOP(r.payment)}</span>
            </div>
            <SplitBar row={r} className="mt-2" />
            <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-ink-muted">Capital</dt>
                <dd className="tabular-nums text-ink-soft">{formatCOP(r.capital)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Interés</dt>
                <dd className="tabular-nums text-ink-soft">{formatCOP(r.interest)}</dd>
              </div>
              <div className="text-right">
                <dt className="text-ink-muted">Saldo</dt>
                <dd className="tabular-nums font-medium text-ink">{formatCOP(r.balance)}</dd>
              </div>
            </dl>
            {r.extra > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-extra-ink">
                <Icon name="coins" className="h-3.5 w-3.5" /> Abono de {formatCOP(r.extra)}
              </p>
            )}
          </li>
        ))}
      </ol>

      {/* Escritorio: tabla */}
      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium text-ink-muted">
              <th scope="col" className="py-3 pr-4 font-medium">Mes</th>
              <th scope="col" className="w-[18%] py-3 pr-6 font-medium">Composición</th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">Cuota</th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">Capital</th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">Interés</th>
              {hasExtras && <th scope="col" className="py-3 pr-4 text-right font-medium">Abono</th>}
              <th scope="col" className="py-3 text-right font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr
                key={r.month}
                className={`border-b border-line/70 transition-colors last:border-0 hover:bg-field/70 ${r.extra > 0 ? 'bg-extra-soft/60' : ''}`}
              >
                <td className="py-3 pr-4 font-medium text-ink">{r.month}</td>
                <td className="py-3 pr-6">
                  <SplitBar row={r} />
                </td>
                <td className="py-3 pr-4 text-right text-ink">{formatCOP(r.payment)}</td>
                <td className="py-3 pr-4 text-right text-ink-soft">{formatCOP(r.capital)}</td>
                <td className="py-3 pr-4 text-right text-ink-soft">{formatCOP(r.interest)}</td>
                {hasExtras && (
                  <td className={`py-3 pr-4 text-right ${r.extra > 0 ? 'font-semibold text-extra-ink' : 'text-ink-muted'}`}>
                    {r.extra > 0 ? formatCOP(r.extra) : '—'}
                  </td>
                )}
                <td className="py-3 text-right font-medium text-ink">{formatCOP(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-field text-sm font-semibold text-ink transition hover:bg-line/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          {expanded ? 'Mostrar menos' : `Ver los ${sim.rows.length} meses`}
          <Icon name="chevronDown" className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </section>
  );
}
