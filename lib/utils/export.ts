import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// Cache for the font to avoid re-fetching
let greekFontBase64: string | null = null;

async function loadGreekFont(): Promise<string> {
  if (greekFontBase64) {
    return greekFontBase64;
  }
  
  try {
    // Use Noto Sans from Google Fonts API - full version with Greek support
    // This URL returns the actual TTF file for Noto Sans Regular
    const fontUrl = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9a6Vc.ttf';
    
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Font fetch failed: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    greekFontBase64 = btoa(binary);
    
    return greekFontBase64;
  } catch (error) {
    console.error('Failed to load Greek font:', error);
    // Return empty string to fall back to default font
    return '';
  }
}

function setupFont(doc: jsPDF, fontBase64: string): string {
  if (fontBase64) {
    doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.setFont('NotoSans');
    return 'NotoSans';
  }
  return 'helvetica';
}

export interface WeeklyReportData {
  storeName: string;
  weekStart: string;
  weekEnd: string;
  employees: {
    name: string;
    dailyHours: number[];
    total: number;
  }[];
  dayNames: string[];
  dailyTotals: number[];
  grandTotal: number;
}

export interface MonthlyReportData {
  storeName: string;
  monthYear: string;
  employees: {
    name: string;
    daysWorked: number;
    totalHours: number;
    avgHours: number;
  }[];
  totalDaysWorked: number;
  grandTotal: number;
}

export interface MonthlyPerDayReportData {
  storeName: string;
  monthYear: string;
  employees: {
    name: string;
    dailyHours: number[];
    total: number;
  }[];
  dayNames: string[];
  dailyTotals: number[];
  grandTotal: number;
}

