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
  const [totalInterestSaved, setTotalInterestSaved] = useState(0);

  // Estado para los abonos extraordinarios
  const [extraPayments, setExtraPayments] = useState([]); // Almacena objetos como { id: unique, amount: number, month: number }
  const [newExtraPaymentAmount, setNewExtraPaymentAmount] = useState(0); // Ahora almacena un número, 0 si está vacío
  const [displayNewExtraPaymentAmount, setDisplayNewExtraPaymentAmount] = useState(''); // Para la visualización formateada en el input
  const [newExtraPaymentMonth, setNewExtraPaymentMonth] = useState('');

  const [message, setMessage] = useState(''); // Para mensajes de alerta personalizados

  // Se eliminaron las referencias a useRef para los inputs ya que ahora son componentes controlados.

  // Recalcular la amortización cada vez que los inputs relevantes o los abonos extra cambian
  useEffect(() => {
    calculateAmortization();
  }, [loanAmount, annualInterestRate, loanTerm, loanTermUnit, extraPayments]);

  // Efecto para formatear y mostrar el monto del préstamo cuando cambia el estado numérico `loanAmount`
  useEffect(() => {
    if (typeof loanAmount === 'number' && !isNaN(loanAmount)) {
      setDisplayLoanAmount(new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(loanAmount));
    } else {
      setDisplayLoanAmount(''); // Si no es un número válido, el input se muestra vacío
    }
  }, [loanAmount]);

  // Efecto para formatear y mostrar el nuevo monto de abono extra cuando cambia el estado numérico `newExtraPaymentAmount`
  useEffect(() => {
    if (typeof newExtraPaymentAmount === 'number' && !isNaN(newExtraPaymentAmount)) {
      setDisplayNewExtraPaymentAmount(new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(newExtraPaymentAmount));
    } else {
      setDisplayNewExtraPaymentAmount(''); // Si no es un número válido, el input se muestra vacío
    }
  }, [newExtraPaymentAmount]);

  /**
   * Limpia una cadena para que contenga solo números y un único punto decimal (para parseFloat).
   * Asume que la entrada de usuario usará coma como separador decimal si es el caso.
   * @param {string} value - La cadena de entrada.
   * @returns {string} La cadena numérica limpia, con punto como decimal separator.
   */
  const cleanNumberInput = (value) => {
    // Eliminar todo lo que no sea dígito o coma
    let cleaned = value.replace(/[^0-9,]/g, '');
    // Permitir solo una coma (asumida como separador decimal para es-CO)
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    // Reemplazar coma con punto para que parseFloat funcione correctamente
    return cleaned.replace(',', '.');
  };

  /**
   * Formatea un número como una cadena de moneda de Pesos Colombianos.
   * @param {number|string} value - El número a formatear.
   * @returns {string} La cadena de moneda formateada.
   */
  const formatCurrency = (value) => {
    let numValue = parseFloat(value);
    if (isNaN(numValue)) {
      numValue = 0; // Por defecto 0 para la visualización si es inválido
    }
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numValue);
  };

  /**
   * Calcula el interés total para un plan de amortización estándar sin abonos extra.
   * Se utiliza para establecer una línea de base para el interés ahorrado.
   */
  const calculateTotalInterestWithoutExtraPayments = (principal, annualRatePercentage, totalMonths) => {
    if (isNaN(principal) || principal <= 0 || isNaN(annualRatePercentage) || totalMonths <= 0) {
      return 0;
    }

    const annualRate = annualRatePercentage / 100; // Convertir a decimal
    const monthlyRate = annualRate / 12;
    let monthlyPayment;

    if (monthlyRate === 0) {
      monthlyPayment = principal / totalMonths;
    } else {
      monthlyPayment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonths)));
    }

    let remainingBalance = principal;
    let totalInterest = 0;

    for (let i = 1; i <= totalMonths; i++) {
      if (remainingBalance <= 0.01) break; // Si el saldo es casi cero, se considera pagado

      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;

      if (principalPayment < 0) {
        principalPayment = 0;
      }

      if (remainingBalance < principalPayment) {
        principalPayment = remainingBalance;
      }

      totalInterest += interestPayment;
      remainingBalance -= principalPayment;
    }
    return totalInterest;
  };


  /**
   * Calcula el plan de amortización del préstamo, incorporando abonos extraordinarios.
   */
  const calculateAmortization = () => {
    const principal = parseFloat(loanAmount);
    const annualRate = parseFloat(annualInterestRate) / 100;
    let initialTotalMonths = parseInt(loanTerm);

    if (loanTermUnit === 'years') {
      initialTotalMonths = initialTotalMonths * 12;
    }

    // Validación de entradas
    if (isNaN(principal) || isNaN(annualRate) || isNaN(initialTotalMonths) || principal <= 0 || initialTotalMonths <= 0) {
      setAmortizationSchedule([]);
      setChartData([]);
      setTotalInterestSaved(0);
      return;
    }

    const monthlyRate = annualRate / 12;
    let originalMonthlyPayment;

    if (monthlyRate === 0) {
      originalMonthlyPayment = principal / initialTotalMonths;
    } else {
      originalMonthlyPayment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -initialTotalMonths)));
    }

    // Calcular el interés total de referencia sin abonos extra
    const baselineTotalInterest = calculateTotalInterestWithoutExtraPayments(principal, annualInterestRate, initialTotalMonths);


    let currentRemainingBalance = principal;
    const schedule = [];
    const dataForChart = [];
    let currentTotalInterestPaid = 0;

    // Ordenar los abonos extra por mes para asegurar que se apliquen en la secuencia correcta
    const sortedExtraPayments = [...extraPayments].sort((a, b) => a.month - b.month);
    let extraPaymentIdx = 0;

    // Bucle a través de los meses. El bucle máximo es 2 veces el plazo inicial para manejar casos extremos.
    // El bucle continúa hasta que el saldo sea efectivamente cero.
    for (let i = 1; i <= initialTotalMonths * 2 + 1 && currentRemainingBalance > 0.01; i++) {
      let interestPaymentThisMonth = currentRemainingBalance * monthlyRate;
      let regularPrincipalPaymentThisMonth = originalMonthlyPayment - interestPaymentThisMonth;
      let extraPaymentAppliedThisMonth = 0; // Inicializar a 0 para cada mes

      // Aplicar cualquier abono extraordinario programado para el mes actual
      while (extraPaymentIdx < sortedExtraPayments.length && sortedExtraPayments[extraPaymentIdx].month === i) {
        const ep = sortedExtraPayments[extraPaymentIdx];
        if (currentRemainingBalance > 0.01) { // Solo aplicar si aún hay saldo
          extraPaymentAppliedThisMonth += ep.amount;
          currentRemainingBalance = Math.max(0, currentRemainingBalance - ep.amount);
        }
        extraPaymentIdx++;
        if (currentRemainingBalance <= 0.01) break; // Si el préstamo se paga inmediatamente después de un abono extra, salir
      }

      // Si el préstamo ya fue pagado por abonos extra, o el saldo restante es muy pequeño
      if (currentRemainingBalance <= 0.01) {
        interestPaymentThisMonth = 0;
        regularPrincipalPaymentThisMonth = 0;
        // Si no hay saldo, el pago mensual registrado es 0
        actualMonthlyPaymentRecorded = 0;
      } else {
        // Recalcular el interés basado en el saldo después de los abonos extra (si los hubo)
        interestPaymentThisMonth = currentRemainingBalance * monthlyRate;
        regularPrincipalPaymentThisMonth = originalMonthlyPayment - interestPaymentThisMonth;

        // Ajustar para el pago final
        if (regularPrincipalPaymentThisMonth > currentRemainingBalance + 0.01) {
          regularPrincipalPaymentThisMonth = currentRemainingBalance;
          actualMonthlyPaymentRecorded = regularPrincipalPaymentThisMonth + interestPaymentThisMonth;
          currentRemainingBalance = 0;
        } else {
          actualMonthlyPaymentRecorded = originalMonthlyPayment; // El pago mensual es el original
          currentRemainingBalance -= regularPrincipalPaymentThisMonth;
        }

        // Asegurarse de que no haya valores negativos en los pagos
        if (regularPrincipalPaymentThisMonth < 0) regularPrincipalPaymentThisMonth = 0;
        if (interestPaymentThisMonth < 0) interestPaymentThisMonth = 0;
      }

      currentTotalInterestPaid += interestPaymentThisMonth;

      // Agregar al schedule y a los datos del gráfico
      schedule.push({
        month: i,
        monthlyPayment: actualMonthlyPaymentRecorded,
        principalPayment: regularPrincipalPaymentThisMonth, // Este es el capital de pago mensual regular
        interestPayment: interestPaymentThisMonth,
        remainingBalance: currentRemainingBalance,
        extraPaymentApplied: extraPaymentAppliedThisMonth > 0 ? extraPaymentAppliedThisMonth : null,
      });

      dataForChart.push({
        month: i,
        'Pago a Capital (Regular)': regularPrincipalPaymentThisMonth,
        'Pago de Interés': interestPaymentThisMonth,
        'Abono Extraordinario': extraPaymentAppliedThisMonth > 0 ? extraPaymentAppliedThisMonth : 0, // Asegurarse de que sea 0 si no hay abono extra
        'Saldo Restante': currentRemainingBalance,
      });

      // Romper el bucle si el saldo está pagado.
      if (currentRemainingBalance <= 0.01) break;
    }

    setAmortizationSchedule(schedule);
    setChartData(dataForChart);
    setTotalInterestSaved(baselineTotalInterest - currentTotalInterestPaid);
  };

  /**
   * Maneja la adición de un nuevo abono extraordinario a la lista.
   */
  const handleAddExtraPayment = () => {
    // Usar el estado numérico para el monto
    const amount = newExtraPaymentAmount; // newExtraPaymentAmount ya es un número
    const month = parseInt(newExtraPaymentMonth);
    let initialTotalMonths = parseInt(loanTerm);
    if (loanTermUnit === 'years') {
      initialTotalMonths = initialTotalMonths * 12;
    }

    // Validación de entrada para el abono extra
    if (isNaN(amount) || amount <= 0) {
      setMessage('Por favor, ingresa un monto válido para el abono extraordinario.');
      return;
    }
    // Permitir abonos hasta un período razonable más allá del plazo inicial (ej. el doble del plazo)
    if (isNaN(month) || month <= 0 || month > initialTotalMonths * 2 + 1) {
      setMessage(`Por favor, ingresa un mes válido (entre 1 y ${initialTotalMonths * 2 + 1}).`);
      return;
    }

    setExtraPayments(prev => [...prev, { id: Date.now(), amount, month }]);
    setNewExtraPaymentAmount(0); // Limpiar el estado numérico para la próxima entrada
    setNewExtraPaymentMonth('');
    setMessage(''); // Limpiar cualquier mensaje previo
  };

  /**
   * Maneja la eliminación de un abono extraordinario de la lista.
   * @param {number} idToRemove - El ID único del pago a eliminar.
   */
  const handleRemoveExtraPayment = (idToRemove) => {
    setExtraPayments(prev => prev.filter(ep => ep.id !== idToRemove));
    setMessage(''); // Limpiar cualquier mensaje previo
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 font-sans text-gray-800 w-screen">
      {/* Visualización de mensajes de validación personalizados */}
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

      {/* Bloque de Resumen */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto mb-10 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 text-center">
          <div className="bg-blue-700 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1">Cuota Mensual:</p>
            {/* Ajuste de tamaño de fuente para mejorar el ajuste */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">{formatCurrency(amortizationSchedule[0]?.monthlyPayment || 0)}</p>
          </div>
          <div className="bg-blue-700 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1">Número de pagos:</p>
            {/* Ajuste de tamaño de fuente para mejorar el ajuste */}
            <p className="text-base sm:text-lg md:text-xl font-bold">
              {amortizationSchedule.length}
            </p>
          </div>
          <div className="bg-blue-700 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1">Interés Total Pagado:</p>
            {/* Ajuste de tamaño de fuente para mejorar el ajuste */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">
              {formatCurrency(amortizationSchedule.reduce((sum, row) => sum + row.interestPayment, 0))}
            </p>
          </div>
          {/* Nueva casilla para el Interés Ahorrado */}
          <div className="bg-green-600 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1">Interés Total Ahorrado:</p>
            {/* Ajuste de tamaño de fuente para mejorar el ajuste */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">
              {formatCurrency(totalInterestSaved)}
            </p>
          </div>
          <div className="bg-blue-700 p-3 md:p-4 rounded-lg text-white shadow-md flex flex-col justify-center">
            <p className="text-sm md:text-base opacity-80 mb-1">Monto Original:</p>
            {/* Ajuste de tamaño de fuente para mejorar el ajuste */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">{formatCurrency(loanAmount)}</p>
          </div>
        </div>
      </div>

      {/* Sección de Inputs de la Calculadora y Abonos Extra */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-10 w-full max-w-5xl mx-auto mb-10">
        {/* Inputs principales de la calculadora */}
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
                  type="text" // Mantener como texto para controlar el formato
                  id="loanAmount"
                  className="w-full pl-8 pr-4 py-2 border border-blue-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800 text-right"
                  value={displayLoanAmount} // Componente controlado
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    setDisplayLoanAmount(rawValue); // Actualizar el estado de display con la entrada cruda del usuario
                    const cleanNum = cleanNumberInput(rawValue);
                    setLoanAmount(cleanNum !== '' ? parseFloat(cleanNum) : 0); // Actualizar el estado numérico
                  }}
                  onBlur={() => {
                    // Al perder el foco, forzar el formato basado en el estado numérico actual
                    if (typeof loanAmount === 'number' && !isNaN(loanAmount)) {
                      setDisplayLoanAmount(new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(loanAmount));
                    } else {
                      setDisplayLoanAmount('');
                    }
                  }}
                  inputMode="numeric"
                  pattern="[0-9,]*" // Permite dígitos y comas
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

        {/* Sección de Abonos Extra */}
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
                  value={displayNewExtraPaymentAmount} // Componente controlado
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    setDisplayNewExtraPaymentAmount(rawValue); // Actualizar el estado de display con la entrada cruda del usuario
                    const cleanNum = cleanNumberInput(rawValue);
                    setNewExtraPaymentAmount(cleanNum !== '' ? parseFloat(cleanNum) : 0); // Actualizar el estado numérico
                  }}
                  onBlur={() => {
                    // Al perder el foco, forzar el formato basado en el estado numérico actual
                    if (typeof newExtraPaymentAmount === 'number' && !isNaN(newExtraPaymentAmount)) {
                      setDisplayNewExtraPaymentAmount(new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(newExtraPaymentAmount));
                    } else {
                      setDisplayNewExtraPaymentAmount('');
                    }
                  }}
                  inputMode="numeric"
                  pattern="[0-9,]*" // Permite dígitos y comas
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

          {/* Lista de abonos extra actuales */}
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


      {/* Gráfico de Amortización */}
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
                domain={[0, chartData.length > 0 ? Math.max(...chartData.map(item => (item['Pago a Capital (Regular)'] || 0) + (item['Pago de Interés'] || 0) + (item['Abono Extraordinario'] || 0))) * 1.1 : 'auto']}
                width={100}
              />
              <Tooltip
                formatter={(value, name) => [`${formatCurrency(value)}`, name]}
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#333', fontWeight: 'bold' }}
              />
              <Legend />
              <Bar dataKey="Pago a Capital (Regular)" stackId="a" fill="#4299E1" /> {/* Azul para capital regular */}
              <Bar dataKey="Pago de Interés" stackId="a" fill="#81C784" /> {/* Verde claro para interés */}
              <Bar dataKey="Abono Extraordinario" stackId="a" fill="#FFD700" /> {/* Dorado para abonos extra */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de Amortización */}
      {amortizationSchedule.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-5xl mx-auto border border-gray-100">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-700 mb-6">Tabla de Amortización Detallada</h2>
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] relative rounded-lg border border-gray-200">
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
                  <tr key={row.month} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${row.extraPaymentApplied ? 'bg-yellow-50 font-semibold border-l-4 border-yellow-500' : ''} hover:bg-blue-50 transition-colors duration-150`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.month}
                      {row.extraPaymentApplied && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold text-yellow-800 bg-yellow-200 rounded-full">
                          Abono {formatCurrency(row.extraPaymentApplied)}
                        </span>
                      )}
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
