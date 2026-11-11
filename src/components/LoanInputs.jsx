import { useState } from 'react';
import {
  formatCompactCOP,
  formatCOP,
  formatInteger,
  formatPct,
  parseIntegerInput,
  toDecimalInput,
} from '../lib/format.js';
import { InfoButton, InfoPanel, InputShell, RangeSlider, Segmented, inputClass } from './ui.jsx';

export const AMOUNT_MIN = 500_000;
export const AMOUNT_MAX = 500_000_000;
const AMOUNT_LIMIT = 99_999_999_999;
const RATE_MAX_SLIDER = 60;
// Plazos frecuentes como accesos rápidos (cualquier otro se escribe en el campo).
const TERM_PRESETS = { years: [1, 2, 3, 5, 10, 15, 20], months: [6, 12, 18, 24, 36, 48, 60] };

// Slider logarítmico: mismo recorrido para $1 M → $10 M que para $50 M → $500 M.
const LOG_RANGE = Math.log(AMOUNT_MAX / AMOUNT_MIN);
const amountToSlider = (amount) => {
  const clamped = Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, amount || AMOUNT_MIN));
  return Math.round((Math.log(clamped / AMOUNT_MIN) / LOG_RANGE) * 1000);
};
const sliderToAmount = (position) => {
  const raw = AMOUNT_MIN * Math.exp((position / 1000) * LOG_RANGE);
  const step = raw < 2e6 ? 50_000 : raw < 1e7 ? 100_000 : raw < 5e7 ? 500_000 : raw < 2e8 ? 1_000_000 : 5_000_000;
  return Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, Math.round(raw / step) * step));
};

const cleanRate = (value) => value.replace(/[^0-9.,]/g, '').slice(0, 7);

