import { formatCompactCOP, formatCOP, formatInteger, formatPct, parseIntegerInput, toDecimalInput } from '../lib/format.js';
import { Icon, InputShell, RangeSlider, Segmented, inputClass } from './ui.jsx';

export const AMOUNT_MIN = 500_000;
export const AMOUNT_MAX = 500_000_000;
const AMOUNT_LIMIT = 99_999_999_999;
const RATE_MAX_SLIDER = 60;

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

export function LoanInputs({
  amount,
  onAmountChange,
  rateInput,
  onRateInputChange,
  eaPct,
  rates,
  termInput,
  onTermInputChange,
  termUnit,
  onTermUnitChange,
}) {
  const rateValid = Number.isFinite(eaPct) && eaPct >= 0;
  const termNumber = parseInt(termInput, 10);
  const termValid = Number.isInteger(termNumber) && termNumber > 0;
  const termMax = termUnit === 'years' ? 30 : 360;
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

      {/* Tasa E.A. + equivalencia N.M.V. */}
      <Field id="rate" label="Tasa efectiva anual (E.A.)">
        <InputShell suffix="% E.A." invalid={!rateValid}>
          <input
            id="rate"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={inputClass}
            value={rateInput}
            placeholder="0"
            onChange={(e) => onRateInputChange(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 6))}
          />
        </InputShell>
        <RangeSlider
          min={0}
          max={RATE_MAX_SLIDER}
          step={0.1}
          value={rateValid ? eaPct : 0}
          onChange={(v) => onRateInputChange(toDecimalInput(v))}
          label="Ajustar tasa efectiva anual"
          valueText={rateValid ? formatPct(eaPct) : 'Sin tasa'}
        />

        <div
          className="grid grid-cols-2 overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100"
          aria-live="polite"
        >
          <div className="p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
              <Icon name="percent" className="h-3.5 w-3.5" strokeWidth={2} />
              Tasa N.M.V.
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
              {rateValid ? formatPct(rates.nominalMonthlyPct) : '—'}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">Nominal mes vencido</p>
          </div>
          <div className="border-l border-brand-100 p-4">
            <p className="text-xs font-medium text-brand-700">Tasa mensual</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
              {rateValid ? formatPct(rates.monthlyPct, 3) : '—'}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">Mes vencido (M.V.)</p>
          </div>
        </div>
      </Field>

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
        <RangeSlider
          min={1}
          max={termMax}
          value={termValid ? termNumber : 1}
          onChange={(v) => onTermInputChange(String(v))}
          label="Ajustar plazo"
          valueText={termValid ? `${termNumber} ${termUnit === 'years' ? 'años' : 'meses'}` : 'Sin plazo'}
        />
        <div className="flex justify-between text-xs text-ink-muted">
          <span>1 {termUnit === 'years' ? 'año' : 'mes'}</span>
          <span>
            {termMax} {termUnit === 'years' ? 'años' : 'meses'}
          </span>
        </div>
      </Field>
    </div>
  );
}
