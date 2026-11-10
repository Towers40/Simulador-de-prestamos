import { useState } from 'react';
import { formatCOP, formatPct } from '../lib/format.js';
import { AnimatedNumber, Icon, Swatch } from './ui.jsx';

function Stat({ label, value, format = formatCOP, tone = 'default', note }) {
  return (
    <div className={`rounded-2xl p-3.5 ${tone === 'save' ? 'bg-save-soft' : 'bg-field'}`}>
      <dt className={`text-xs ${tone === 'save' ? 'text-save' : 'text-ink-muted'}`}>{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold tracking-tight text-ink sm:text-base">
        <AnimatedNumber value={value} format={format} />
      </dd>
      {note && <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{note}</p>}
    </div>
  );
}

export function ResultsCard({ sim, eaPct, rates, onDownload }) {
  const [pdfState, setPdfState] = useState('idle');

  const download = async () => {
    setPdfState('loading');
    try {
      await onDownload();
      setPdfState('idle');
    } catch {
      setPdfState('error');
    }
  };

  if (!sim) {
    return (
      <div className="card flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-field text-ink-muted">
          <Icon name="info" />
        </span>
        <p className="text-base font-semibold text-ink">Completa los datos</p>
        <p className="max-w-xs text-sm text-ink-muted">
          Ingresa un monto, una tasa y un plazo válidos para ver tu cuota mensual.
        </p>
      </div>
    );
  }

  const capitalShare = sim.principal / sim.totalPaid;
  const interestShare = 1 - capitalShare;

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-brand-50 via-white to-white p-5 sm:p-7">
        <p className="text-sm font-medium text-ink-soft">Tu cuota mensual</p>
        <p className="mt-1 text-[clamp(2.4rem,11vw,3.4rem)] font-semibold leading-none tracking-tight text-ink">
          <AnimatedNumber value={sim.payment} format={formatCOP} />
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          {sim.installments} {sim.installments === 1 ? 'cuota' : 'cuotas'} · {formatPct(eaPct)} E.A. ·{' '}
          {formatPct(rates.nominalMonthlyPct)} N.M.V.
        </p>
      </div>

      <div className="space-y-6 p-5 pt-2 sm:p-7 sm:pt-2">
        {/* Composición del total pagado */}
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ink-soft">Total a pagar</span>
            <span className="text-lg font-semibold tracking-tight text-ink">
              <AnimatedNumber value={sim.totalPaid} format={formatCOP} />
            </span>
          </div>
          <div
            className="mt-3 flex h-2 gap-[2px] overflow-hidden rounded-full"
            role="img"
            aria-label={`Capital ${Math.round(capitalShare * 100)} %, intereses ${Math.round(interestShare * 100)} % del total a pagar`}
          >
            <span className="h-full rounded-l-full bg-capital transition-all duration-500" style={{ width: `${capitalShare * 100}%` }} />
            {interestShare > 0.0005 && (
              <span className="h-full flex-1 rounded-r-full bg-interest transition-all duration-500" />
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Swatch color="#138a73" /> Capital · {Math.round(capitalShare * 100)} %
            </span>
            <span className="flex items-center gap-1.5">
              <Swatch color="#ef9b62" /> Intereses · {Math.round(interestShare * 100)} %
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2.5">
          <Stat label="Monto solicitado" value={sim.principal} />
          <Stat label="Intereses totales" value={sim.totalInterest} />
          <Stat label="Número de cuotas" value={sim.installments} format={(v) => String(Math.round(v))} />
          <Stat
            label="Intereses ahorrados"
            value={sim.interestSaved}
            tone={sim.interestSaved > 0 ? 'save' : 'default'}
            note={sim.interestSaved > 0 ? null : 'Agrega abonos para ahorrar'}
          />
        </dl>

        {sim.interestSaved > 0 && (
          <p className="flex gap-2.5 rounded-2xl bg-save-soft p-3.5 text-sm leading-relaxed text-save">
            <Icon name="trendDown" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <span>
              Con tus abonos ahorras <strong className="font-semibold">{formatCOP(sim.interestSaved)}</strong> en intereses
              {sim.installmentsSaved > 0 && (
                <>
                  {' '}y terminas <strong className="font-semibold">{sim.installmentsSaved} {sim.installmentsSaved === 1 ? 'mes' : 'meses'} antes</strong>
                </>
              )}
              .
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={download}
          disabled={pdfState === 'loading'}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(15,117,99,0.7)] transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2"
        >
          <Icon name="download" className="h-4 w-4" strokeWidth={2.25} />
          {pdfState === 'loading' ? 'Generando PDF…' : 'Descargar PDF'}
        </button>
        {pdfState === 'error' && (
          <p role="alert" className="-mt-3 text-center text-xs text-danger">
            No se pudo generar el PDF. Revisa tu conexión e inténtalo de nuevo.
          </p>
        )}
      </div>
    </div>
  );
}
