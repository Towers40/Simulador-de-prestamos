import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function App() {
  // loanAmount: El valor numérico puro para los cálculos.
  const [loanAmount, setLoanAmount] = useState(100000);
  // displayLoanAmount: El valor string que se muestra en el input, con formato.
  // Inicializamos con el valor formateado
  const [displayLoanAmount, setDisplayLoanAmount] = useState(
    new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(100000)
  );

  const [annualInterestRate, setAnnualInterestRate] = useState(5);
  const [loanTerm, setLoanTerm] = useState(5);
  const [loanTermUnit, setLoanTermUnit] = useState('years');
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [chartData, setChartData] = useState([]);

  const tableRef = useRef(null);
  const loanAmountInputRef = useRef(null); // Nuevo ref para el input del monto del préstamo

  // Efecto para recalcular la amortización cuando cambian los inputs de cálculo.
  useEffect(() => {
    calculateAmortization();
  }, [loanAmount, annualInterestRate, loanTerm, loanTermUnit]);

  // Efecto para mantener 'displayLoanAmount' y el valor del DOM input sincronizados con 'loanAmount'.
  // Este useEffect es crucial para cuando loanAmount cambia programáticamente (no por teclear).
  useEffect(() => {
    let formattedValue = '';
    if (loanAmount !== '' && !isNaN(parseFloat(loanAmount))) {
      formattedValue = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(loanAmount));
    }

    setDisplayLoanAmount(formattedValue);
    // ¡IMPORTANTE!: Actualiza directamente el valor del DOM si el ref existe.
    // Esto asegura que el input refleje el estado formateado cuando no está en foco.
    if (loanAmountInputRef.current && document.activeElement !== loanAmountInputRef.current) {
      loanAmountInputRef.current.value = formattedValue;
    }
  }, [loanAmount]); // Depende de loanAmount

  const calculateAmortization = () => {
    const principal = parseFloat(loanAmount); // Usamos loanAmount directamente para los cálculos.
    const annualRate = parseFloat(annualInterestRate) / 100;
    let months = parseInt(loanTerm);

    if (loanTermUnit === 'years') {
      months = months * 12;
    }

    if (isNaN(principal) || isNaN(annualRate) || isNaN(months) || principal <= 0 || months <= 0) {
      setAmortizationSchedule([]);
      setChartData([]);
      return;
    }

    const monthlyRate = annualRate / 12;
    let monthlyPayment = 0;

    if (monthlyRate === 0) {
      monthlyPayment = principal / months;
    } else {
      monthlyPayment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
    }

    let remainingBalance = principal;
    const schedule = [];
    const dataForChart = [];

    for (let i = 1; i <= months; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      if (remainingBalance < 0) {
        remainingBalance = 0;
      }

      schedule.push({
        month: i,
        monthlyPayment: monthlyPayment,
        principalPayment: principalPayment,
        interestPayment: interestPayment,
        remainingBalance: remainingBalance,
      });

      dataForChart.push({
        month: i,
        'Pago a Capital': principalPayment,
        'Pago de Interés': interestPayment,
        'Saldo Restante': remainingBalance,
      });
    }
    setAmortizationSchedule(schedule);
    setChartData(dataForChart);

    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  };

  // Función para formatear moneda (usada en display de resúmenes y tablas)
  const formatCurrency = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return '$0';
    }
    // Modificación aquí: Establecer minimumFractionDigits y maximumFractionDigits a 0
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numValue);
  };

  // Función para limpiar el input: solo permite dígitos y un punto decimal.
  const cleanNumberInput = (value) => {
    return value.replace(/[^0-9.]/g, '');
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans text-main-text`}>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-10 text-center">
        Simulador de Préstamos
      </h1>

      {/* Bloque de resumen superior */}
      <div className={`bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-4xl mb-10 border border-gray-100`}>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-center`}>
          {/* Cuota Mensual */}
          <div className={`bg-primary-dark-blue p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center`}>
            <p className="text-sm md:text-base opacity-80 mb-1 whitespace-nowrap">Cuota Mensual:</p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">{formatCurrency(amortizationSchedule[0]?.monthlyPayment || 0)}</p>
          </div>
          {/* Número de pagos */}
          <div className={`bg-primary-dark-blue p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center`}>
            <p className="text-sm md:text-base opacity-80 mb-1 whitespace-nowrap">Número de pagos:</p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">
              {loanTermUnit === 'years' ? loanTerm * 12 : loanTerm}
            </p>
          </div>
          {/* Interés a Pagar */}
          <div className={`bg-primary-dark-blue p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center`}>
            <p className="text-sm md:text-base opacity-80 mb-1 whitespace-nowrap">Interés Total:</p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">
              {formatCurrency(amortizationSchedule.reduce((sum, row) => sum + row.interestPayment, 0))}
            </p>
          </div>
          {/* Montante Original */}
          <div className={`bg-primary-dark-blue p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center`}>
            <p className="text-sm md:text-base opacity-80 mb-1 whitespace-nowrap">Monto Original:</p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">{formatCurrency(loanAmount)}</p>
          </div>
        </div>
      </div>

      {/* Inputs de la calculadora - Contenedor con fondo azul claro, centrado y más corto */}
      <div className={`bg-light-blue-bg p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md mx-auto mb-10 border border-blue-200`}>
        <div className="grid grid-cols-1 gap-6 md:gap-8 mb-6">
          {/* Monto del Préstamo con formato */}
          <div>
            <label htmlFor="loanAmount" className={`block text-light-gray-text text-sm font-semibold mb-2`}>
              Monto del Préstamo:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold">$</span>
              <input
                type="text"
                id="loanAmount"
                ref={loanAmountInputRef} // Asigna el ref al input
                className="w-full pl-8 pr-4 py-2 border border-blue-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800 text-right"
                // REMOVIDO: value={displayLoanAmount} // NO CONTROLADO por React durante la escritura
                defaultValue={displayLoanAmount} // Usamos defaultValue para la inicialización (solo la primera vez)
                onChange={(e) => {
                  const rawValue = e.target.value;
                  const cleanNumString = cleanNumberInput(rawValue);

                  // Actualiza el valor del DOM directamente (Safari friendly)
                  if (loanAmountInputRef.current) {
                    loanAmountInputRef.current.value = rawValue;
                  }

                  // Actualiza loanAmount (el valor numérico real para cálculos)
                  if (cleanNumString !== '') {
                    setLoanAmount(parseFloat(cleanNumString));
                  } else {
                    setLoanAmount(''); // Si está vacío, guardar vacío para evitar NaN.
                  }
                }}
                onBlur={() => {
                  // Cuando el input pierde el foco, aplicar el formato final
                  let formattedValue = '';
                  if (loanAmount !== '' && !isNaN(parseFloat(loanAmount))) {
                    formattedValue = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(loanAmount));
                  }

                  // Sincroniza displayLoanAmount y el valor del DOM input
                  setDisplayLoanAmount(formattedValue);
                  if (loanAmountInputRef.current) {
                    loanAmountInputRef.current.value = formattedValue;
                  }
                }}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          </div>
          <div>
            <label htmlFor="annualInterestRate" className={`block text-light-gray-text text-sm font-semibold mb-2`}>
              Tasa de Interés Anual (%):
            </label>
            <input
              type="number"
              id="annualInterestRate"
              className="w-full px-4 py-2 border border-blue-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
              value={annualInterestRate}
              onChange={(e) => setAnnualInterestRate(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          {/* Campo de Plazo con selector de unidad */}
          <div>
            <label htmlFor="loanTerm" className={`block text-light-gray-text text-sm font-semibold mb-2`}>
              Plazo:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="loanTerm"
                className="w-full px-4 py-2 border border-blue-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                min="1"
              />
              <select
                id="loanTermUnit"
                className="px-3 py-2 border border-blue-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                value={loanTermUnit}
                onChange={(e) => setLoanTermUnit(e.target.value)}
              >
                <option value="years">Años</option>
                <option value="months">Meses</option>
              </select>
            </div>
          </div>
        </div>
        <button
          onClick={calculateAmortization}
          className="w-full mt-6 bg-button-blue hover:bg-hover-button-blue text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 active:bg-blue-800"
        >
          Calcular Amortización
        </button>
      </div>


      {/* Gráfico de Amortización */}
      {amortizationSchedule.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl mb-10 border border-gray-100">
          <h2 className={`text-xl md:text-2xl font-bold text-center text-light-gray-text mb-6`}>Visualización de los pagos mes a mes</h2>
          <ResponsiveContainer width="100%" aspect={2}>
            <BarChart
              data={chartData}
              width={500}
              height={900}
              margin={{
                top: 25,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={formatCurrency}
                domain={[0, Math.max(...chartData.map(item => item['Pago a Capital'] + item['Pago de Interés'])) * 1.1]}
                width={100}
              />
              <Tooltip
                formatter={(value, name) => [`${formatCurrency(value)}`, name]}
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#333', fontWeight: 'bold' }}
              />
              <Legend />
              <Bar dataKey="Pago a Capital" stackId="a" fill="#8884d8" />
              <Bar dataKey="Pago de Interés" stackId="a" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de Amortización */}
      {amortizationSchedule.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-4xl border border-gray-100">
          <h2 className={`text-xl md:text-2xl font-bold text-center text-light-gray-text mb-6`}>Tabla de Amortización Detallada</h2>
          <div className="overflow-x-auto overflow-y-auto max-h-96 relative rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className={`bg-primary-dark-blue text-white sticky top-0 z-10 shadow-sm`}>
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-tl-lg">
                    Mes
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    Cuota Mensual
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    Intereses
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    Capital
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider rounded-tr-lg">
                    Saldo Restante
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {amortizationSchedule.map((row, index) => (
                  <tr key={row.month} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.month}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                      {formatCurrency(row.monthlyPayment)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                      {formatCurrency(row.interestPayment)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                      {formatCurrency(row.principalPayment)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {formatCurrency(row.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;