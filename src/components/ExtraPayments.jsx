import { useState } from 'react';
import { formatCOP, formatInteger, parseIntegerInput } from '../lib/format.js';
import { Icon, InputShell, inputClass } from './ui.jsx';

export function ExtraPayments({ extraPayments, onAdd, onRemove, maxMonth, appliedMonths }) {
  const [open, setOpen] = useState(extraPayments.length > 0);
  const [amount, setAmount] = useState(0);
  const [month, setMonth] = useState('');
  const [error, setError] = useState('');

  const add = (e) => {
    e.preventDefault();
    const m = parseInt(month, 10);
    if (!(amount > 0)) {
      setError('Ingresa el monto del abono.');
      return;
    }
    if (!maxMonth) {
      setError('Primero define un plazo válido para el préstamo.');
      return;
    }
    if (!Number.isInteger(m) || m < 1 || m > maxMonth) {
      setError(`El mes debe estar entre 1 y ${maxMonth}.`);
      return;
    }
    onAdd({ id: Date.now(), amount, month: m });
    setAmount(0);
    setMonth('');
    setError('');
  };

  const sorted = [...extraPayments].sort((a, b) => a.month - b.month || a.id - b.id);

  return (
    <section className="card p-5 sm:p-7" aria-labelledby="abonos-title">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="abonos-panel"
        className="flex w-full items-center gap-4 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-extra-soft text-extra-ink">
          <Icon name="coins" />
        </span>
        <span className="min-w-0 flex-1">
          <span id="abonos-title" className="flex items-center gap-2 text-base font-semibold text-ink">
            Abonos extraordinarios
            {extraPayments.length > 0 && (
              <span className="rounded-full bg-extra-soft px-2 py-0.5 text-xs font-semibold text-extra-ink">
                {extraPayments.length}
              </span>
            )}
          </span>
          <span className="block text-sm text-ink-muted">Opcional · Paga menos intereses y termina antes</span>
        </span>
        <Icon
          name="chevronDown"
          className={`h-5 w-5 shrink-0 text-ink-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div id="abonos-panel" className="collapsible" data-open={open}>
        <div inert={!open}>
          <form onSubmit={add} className="space-y-3 px-0.5 pb-0.5 pt-6" noValidate>
            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <div className="space-y-2">
                <label htmlFor="extra-amount" className="text-sm font-medium text-ink-soft">
                  Monto del abono
                </label>
                <InputShell prefix="$">
                  <input
                    id="extra-amount"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className={inputClass}
                    value={amount > 0 ? formatInteger(amount) : ''}
                    placeholder="0"
                    onChange={(e) => {
                      setAmount(parseIntegerInput(e.target.value));
                      setError('');
                    }}
                  />
                </InputShell>
              </div>
              <div className="space-y-2">
                <label htmlFor="extra-month" className="text-sm font-medium text-ink-soft">
                  Mes del abono
                </label>
                <InputShell prefix={<Icon name="calendar" className="h-5 w-5" />}>
                  <input
                    id="extra-month"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className={inputClass}
                    value={month}
                    placeholder={maxMonth ? `1 – ${maxMonth}` : '—'}
                    onChange={(e) => {
                      setMonth(e.target.value.replace(/\D/g, '').slice(0, 3));
                      setError('');
                    }}
                  />
                </InputShell>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                <Icon name="info" className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-sm font-semibold text-white transition hover:bg-ink/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2"
            >
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.25} />
              Agregar abono
            </button>
          </form>

          {sorted.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Abonos agregados">
              {sorted.map((ep) => {
                const applied = appliedMonths.has(ep.month);
                return (
                  <li
                    key={ep.id}
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 text-sm ring-1 transition ${
                      applied ? 'bg-extra-soft text-ink ring-extra/20' : 'bg-field text-ink-muted ring-line'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${applied ? 'bg-extra' : 'bg-ink-muted/40'}`} aria-hidden="true" />
                    <span className="font-semibold">{formatCOP(ep.amount)}</span>
                    <span className="text-ink-muted">· mes {ep.month}</span>
                    {!applied && <span className="text-xs">(sin efecto)</span>}
                    <button
                      type="button"
                      onClick={() => onRemove(ep.id)}
                      className="grid h-7 w-7 place-items-center rounded-full text-ink-muted transition hover:bg-white hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                      aria-label={`Eliminar abono de ${formatCOP(ep.amount)} en el mes ${ep.month}`}
                    >
                      <Icon name="close" className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-ink-muted">
            <Icon name="info" className="mt-px h-4 w-4 shrink-0" />
            Los abonos van directo a capital: mantienes la misma cuota y terminas de pagar antes.
          </p>
        </div>
      </div>
    </section>
  );
}
