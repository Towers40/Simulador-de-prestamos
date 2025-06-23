import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function App() {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [displayLoanAmount, setDisplayLoanAmount] = useState(
    new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(100000)
  );

  const [annualInterestRate, setAnnualInterestRate] = useState(5);
  const [loanTerm, setLoanTerm] = useState(5);
  const [loanTermUnit, setLoanTermUnit] = useState('years');
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [chartData, setChartData] = useState([]);

  // State for extraordinary payments
  const [extraPayments, setExtraPayments] = useState([]); // Stores objects like { id: unique, amount: number, month: number }
  const [newExtraPaymentAmount, setNewExtraPaymentAmount] = useState('');
  const [newExtraPaymentMonth, setNewExtraPaymentMonth] = useState('');

  const [message, setMessage] = useState(''); // For custom alert messages

  const tableRef = useRef(null);
  const loanAmountInputRef = useRef(null);

  // Recalculate amortization whenever relevant inputs or extra payments change
  useEffect(() => {
    calculateAmortization();
  }, [loanAmount, annualInterestRate, loanTerm, loanTermUnit, extraPayments]);

  // Effect to format and display loan amount
  useEffect(() => {
    let formattedValue = '';
    if (loanAmount !== '' && !isNaN(parseFloat(loanAmount))) {
      formattedValue = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(loanAmount));
    }

    setDisplayLoanAmount(formattedValue);
    // Only update input value if it's not currently focused (to prevent cursor jumping)
    if (loanAmountInputRef.current && document.activeElement !== loanAmountInputRef.current) {
      loanAmountInputRef.current.value = formattedValue;
    }
  }, [loanAmount]);

  /**
   * Calculates the loan amortization schedule, incorporating extraordinary payments.
   */
  const calculateAmortization = () => {
    const principal = parseFloat(loanAmount);
    const annualRate = parseFloat(annualInterestRate) / 100;
    let totalMonths = parseInt(loanTerm);

    if (loanTermUnit === 'years') {
      totalMonths = totalMonths * 12;
    }

    // Input validation
    if (isNaN(principal) || isNaN(annualRate) || isNaN(totalMonths) || principal <= 0 || totalMonths <= 0) {
      setAmortizationSchedule([]);
      setChartData([]);
      return;
    }

    const monthlyRate = annualRate / 12;
    let monthlyPayment = 0;

    // Calculate initial monthly payment (PITI)
    if (monthlyRate === 0) {
      // Handle zero interest rate
      monthlyPayment = principal / totalMonths;
    } else {
      // Standard amortization formula
      monthlyPayment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
    }

    let remainingBalance = principal;
    const schedule = [];
    const dataForChart = [];

    // Sort extra payments by month to ensure they are applied in the correct sequence
    const sortedExtraPayments = [...extraPayments].sort((a, b) => a.month - b.month);
    let currentExtraPaymentIndex = 0;

    // Loop through months, breaking when the loan is fully paid or a safe upper limit is reached
    // Loop up to 2x the original term to allow for very long amortizations if needed
    for (let i = 1; i <= totalMonths * 2 + 1; i++) {
      // Break if remaining balance is effectively zero (due to floating point inaccuracies, check a small range)
      if (remainingBalance <= 0.01 && remainingBalance >= -0.01) {
        break;
      }

      // Apply any extraordinary payments scheduled for the current month
      while (currentExtraPaymentIndex < sortedExtraPayments.length && sortedExtraPayments[currentExtraPaymentIndex].month === i) {
        const ep = sortedExtraPayments[currentExtraPaymentIndex];
        if (remainingBalance > 0 && ep.amount > 0) {
          // Reduce the remaining balance by the extra payment amount
          remainingBalance = Math.max(0, remainingBalance - ep.amount);
        }
        currentExtraPaymentIndex++;
        // If loan is paid off immediately after an extra payment, break from inner loop
        if (remainingBalance <= 0.01 && remainingBalance >= -0.01) {
          break;
        }
      }

      // If loan is paid off after applying extra payments for this month, break from outer loop
      if (remainingBalance <= 0.01 && remainingBalance >= -0.01) {
        break;
      }

      // Calculate interest for the current month based on the remaining balance
      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      let actualMonthlyPaymentForRecord = monthlyPayment; // This will be the amount recorded for this month

      // Adjust for the final payment: if remaining balance is less than the calculated principal payment,
      // it means this is the last payment and we only need to pay the remaining balance plus interest.
      if (remainingBalance < principalPayment) {
        principalPayment = remainingBalance; // The actual principal paid is just the remaining balance
        actualMonthlyPaymentForRecord = principalPayment + interestPayment; // The actual final payment amount
        remainingBalance = 0; // Set remaining balance to zero for this entry
      } else {
        remainingBalance -= principalPayment;
      }

      // Ensure principal payment is not negative in the schedule if monthly payment doesn't cover interest
      // (though this scenario should ideally not happen with valid initial calculations)
      if (principalPayment < 0) {
        principalPayment = 0;
      }

      // Add the current month's payment details to the schedule
      schedule.push({
        month: i,
        monthlyPayment: actualMonthlyPaymentForRecord,
        principalPayment: principalPayment,
        interestPayment: interestPayment,
        remainingBalance: remainingBalance,
      });

      // Prepare data for the chart
      dataForChart.push({
        month: i,
        'Pago a Capital': principalPayment,
        'Pago de Interés': interestPayment,
        'Saldo Restante': remainingBalance,
      });
    }

    setAmortizationSchedule(schedule);
    setChartData(dataForChart);

    // Scroll to top of table if it exists
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  };

  /**
   * Formats a number as a Colombian Pesos currency string.
   * @param {number|string} value - The number to format.
   * @returns {string} The formatted currency string.
   */
  const formatCurrency = (value) => {
    let numValue = parseFloat(value);
    if (isNaN(numValue)) {
      numValue = 0; // Default to 0 for display if invalid
    }
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numValue);
  };

  /**
   * Cleans a string to contain only numbers and a single decimal point.
   * @param {string} value - The input string.
   * @returns {string} The cleaned numeric string.
   */
  const cleanNumberInput = (value) => {
    return value.replace(/[^0-9.]/g, '');
  };

  /**
   * Handles adding a new extraordinary payment to the list.
   */
  const handleAddExtraPayment = () => {
    const amount = parseFloat(cleanNumberInput(newExtraPaymentAmount));
    const month = parseInt(newExtraPaymentMonth);

    // Input validation for extra payment
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month <= 0) {
      setMessage('Por favor, ingresa un monto y mes válidos para el abono extraordinario.');
      return;
    }

    setExtraPayments(prev => [...prev, { id: Date.now(), amount, month }]);
    setNewExtraPaymentAmount('');
    setNewExtraPaymentMonth('');
    setMessage(''); // Clear any previous message
  };

  /**
   * Handles removing an extraordinary payment from the list.
   * @param {number} idToRemove - The unique ID of the payment to remove.
   */
  const handleRemoveExtraPayment = (idToRemove) => {
    setExtraPayments(prev => prev.filter(ep => ep.id !== idToRemove));
    setMessage(''); // Clear any previous message
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 font-sans text-gray-800 w-screen">
      {/* Custom message display for validation errors */}
      {message && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4 max-w-md mx-auto text-center" role="alert">
          <span className="block sm:inline">{message}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setMessage('')}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Cerrar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
          </span>
        </div>
      )}

      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-10 text-center mx-auto max-w-screen-xl">
        Simulador de Préstamos
      </h1>

      {/* Summary Block */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto mb-10 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-center">
          <div className="bg-blue-700 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1 whitespace-nowrap">Cuota Mensual:</p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">{formatCurrency(amortizationSchedule[0]?.monthlyPayment || 0)}</p>
          </div>
          <div className="bg-blue-700 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1 whitespace-nowrap">Número de pagos:</p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">
              {amortizationSchedule.length}
            </p>
          </div>
          <div className="bg-blue-700 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1 whitespace-nowrap">Interés Total:</p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">
              {formatCurrency(amortizationSchedule.reduce((sum, row) => sum + row.interestPayment, 0))}
            </p>
          </div>
          <div className="bg-blue-700 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1 whitespace-nowrap">Monto Original:</p>
            <p className="text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap">{formatCurrency(loanAmount)}</p>
          </div>
        </div>
      </div>

      {/* Calculator Inputs and Extra Payments Section */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-10 w-full max-w-5xl mx-auto mb-10">
        {/* Main Calculator Inputs */}
        <div className="bg-blue-100 p-8 md:p-10 rounded-3xl shadow-xl w-full lg:w-1/2 border border-blue-200">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-700 mb-6">Detalles del Préstamo</h2>
          <div className="grid grid-cols-1 gap-6 md:gap-8 mb-6">
            <div>
              <label htmlFor="loanAmount" className="block text-gray-600 text-sm font-semibold mb-2">
                Monto del Préstamo:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold">$</span>
                <input
                  type="text"
                  id="loanAmount"
                  ref={loanAmountInputRef}
                  className="w-full pl-8 pr-4 py-2 border border-blue-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800 text-right"
                  defaultValue={displayLoanAmount}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const cleanNumString = cleanNumberInput(rawValue);

                    // Update the input field directly for immediate visual feedback
                    if (loanAmountInputRef.current) {
                      loanAmountInputRef.current.value = rawValue;
                    }

                    // Set state with the cleaned number
                    if (cleanNumString !== '') {
                      setLoanAmount(parseFloat(cleanNumString));
                    } else {
                      setLoanAmount('');
                    }
                  }}
                  onBlur={() => {
                    // Reformat on blur to ensure consistent display
                    let formattedValue = '';
                    if (loanAmount !== '' && !isNaN(parseFloat(loanAmount))) {
                      formattedValue = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(loanAmount));
                    }
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
              <label htmlFor="annualInterestRate" className="block text-gray-600 text-sm font-semibold mb-2">
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
            <div>
              <label htmlFor="loanTerm" className="block text-gray-600 text-sm font-semibold mb-2">
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
        </div>

        {/* Extra Payments Section */}
        <div className="bg-blue-100 p-8 md:p-10 rounded-3xl shadow-xl w-full lg:w-1/2 border border-blue-200">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-700 mb-6">Abonos Extraordinarios</h2>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label htmlFor="newExtraPaymentAmount" className="block text-gray-600 text-sm font-semibold mb-2">
                Monto del Abono:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold">$</span>
                <input
                  type="text"
                  id="newExtraPaymentAmount"
                  className="w-full pl-8 pr-4 py-2 border border-blue-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800 text-right"
                  value={newExtraPaymentAmount}
                  onChange={(e) => setNewExtraPaymentAmount(cleanNumberInput(e.target.value))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            </div>
            <div>
              <label htmlFor="newExtraPaymentMonth" className="block text-gray-600 text-sm font-semibold mb-2">
                Mes en el que se realiza:
              </label>
              <input
                type="number"
                id="newExtraPaymentMonth"
                className="w-full px-4 py-2 border border-blue-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800"
                value={newExtraPaymentMonth}
                onChange={(e) => setNewExtraPaymentMonth(e.target.value)}
                min="1"
              />
            </div>
            <button
              onClick={handleAddExtraPayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 active:bg-blue-800"
            >
              Agregar Abono
            </button>
          </div>

          {/* List of current extra payments */}
          {extraPayments.length > 0 && (
            <div className="mt-6 border-t border-blue-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Abonos Agregados:</h3>
              <ul className="space-y-3">
                {extraPayments.map((ep) => (
                  <li key={ep.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                    <span className="text-gray-800 text-sm md:text-base">
                      {formatCurrency(ep.amount)} en el Mes {ep.month}
                    </span>
                    <button
                      onClick={() => handleRemoveExtraPayment(ep.id)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      aria-label={`Eliminar abono de ${formatCurrency(ep.amount)} en el Mes ${ep.month}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>


      {/* Amortization Chart */}
      {amortizationSchedule.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-5xl mx-auto mb-10 border border-gray-100">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-700 mb-6">Visualización de los pagos mes a mes</h2>
          <ResponsiveContainer width="100%" aspect={2}>
            <BarChart
              data={chartData}
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
                // Dynamically set Y-axis domain to fit data, adding 10% padding
                domain={[0, Math.max(...chartData.map(item => item['Pago a Capital'] + item['Pago de Interés'])) * 1.1]}
                width={100} // Give Y-axis some fixed width for formatting
              />
              <Tooltip
                formatter={(value, name) => [`${formatCurrency(value)}`, name]}
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#333', fontWeight: 'bold' }}
              />
              <Legend />
              <Bar dataKey="Pago a Capital" stackId="a" fill="#4299E1" /> {/* Tailwind blue-500 */}
              <Bar dataKey="Pago de Interés" stackId="a" fill="#81C784" /> {/* A light green */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Amortization Table */}
      {amortizationSchedule.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-5xl mx-auto border border-gray-100">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-700 mb-6">Tabla de Amortización Detallada</h2>
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] relative rounded-lg border border-gray-200"> {/* Increased max-height slightly */}
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-blue-700 text-white sticky top-0 z-10 shadow-sm">
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
