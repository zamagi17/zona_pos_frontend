import * as XLSX from 'xlsx';

/**
 * Universal Excel (.xlsx) Exporter using SheetJS
 * Supports multiple sheets, auto-calculated column widths, and proper cell types.
 * 
 * @param {Array<{name: string, data: Array<Object>, columns?: Array<{header: string, key: string}>}> | {name: string, data: Array<Object>}} sheetInput
 * @param {string} fileName - Destination filename without extension
 */
export function exportToExcel(sheetInput, fileName = 'laporan-zona-pos') {
  const wb = XLSX.utils.book_new();
  const sheets = Array.isArray(sheetInput) ? sheetInput : [sheetInput];

  sheets.forEach((sheet, idx) => {
    const sheetName = (sheet.name || `Sheet${idx + 1}`).substring(0, 31); // Excel sheet name limit 31 chars
    let ws;

    if (sheet.columns && Array.isArray(sheet.columns)) {
      // Map data with custom headers
      const mappedData = sheet.data.map(item => {
        const row = {};
        sheet.columns.forEach(col => {
          row[col.header] = typeof col.formatter === 'function' ? col.formatter(item[col.key], item) : item[col.key];
        });
        return row;
      });
      ws = XLSX.utils.json_to_sheet(mappedData);
    } else {
      ws = XLSX.utils.json_to_sheet(sheet.data);
    }

    // Auto-calculate column widths
    const colWidths = [];
    if (sheet.data && sheet.data.length > 0) {
      const keys = sheet.columns ? sheet.columns.map(c => c.header) : Object.keys(sheet.data[0]);
      keys.forEach((key, colIdx) => {
        let maxLen = String(key).length;
        sheet.data.slice(0, 100).forEach(row => {
          const val = sheet.columns && sheet.columns[colIdx]?.formatter
            ? sheet.columns[colIdx].formatter(row[sheet.columns[colIdx].key], row)
            : row[key];
          if (val !== undefined && val !== null) {
            maxLen = Math.max(maxLen, String(val).length);
          }
        });
        colWidths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 50) });
      });
      ws['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fullFileName = `${fileName.replace(/\.xlsx$/i, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fullFileName);
}

/**
 * Universal CSV Exporter with UTF-8 BOM
 * Ensures Excel, Accurate, Jurnal, and Zahir open CSV without character encoding glitches.
 * 
 * @param {Array<Object>} data
 * @param {Array<{header: string, key: string, formatter?: Function}>} columns
 * @param {string} fileName
 */
export function exportToCsv(data, columns, fileName = 'laporan-zona-pos') {
  if (!data || data.length === 0) {
    alert('Tidak ada data yang dapat diekspor.');
    return;
  }

  const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(item => {
    return columns.map(col => {
      let val = item[col.key];
      if (typeof col.formatter === 'function') {
        val = col.formatter(val, item);
      }
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName.replace(/\.csv$/i, '')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatRupiah(val) {
  if (val === null || val === undefined) return 'Rp 0';
  return `Rp ${Number(val).toLocaleString('id-ID')}`;
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateStr);
  }
}