export async function exportWeeklyReportToPDF(data: WeeklyReportData) {
  const fontBase64 = await loadGreekFont();
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Setup font for Greek character support
  const fontName = setupFont(doc, fontBase64);
  
  // Title
  doc.setFontSize(16);
  doc.text(`Weekly Report - ${data.storeName}`, 14, 15);
  doc.setFontSize(12);
  doc.text(`${data.weekStart} - ${data.weekEnd}`, 14, 22);
  
  // Table headers
  const headers = [['Employee', ...data.dayNames, 'Total']];
  
  // Table body
  const body = data.employees.map(emp => [
    emp.name,
    ...emp.dailyHours.map(h => h > 0 ? h.toFixed(2) : '-'),
    emp.total.toFixed(2)
  ]);
  
  // Add totals row
  body.push([
    'Daily Total',
    ...data.dailyTotals.map(t => t.toFixed(2)),
    data.grandTotal.toFixed(2)
  ]);
  
  autoTable(doc, {
    head: headers,
    body: body,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold', font: fontName },
    styles: { fontSize: 10, cellPadding: 3, font: fontName },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight totals
      if (data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [229, 231, 235];
        data.cell.styles.fontStyle = 'bold';
      }
      // Highlight total column
      if (data.column.index === headers[0].length - 1) {
        data.cell.styles.fillColor = [219, 234, 254];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  doc.save(`weekly-report-${data.weekStart}.pdf`);
}

export async function exportWeeklyReportToXLS(data: WeeklyReportData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Weekly Report');
  
  // Title rows
  worksheet.addRow([`Weekly Report - ${data.storeName}`]);
  worksheet.addRow([`${data.weekStart} - ${data.weekEnd}`]);
  worksheet.addRow([]);
  
  // Header row
  const headers = ['Employee', ...data.dayNames, 'Total'];
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  
  // Data rows
  data.employees.forEach(emp => {
    const row = worksheet.addRow([
      emp.name,
      ...emp.dailyHours.map(h => h > 0 ? h : ''),
      emp.total
    ]);
    row.getCell(headers.length).font = { bold: true };
    row.getCell(headers.length).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }
    };
  });
  
  // Totals row
  const totalsRow = worksheet.addRow([
    'Daily Total',
    ...data.dailyTotals,
    data.grandTotal
  ]);
  totalsRow.font = { bold: true };
  totalsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };
  
  // Set column widths
  worksheet.getColumn(1).width = 25;
  for (let i = 2; i <= headers.length; i++) {
    worksheet.getColumn(i).width = 15;
  }
  
  // Style title
  worksheet.getRow(1).font = { bold: true, size: 14 };
  
  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `weekly-report-${data.weekStart}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportMonthlyReportToPDF(data: MonthlyReportData) {
  const fontBase64 = await loadGreekFont();
  const doc = new jsPDF();
  
  // Setup font for Greek character support
  const fontName = setupFont(doc, fontBase64);
  
  // Title
  doc.setFontSize(16);
  doc.text(`Monthly Report - ${data.storeName}`, 14, 15);
  doc.setFontSize(12);
  doc.text(data.monthYear, 14, 22);
  
  // Table headers
  const headers = [['Employee', 'Days Worked', 'Total Hours', 'Avg Hours/Day']];
  
  // Table body
  const body = data.employees.map(emp => [
    emp.name,
    emp.daysWorked.toString(),
    emp.totalHours.toFixed(2),
    emp.avgHours.toFixed(2)
  ]);
  
  // Add totals row
  body.push([
    'Total',
    data.totalDaysWorked.toString(),
    data.grandTotal.toFixed(2),
    '-'
  ]);
  
  autoTable(doc, {
    head: headers,
    body: body,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold', font: fontName },
    styles: { fontSize: 10, cellPadding: 4, font: fontName },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', cellWidth: 40, fillColor: [219, 234, 254], fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 40 },
    },
    didParseCell: (data) => {
      // Highlight totals row
      if (data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [229, 231, 235];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  doc.save(`monthly-report-${data.monthYear.replace(' ', '-')}.pdf`);
}

export async function exportMonthlyReportToXLS(data: MonthlyReportData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Monthly Report');
  
  // Title rows
  worksheet.addRow([`Monthly Report - ${data.storeName}`]);
  worksheet.addRow([data.monthYear]);
  worksheet.addRow([]);
  
  // Header row
  const headers = ['Employee', 'Days Worked', 'Total Hours', 'Avg Hours/Day'];
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  
  // Data rows
  data.employees.forEach(emp => {
    const row = worksheet.addRow([
      emp.name,
      emp.daysWorked,
      emp.totalHours,
      emp.avgHours
    ]);
    row.getCell(3).font = { bold: true };
    row.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }
    };
  });
  
  // Totals row
  const totalsRow = worksheet.addRow([
    'Total',
    data.totalDaysWorked,
    data.grandTotal,
    '-'
  ]);
  totalsRow.font = { bold: true };
  totalsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };
  
  // Set column widths
  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 18;
  
  // Style title
  worksheet.getRow(1).font = { bold: true, size: 14 };
  
  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `monthly-report-${data.monthYear.replace(' ', '-')}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportMonthlyPerDayReportToPDF(data: MonthlyPerDayReportData) {
  const fontBase64 = await loadGreekFont();
  const doc = new jsPDF({ orientation: 'landscape' });

  // Setup font for Greek character support
  const fontName = setupFont(doc, fontBase64);

  // Title
  doc.setFontSize(16);
  doc.text(`Monthly Per Day Report - ${data.storeName}`, 14, 15);
  doc.setFontSize(12);
  doc.text(data.monthYear, 14, 22);

  // Table headers
  const headers = [['Employee', ...data.dayNames, 'Total']];

  // Table body
  const body = data.employees.map(emp => [
    emp.name,
    ...emp.dailyHours.map(h => h > 0 ? h.toFixed(2) : '-'),
    emp.total.toFixed(2)
  ]);

  // Add totals row
  body.push([
    'Daily Total',
    ...data.dailyTotals.map(t => t.toFixed(2)),
    data.grandTotal.toFixed(2)
  ]);

  autoTable(doc, {
    head: headers,
    body: body,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold', font: fontName },
    styles: { fontSize: 9, cellPadding: 2, font: fontName },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight totals
      if (data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [229, 231, 235];
        data.cell.styles.fontStyle = 'bold';
      }
      // Highlight total column
      if (data.column.index === headers[0].length - 1) {
        data.cell.styles.fillColor = [219, 234, 254];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  doc.save(`monthly-per-day-report-${data.monthYear.replace(' ', '-')}.pdf`);
}

export async function exportMonthlyPerDayReportToXLS(data: MonthlyPerDayReportData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Monthly Per Day');

  // Title rows
  worksheet.addRow([`Monthly Per Day Report - ${data.storeName}`]);
  worksheet.addRow([data.monthYear]);
  worksheet.addRow([]);

  // Header row
  const headers = ['Employee', ...data.dayNames, 'Total'];
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  // Data rows
  data.employees.forEach(emp => {
    const row = worksheet.addRow([
      emp.name,
      ...emp.dailyHours.map(h => h > 0 ? h : ''),
      emp.total
    ]);
    row.getCell(headers.length).font = { bold: true };
    row.getCell(headers.length).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDBEAFE' }
    };
  });

  // Totals row
  const totalsRow = worksheet.addRow([
    'Daily Total',
    ...data.dailyTotals,
    data.grandTotal
  ]);
  totalsRow.font = { bold: true };
  totalsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };

  // Set column widths
  worksheet.getColumn(1).width = 25;
  for (let i = 2; i <= headers.length; i++) {
    worksheet.getColumn(i).width = 12;
  }

  // Style title
  worksheet.getRow(1).font = { bold: true, size: 14 };

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `monthly-per-day-report-${data.monthYear.replace(' ', '-')}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
