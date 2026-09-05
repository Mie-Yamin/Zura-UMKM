// src/utils/exportHelpers.ts
import ExcelJS from 'exceljs';

// ─── SECURITY HELPER ──────────────────────────────────────────────────────────
// Sanitasi / escape HTML untuk mencegah XSS pada konten yang berisi data user
export const escapeHtml = (value: unknown): string => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Sanitasi nama file download (cegah path traversal / karakter berbahaya)
export const sanitizeFileName = (filename: string): string => {
  const cleaned = filename.replace(/[\\/:*?"<>|]/g, '-').trim();
  return cleaned || 'export';
};

// 1. Fungsi Ekspor Excel (menggunakan exceljs - aman dari injeksi formula/XML)
//    format angka mengikuti style Zura (Rp) dengan kolom bernomor
export const exportToExcel = async (
    filename: string,
    sheetName: string,
    headers: string[],
    rows: (string | number)[][]
) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Zura Retail';
    const sheet = workbook.addWorksheet(sheetName || 'Sheet1');

    // ── STYLE HEADER: maroon #5F1E1E dengan teks emas #E8D3A7 ──
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFE8D3A7' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5F1E1E' } };
        cell.alignment = { horizontal: "left", vertical: "middle" };
        cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFB48328' } },
            top: { style: 'thin', color: { argb: 'FFB48328' } },
            left: { style: 'thin', color: { argb: 'FFB48328' } },
            right: { style: 'thin', color: { argb: 'FFB48328' } },
        };
    });
    headerRow.height = 24;

    // Lebar kolom: kolom pertama lebih lebar (label), sisanya untuk angka
    headers.forEach((_, idx) => {
        const col = sheet.getColumn(idx + 1);
        col.width = idx === 0 ? 40 : 18;
    });

    // ── DATA ROWS ──
    rows.forEach((row) => {
        const isNet = String(row[0]).includes('LABA BERSIH');
        const labelColor = isNet ? { argb: 'FFE8D3A7' } : { argb: 'FF5F1E1E' };
        const cellFill = isNet
            ? { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF5F1E1E' } }
            : undefined;

        const dataRow = sheet.addRow(row);
        dataRow.height = 20;

        // Kolom label (teks)
        const labelCell = dataRow.getCell(1);
        labelCell.font = { name: 'Arial', size: 10, color: labelColor, bold: isNet };
        if (cellFill) labelCell.fill = cellFill;
        labelCell.alignment = { horizontal: "left", vertical: "middle" };

        // Kolom angka (number format Rp)
        const numCell = dataRow.getCell(2);
        numCell.font = { name: 'Arial', size: 10, color: labelColor, bold: isNet };
        if (cellFill) numCell.fill = cellFill;
        numCell.alignment = { horizontal: "right", vertical: "middle" };
        numCell.numFmt = '"Rp "#,##0';
    });

    // ── GENERATE BLOB ──
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFileName(filename)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// 2. Fungsi Cetak PDF (Pastikan nama fungsi 'exportToPdfPrint' persis seperti ini)
//    Aman: semua nilai user di-escape sebelum disisipkan ke HTML print window
export const exportToPdfPrint = (title: string, tableElementId: string) => {
    const tableEl = document.getElementById(tableElementId);
    if (!tableEl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Escape judul/title untuk mencegah stored-XSS di window print (same-origin)
    const safeTitle = escapeHtml(title);

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${safeTitle}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Arial', sans-serif; padding: 10px; color: #5F1E1E; }
          .header { background: #5F1E1E; color: #E8D3A7; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          td { border-bottom: 1px solid #E2E8F0; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ZURA RETAIL - ${safeTitle}</h1>
        </div>
      </body>
    </html>
  `;

    // Gunakan HTML statis untuk struktur, lalu kloning node tabel yang ada
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Salin konten tabel (DOM node asli) ke section tanpa menganalisis ulang teks.
    // cloneNode(true) mempertahankan struktur DOM sah yang sudah dirender React,
    // bukan mengembalikan serialisasi string yang berpotensi disuntikkan.
    const bodyEl = printWindow.document.body;
    const clonedTable = tableEl.cloneNode(true) as HTMLElement;
    bodyEl.appendChild(clonedTable);

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 300);
};