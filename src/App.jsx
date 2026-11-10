import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { rateEquivalences, simulateLoan } from './lib/finance.js';
import { parseDecimal } from './lib/format.js';
import { downloadAmortizationPDF } from './lib/pdf.js';
import { LoanInputs } from './components/LoanInputs.jsx';
import { ExtraPayments } from './components/ExtraPayments.jsx';
import { ResultsCard } from './components/ResultsCard.jsx';
import { PaymentsChart } from './components/PaymentsChart.jsx';
import { AmortizationTable } from './components/AmortizationTable.jsx';
import { Footer, Hero, HowItWorks, MobileSummaryBar, NavBar } from './components/Landing.jsx';

export default function App() {
  const [amount, setAmount] = useState(10_000_000);
  const [rateInput, setRateInput] = useState('18');
  const [termInput, setTermInput] = useState('5');
  const [termUnit, setTermUnit] = useState('years');
  const [extraPayments, setExtraPayments] = useState([]);

  const eaPct = parseDecimal(rateInput);
  const rates = useMemo(() => rateEquivalences(eaPct), [eaPct]);
  const termNumber = parseInt(termInput, 10);
  const months =
    Number.isInteger(termNumber) && termNumber > 0 ? (termUnit === 'years' ? termNumber * 12 : termNumber) : 0;

  const sim = useMemo(
    () => simulateLoan({ principal: amount, eaPct, months, extraPayments }),
    [amount, eaPct, months, extraPayments],
  );
  // El gráfico y la tabla se actualizan con prioridad baja para que los sliders vayan fluidos.
  const deferredSim = useDeferredValue(sim);

  const appliedMonths = useMemo(
    () => new Set(sim?.rows.filter((r) => r.extra > 0).map((r) => r.month)),
    [sim],
  );

  /* Barra de resumen en móvil: visible mientras se editan datos y el resultado no está en pantalla. */
  const inputsRef = useRef(null);
  const extrasRef = useRef(null);
  const resultsRef = useRef(null);
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    const seen = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) seen.set(entry.target, entry.isIntersecting);
        const editing = seen.get(inputsRef.current) || seen.get(extrasRef.current);
        setBarVisible(Boolean(editing) && !seen.get(resultsRef.current));
      },
      { rootMargin: '-72px 0px -96px 0px' },
    );
    for (const ref of [inputsRef, extrasRef, resultsRef]) if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleDownload = () =>
    downloadAmortizationPDF({ sim, eaPct, rates, termValue: termNumber, termUnit, extraPayments });

  return (
    <div className="min-h-screen">
      <a
        href="#simulador"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lift"
      >
        Ir al simulador
      </a>
      <NavBar />

      <main>
        <Hero />

        <section id="simulador" className="scroll-mt-24 px-4 sm:px-6" aria-labelledby="simulador-title">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-6">
              <div
                ref={inputsRef}
                className="card animate-fade-up p-5 sm:p-7 lg:col-span-7 lg:col-start-1 lg:row-start-1"
                style={{ animationDelay: '360ms' }}
              >
                <div className="mb-7">
                  <p className="eyebrow">Simulador</p>
                  <h2 id="simulador-title" className="mt-1.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                    Datos del préstamo
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">Ajusta los valores: todo se recalcula al instante.</p>
                </div>
                <LoanInputs
                  amount={amount}
                  onAmountChange={setAmount}
                  rateInput={rateInput}
                  onRateInputChange={setRateInput}
                  eaPct={eaPct}
                  rates={rates}
                  termInput={termInput}
                  onTermInputChange={setTermInput}
                  termUnit={termUnit}
                  onTermUnitChange={setTermUnit}
                />
              </div>

              <div
                ref={resultsRef}
                className="animate-fade-up scroll-mt-20 lg:sticky lg:top-24 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1"
                style={{ animationDelay: '440ms' }}
              >
                <ResultsCard sim={sim} eaPct={eaPct} rates={rates} onDownload={handleDownload} />
              </div>

              <div ref={extrasRef} className="lg:col-span-7 lg:col-start-1 lg:row-start-2">
                <ExtraPayments
                  extraPayments={extraPayments}
                  onAdd={(ep) => setExtraPayments((prev) => [...prev, ep])}
                  onRemove={(id) => setExtraPayments((prev) => prev.filter((ep) => ep.id !== id))}
                  maxMonth={months}
                  appliedMonths={appliedMonths}
                />
              </div>
            </div>

            {deferredSim && (
              <div className="mt-4 grid gap-4 lg:mt-6 lg:gap-6">
                <PaymentsChart sim={deferredSim} />
                <AmortizationTable sim={deferredSim} />
              </div>
            )}
          </div>
        </section>

        <HowItWorks />
      </main>

      <Footer />
      <MobileSummaryBar visible={barVisible} sim={sim} onView={scrollToResults} />
    </div>
  );
}