function Field({ id, label, hint, children }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Explicaciones en lenguaje sencillo, con ejemplos calculados con los datos del usuario. */
function RateExplanation({ kind, rates, amount }) {
  const ok = Number.isFinite(rates.eaPct);
  const ea = ok ? formatPct(rates.eaPct) : '—';
  const nmv = ok ? formatPct(rates.nominalMonthlyPct) : '—';
  const mv = ok ? `${toDecimalInput(rates.monthlyPct, 4)} %` : '—';
  const base = amount > 0 ? amount : 1_000_000;

  if (kind === 'ea') {
    return (
      <>
        <p>
          Es lo que <strong className="font-semibold text-ink">realmente te cuesta</strong> el préstamo en un año, porque ya
          incluye que cada mes se cobran intereses sobre lo que debes.
        </p>
        <p>
          Es la mejor tasa para <strong className="font-semibold text-ink">comparar créditos entre bancos</strong>: entre más
          baja, más barato.
        </p>
        {ok && (
          <p className="rounded-xl bg-field px-3 py-2 text-xs">
            Ejemplo: con {ea} E.A., una deuda de $ 1.000.000 que no abonas en todo un año genera unos{' '}
            <strong className="font-semibold text-ink">{formatCOP(rates.eaPct * 10_000)}</strong> de intereses.
          </p>
        )}
      </>
    );
  }
  if (kind === 'nmv') {
    return (
      <>
        <p>
          Es la tasa mensual <strong className="font-semibold text-ink">multiplicada por 12</strong>. Muchos bancos la
          publican porque se ve más baja que la E.A.
        </p>
        <p>
          No es el costo real del crédito: no tiene en cuenta que los intereses se cobran mes a mes. Sirve para calcular la
          tasa mensual, no para comparar ofertas.
        </p>
        {ok && (
          <p className="rounded-xl bg-field px-3 py-2 text-xs">
            Ejemplo: {nmv} N.M.V. ÷ 12 = {mv} cada mes, que equivale a{' '}
            <strong className="font-semibold text-ink">{ea} E.A.</strong>
          </p>
        )}
      </>
    );
  }
  return (
    <>
      <p>
        Es el porcentaje de interés que te cobran <strong className="font-semibold text-ink">cada mes</strong> sobre lo que
        todavía debes.
      </p>
      <p>“Mes vencido” significa que ese interés se paga al final del mes, junto con tu cuota.</p>
      {ok && (
        <p className="rounded-xl bg-field px-3 py-2 text-xs">
          Ejemplo: con {mv} mensual y una deuda de {formatCOP(base)}, el primer mes pagas{' '}
          <strong className="font-semibold text-ink">{formatCOP((base * rates.monthlyPct) / 100)}</strong> de intereses.
        </p>
      )}
    </>
  );
}

const INFO_TITLES = {
  ea: '¿Qué es la tasa efectiva anual (E.A.)?',
  nmv: '¿Qué es la tasa nominal mes vencido (N.M.V.)?',
  mv: '¿Qué es la tasa mensual (M.V.)?',
};

function SmallRateField({ id, label, value, onChange, invalid, info, infoOpen, onInfoToggle }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-1 px-1">
        <label htmlFor={id} className="truncate text-xs font-medium text-brand-700">
          {label}
        </label>
        <InfoButton open={infoOpen} onToggle={onInfoToggle} controls={`info-${info}`} label={INFO_TITLES[info]} />
      </div>
      <div
        className={`mt-1.5 flex h-12 items-center gap-1 rounded-xl bg-white px-3 ring-1 transition focus-within:ring-2 ${
          invalid ? 'ring-danger/60' : 'ring-brand-100 focus-within:ring-brand-500/50'
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="w-full min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight text-ink outline-none placeholder:font-normal placeholder:text-ink-muted/60"
          value={value}
          placeholder="0"
          onChange={(e) => onChange(cleanRate(e.target.value))}
        />
        <span className="text-sm font-medium text-ink-muted">%</span>
      </div>
    </div>
  );
}

export function LoanInputs({
  amount,
  onAmountChange,
  rate,
  onRateChange,
  rates,
  termInput,
  onTermInputChange,
  termUnit,
  onTermUnitChange,
}) {
  const [info, setInfo] = useState(null);
  const toggleInfo = (kind) => setInfo((current) => (current === kind ? null : kind));

  const ratesValid = Number.isFinite(rates.eaPct);
  // El campo que el usuario está escribiendo muestra su texto; los otros, el valor equivalente.
  const display = (field, value, digits) => (rate.source === field ? rate.text : ratesValid ? toDecimalInput(value, digits) : '');
  const invalid = (field) => rate.source === field && !ratesValid;

  const termNumber = parseInt(termInput, 10);
  const termValid = Number.isInteger(termNumber) && termNumber > 0;
  const months = termValid ? (termUnit === 'years' ? termNumber * 12 : termNumber) : 0;

  const changeUnit = (unit) => {
    if (unit === termUnit) return;
    if (termValid) {
      onTermInputChange(String(unit === 'months' ? termNumber * 12 : Math.max(1, Math.round(termNumber / 12))));
    }
    onTermUnitChange(unit);
  };

  return (
    <div className="space-y-7">
      {/* Monto */}
      <Field id="amount" label="Monto del préstamo" hint={amount > 0 ? formatCompactCOP(amount) : null}>
        <InputShell prefix="$" suffix="COP" invalid={!(amount > 0)}>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={inputClass}
            value={amount > 0 ? formatInteger(amount) : ''}
            placeholder="0"
            onChange={(e) => onAmountChange(Math.min(AMOUNT_LIMIT, parseIntegerInput(e.target.value)))}
          />
        </InputShell>
        <RangeSlider
          min={0}
          max={1000}
          value={amountToSlider(amount)}
          onChange={(p) => onAmountChange(sliderToAmount(p))}
          label="Ajustar monto del préstamo"
          valueText={formatCOP(amount)}
        />
        <div className="flex justify-between text-xs text-ink-muted">
          <span>{formatCompactCOP(AMOUNT_MIN)}</span>
          <span>{formatCompactCOP(AMOUNT_MAX)}</span>
        </div>
      </Field>

      {/* Tasas: E.A. ⇄ N.M.V. ⇄ M.V. */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="rate-ea" className="text-sm font-medium text-ink-soft">
            Tasa efectiva anual (E.A.)
          </label>
          <InfoButton open={info === 'ea'} onToggle={() => toggleInfo('ea')} controls="info-ea" label={INFO_TITLES.ea} />
        </div>
        <InfoPanel id="info-ea" open={info === 'ea'} title={INFO_TITLES.ea} onClose={() => setInfo(null)}>
          <RateExplanation kind="ea" rates={rates} amount={amount} />
        </InfoPanel>
        <InputShell suffix="% E.A." invalid={invalid('ea')}>
          <input
            id="rate-ea"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={inputClass}
            value={display('ea', rates.eaPct, 2)}
            placeholder="0"
            onChange={(e) => onRateChange({ source: 'ea', text: cleanRate(e.target.value) })}
          />
        </InputShell>
        <RangeSlider
          min={0}
          max={RATE_MAX_SLIDER}
          step={0.1}
          value={ratesValid ? rates.eaPct : 0}
          onChange={(v) => onRateChange({ source: 'ea', text: toDecimalInput(v) })}
          label="Ajustar tasa efectiva anual"
          valueText={ratesValid ? formatPct(rates.eaPct) : 'Sin tasa'}
        />

        <div className="rounded-2xl bg-brand-50 p-3 ring-1 ring-inset ring-brand-100">
          <p className="px-1 pb-3 text-xs leading-snug text-ink-muted">
            Equivalencias: escribe en cualquiera de las tres tasas y las demás se ajustan solas.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <SmallRateField
              id="rate-nmv"
              label="Nominal (N.M.V.)"
              value={display('nmv', rates.nominalMonthlyPct, 2)}
              onChange={(text) => onRateChange({ source: 'nmv', text })}
              invalid={invalid('nmv')}
              info="nmv"
              infoOpen={info === 'nmv'}
              onInfoToggle={() => toggleInfo('nmv')}
            />
            <SmallRateField
              id="rate-mv"
              label="Mensual (M.V.)"
              value={display('mv', rates.monthlyPct, 4)}
              onChange={(text) => onRateChange({ source: 'mv', text })}
              invalid={invalid('mv')}
              info="mv"
              infoOpen={info === 'mv'}
              onInfoToggle={() => toggleInfo('mv')}
            />
          </div>
          <InfoPanel id="info-nmv" open={info === 'nmv'} title={INFO_TITLES.nmv} onClose={() => setInfo(null)}>
            <RateExplanation kind="nmv" rates={rates} amount={amount} />
          </InfoPanel>
          <InfoPanel id="info-mv" open={info === 'mv'} title={INFO_TITLES.mv} onClose={() => setInfo(null)}>
            <RateExplanation kind="mv" rates={rates} amount={amount} />
          </InfoPanel>
        </div>
      </div>

      {/* Plazo */}
      <Field id="term" label="Plazo" hint={termValid && termUnit === 'years' ? `${months} meses` : null}>
        <div className="flex gap-2">
          <InputShell className="flex-1" invalid={!termValid}>
            <input
              id="term"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className={inputClass}
              value={termInput}
              placeholder="0"
              onChange={(e) => onTermInputChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
            />
          </InputShell>
          <Segmented
            label="Unidad del plazo"
            className="h-14 shrink-0"
            value={termUnit}
            onChange={changeUnit}
            options={[
              { value: 'years', label: 'Años' },
              { value: 'months', label: 'Meses' },
            ]}
          />
        </div>
        <div className="-mx-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2" role="group" aria-label="Plazos frecuentes">
            {TERM_PRESETS[termUnit].map((v) => {
              const active = termValid && termNumber === v;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onTermInputChange(String(v))}
                  className={`h-11 whitespace-nowrap rounded-full px-4 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                    active ? 'bg-white font-medium text-ink ring-2 ring-inset ring-brand-600' : 'bg-field text-ink-soft hover:bg-line/70 hover:text-ink'
                  }`}
                >
                  {v} {termUnit === 'years' ? (v === 1 ? 'año' : 'años') : 'meses'}
                </button>
              );
            })}
          </div>
        </div>
      </Field>
    </div>
  );
}
