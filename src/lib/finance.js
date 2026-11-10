// Cálculos financieros del simulador (sistema francés: cuota fija).
// Todas las tasas de entrada se expresan en porcentaje (24 = 24 %).

const EPSILON = 0.01;

/** Tasa efectiva mensual (decimal) equivalente a una tasa efectiva anual en %. */
export const monthlyRateFromEA = (eaPct) => {
  const ea = eaPct / 100;
  if (!Number.isFinite(ea) || ea <= -1) return NaN;
  if (ea === 0) return 0;
  return Math.pow(1 + ea, 1 / 12) - 1;
};

/**
 * Equivalencias de una tasa E.A.:
 *  - monthlyPct: tasa periódica mes vencido (M.V.)
 *  - nominalMonthlyPct: tasa nominal anual capitalizable mes vencido (N.M.V.) = 12 × M.V.
 */
export const rateEquivalences = (eaPct) => {
  const monthly = monthlyRateFromEA(eaPct);
  if (!Number.isFinite(monthly)) return { monthlyPct: NaN, nominalMonthlyPct: NaN };
  return { monthlyPct: monthly * 100, nominalMonthlyPct: monthly * 12 * 100 };
};

/** Cuota fija mensual. */
export const annuityPayment = (principal, monthlyRate, months) => {
  if (monthlyRate === 0) return principal / months;
  return principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
};

/**
 * Tabla de amortización mes a mes.
 * Los abonos extraordinarios de un mes se aplican a capital antes de liquidar
 * los intereses de ese mes y reducen el plazo (la cuota se mantiene).
 */
export const buildSchedule = ({ principal, monthlyRate, months, extraPayments = [] }) => {
  const payment = annuityPayment(principal, monthlyRate, months);
  const extrasByMonth = new Map();
  for (const ep of extraPayments) {
    extrasByMonth.set(ep.month, [...(extrasByMonth.get(ep.month) ?? []), ep.amount]);
  }

  const rows = [];
  let balance = principal;

  for (let month = 1; month <= months * 2 + 1 && balance > EPSILON; month++) {
    let extra = 0;
    for (const amount of extrasByMonth.get(month) ?? []) {
      if (balance <= EPSILON) break;
      const applied = Math.min(amount, balance);
      extra += applied;
      balance -= applied;
    }

    let interest = 0;
    let capital = 0;
    let paid = 0;

    if (balance > EPSILON) {
      interest = balance * monthlyRate;
      capital = payment - interest;
      if (capital > balance + EPSILON) {
        // Última cuota: solo se paga lo que queda.
        capital = balance;
        paid = capital + interest;
        balance = 0;
      } else {
        paid = payment;
        balance = Math.max(0, balance - capital);
      }
      capital = Math.max(0, capital);
      interest = Math.max(0, interest);
    } else {
      balance = 0;
    }

    rows.push({ month, payment: paid, interest, capital, extra, balance });
  }

  return { payment, rows };
};

const summarize = (rows) => {
  let interest = 0;
  let extra = 0;
  let installments = 0;
  for (const r of rows) {
    interest += r.interest;
    extra += r.extra;
    if (r.payment > EPSILON) installments += 1;
  }
  return { interest, extra, installments };
};

/** Simulación completa: plan con abonos + plan base sin abonos para comparar. */
export const simulateLoan = ({ principal, eaPct, months, extraPayments }) => {
  const monthlyRate = monthlyRateFromEA(eaPct);
  const valid =
    Number.isFinite(principal) && principal > 0 &&
    Number.isFinite(monthlyRate) && monthlyRate >= 0 &&
    Number.isInteger(months) && months > 0;

  if (!valid) return null;

  const plan = buildSchedule({ principal, monthlyRate, months, extraPayments });
  const base = extraPayments.length
    ? buildSchedule({ principal, monthlyRate, months })
    : plan;

  const actual = summarize(plan.rows);
  const baseline = summarize(base.rows);

  return {
    principal,
    months,
    monthlyRate,
    payment: plan.payment,
    rows: plan.rows,
    baselineRows: base.rows,
    totalInterest: actual.interest,
    totalExtra: actual.extra,
    totalPaid: principal + actual.interest,
    installments: actual.installments,
    baselineInterest: baseline.interest,
    baselineInstallments: baseline.installments,
    interestSaved: Math.max(0, baseline.interest - actual.interest),
    installmentsSaved: Math.max(0, baseline.installments - actual.installments),
  };
};

/** Agrupa la tabla en periodos (mes o año) para el gráfico de barras. */
export const groupPeriods = (rows, granularity) => {
  if (granularity === 'month') {
    return rows.map((r) => ({
      key: r.month,
      label: `Mes ${r.month}`,
      tick: String(r.month),
      capital: r.capital,
      interest: r.interest,
      extra: r.extra,
      payment: r.payment,
      balance: r.balance,
    }));
  }

  const years = [];
  for (const r of rows) {
    const y = Math.ceil(r.month / 12);
    let bucket = years[y - 1];
    if (!bucket) {
      bucket = { key: y, label: `Año ${y}`, tick: String(y), capital: 0, interest: 0, extra: 0, payment: 0, balance: 0, from: r.month, to: r.month };
      years[y - 1] = bucket;
    }
    bucket.capital += r.capital;
    bucket.interest += r.interest;
    bucket.extra += r.extra;
    bucket.payment += r.payment;
    bucket.balance = r.balance;
    bucket.to = r.month;
  }
  return years;
};

/**
 * Puntos del saldo en el tiempo (mes 0 = desembolso). Usa la duración del plan
 * base para que la curva con abonos muestre cuánto antes llega a cero.
 */
export const balancePoints = (sim, granularity) => {
  const horizon = sim.baselineRows.length;
  const at = (rows, month) => (month === 0 ? sim.principal : rows[month - 1]?.balance ?? 0);
  const step = granularity === 'month' ? 1 : 12;

  const months = [];
  for (let m = 0; m <= horizon; m += step) months.push(m);
  if (months[months.length - 1] !== horizon) months.push(horizon);

  return months.map((m) => ({
    month: m,
    label: m === 0 ? 'Desembolso' : granularity === 'month' ? `Mes ${m}` : m % 12 === 0 ? `Año ${m / 12}` : `Mes ${m}`,
    balance: at(sim.rows, m),
    baseline: at(sim.baselineRows, m),
  }));
};
