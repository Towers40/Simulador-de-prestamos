import { formatCOP, formatPct } from './format.js';

const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const AUTOTABLE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';

// Paleta del PDF alineada con la interfaz.
const BRAND = [15, 117, 99];
const BRAND_SOFT = [238, 247, 244];
const INK = [23, 33, 31];
const INK_SOFT = [97, 107, 104];
const LINE = [231, 229, 223];
const EXTRA = [111, 99, 211];
const EXTRA_SOFT = [239, 237, 251];

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });

let loader;
const loadJsPDF = () => {
  if (window.jspdf?.jsPDF?.API?.autoTable) return Promise.resolve();
  loader ??= loadScript(JSPDF_URL).then(() => loadScript(AUTOTABLE_URL));
  return loader.catch((err) => {
    loader = undefined;
    throw err;
  });
};

export async function downloadAmortizationPDF({ sim, eaPct, rates, termValue, termUnit, extraPayments }) {
  await loadJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const colW = (pageW - margin * 2 - 8) / 2;

  // Encabezado
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Simulador de Préstamos', margin, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Resumen y tabla de amortización · ${today}`, margin, 21);

  let y = 42;

  const sectionTitle = (title, x, width) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(title, x, y);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(x, y + 2.5, x + width, y + 2.5);
  };

  const keyValues = (items, x) => {
    let cy = y + 9;
    doc.setFontSize(9);
    for (const [label, value] of items) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...INK_SOFT);
      doc.text(label, x, cy);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...INK);
      doc.text(value, x + colW, cy, { align: 'right' });
      cy += 6.5;
    }
    return cy;
  };

  const plazo = `${termValue} ${termUnit === 'years' ? (Number(termValue) === 1 ? 'año' : 'años') : Number(termValue) === 1 ? 'mes' : 'meses'} (${sim.months} meses)`;

  const conditions = [
    ['Monto del préstamo', formatCOP(sim.principal)],
    ['Tasa efectiva anual (E.A.)', formatPct(eaPct)],
    ['Tasa nominal mes vencido (N.M.V.)', formatPct(rates.nominalMonthlyPct)],
    ['Tasa mensual (M.V.)', formatPct(rates.monthlyPct, 4)],
    ['Plazo', plazo],
  ];
  const results = [
    ['Cuota mensual', formatCOP(sim.payment)],
    ['Número de cuotas', String(sim.installments)],
    ['Intereses totales', formatCOP(sim.totalInterest)],
    ['Total a pagar', formatCOP(sim.totalPaid)],
    ['Intereses ahorrados con abonos', formatCOP(sim.interestSaved)],
  ];

  sectionTitle('Condiciones', margin, colW);
  sectionTitle('Resultados', margin + colW + 8, colW);
  const endLeft = keyValues(conditions, margin);
  const endRight = keyValues(results, margin + colW + 8);
  y = Math.max(endLeft, endRight) + 6;

  if (extraPayments.length > 0) {
    sectionTitle('Abonos extraordinarios', margin, pageW - margin * 2);
    doc.autoTable({
      startY: y + 6,
      head: [['Mes', 'Monto del abono']],
      body: [...extraPayments].sort((a, b) => a.month - b.month).map((ep) => [ep.month, formatCOP(ep.amount)]),
      styles: { fontSize: 8.5, cellPadding: 2.2, textColor: INK, lineColor: LINE },
      headStyles: { fillColor: EXTRA_SOFT, textColor: EXTRA, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 1) data.cell.styles.halign = 'right';
      },
      margin: { left: margin, right: margin },
      tableWidth: 90,
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  sectionTitle('Tabla de amortización', margin, pageW - margin * 2);
  const rows = sim.rows;
  doc.autoTable({
    startY: y + 6,
    head: [['Mes', 'Cuota', 'Interés', 'Capital', 'Abono', 'Saldo']],
    body: rows.map((r) => [
      r.month,
      formatCOP(r.payment),
      formatCOP(r.interest),
      formatCOP(r.capital),
      r.extra > 0 ? formatCOP(r.extra) : '—',
      formatCOP(r.balance),
    ]),
    styles: { fontSize: 7.8, cellPadding: 2, halign: 'right', textColor: INK, lineColor: LINE },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', halign: 'right' },
    columnStyles: { 0: { halign: 'center' } },
    alternateRowStyles: { fillColor: BRAND_SOFT },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index === 0) data.cell.styles.halign = 'center';
      if (data.section === 'body' && rows[data.row.index]?.extra > 0) {
        data.cell.styles.fillColor = EXTRA_SOFT;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: margin, right: margin, bottom: 18 },
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_SOFT);
    doc.text('Valores aproximados con fines informativos; no constituyen una oferta de crédito.', margin, pageH - 8);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  doc.save('tabla_amortizacion.pdf');
}
