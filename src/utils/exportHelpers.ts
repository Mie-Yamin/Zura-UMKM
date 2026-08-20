// src/utils/exportHelpers.ts

// 1. Fungsi Ekspor Excel
export const exportToExcel = (
    filename: string,
    sheetName: string,
    headers: string[],
    rows: (string | number)[][]
) => {
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="HeaderStyle">
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#E8D3A7"/>
      <Interior ss:Color="#5F1E1E" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B48328"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B48328"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B48328"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B48328"/>
      </Borders>
    </Style>
    <Style ss:ID="CellStyle">
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#5F1E1E"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="NumberStyle">
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#5F1E1E"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="NetProfitStyle">
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#E8D3A7"/>
      <Interior ss:Color="#5F1E1E" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B48328"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B48328"/>
      </Borders>
    </Style>
    <Style ss:ID="NetProfitNumberStyle">
      <Font ss:FontName="Arial" ss:Size="10" ss:Bold="1" ss:Color="#E5C88B"/>
      <Interior ss:Color="#5F1E1E" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B48328"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B48328"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="${sheetName}">
    <Table>
      <Column ss:Width="300"/>
      <Column ss:Width="150"/>
      <Row ss:Height="24">
        ${headers.map((h) => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${h}</Data></Cell>`).join('')}
      </Row>`;

    rows.forEach((row) => {
        const isNet = String(row[0]).includes('LABA BERSIH');
        const labelStyle = isNet ? 'NetProfitStyle' : 'CellStyle';
        const numStyle = isNet ? 'NetProfitNumberStyle' : 'NumberStyle';

        xml += `
      <Row ss:Height="20">
        <Cell ss:StyleID="${labelStyle}"><Data ss:Type="String">${row[0]}</Data></Cell>
        <Cell ss:StyleID="${numStyle}"><Data ss:Type="Number">${row[1]}</Data></Cell>
      </Row>`;
    });

    xml += `
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// 2. Fungsi Cetak PDF (Pastikan nama fungsi 'exportToPdfPrint' persis seperti ini)
export const exportToPdfPrint = (title: string, tableElementId: string) => {
    const tableEl = document.getElementById(tableElementId);
    if (!tableEl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
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
          <h1>ZURA RETAIL - ${title}</h1>
        </div>
        ${tableEl.outerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 300);
};