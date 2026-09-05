import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  escapeHtml,
  sanitizeFileName,
  exportToPdfPrint,
  exportToExcel,
} from './exportHelpers';

describe('exportHelpers — sanitasi XSS (Fase 4.13)', () => {
  describe('escapeHtml', () => {
    it('menyandikan karakter berbahaya (stored-XSS vector)', () => {
      const input = `<script>alert('xss')</script>"&'`;
      const out = escapeHtml(input);
      expect(out).not.toContain('<script>');
      expect(out).not.toContain('</script>');
      expect(out).not.toContain("'");
      expect(out).not.toContain('"');
      expect(out).toContain('&lt;script&gt;');
      expect(out).toContain('&quot;');
    });

    it('mengubah semua 5 karakter HTML menjadi entitas', () => {
      const input = '<>&"\'';
      expect(escapeHtml(input)).toBe('&lt;&gt;&amp;&quot;&#39;');
    });

    it('mengembalikan string kosong untuk null/undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('mengonversi angka dan objek menjadi string aman', () => {
      expect(escapeHtml(42)).toBe('42');
      expect(escapeHtml({ a: '<b>' })).toBe('[object Object]');
    });

    it('tidak mengubah teks polos', () => {
      expect(escapeHtml('Laporan Laba Rugi')).toBe('Laporan Laba Rugi');
    });
  });

  describe('sanitizeFileName', () => {
    it('menghilangkan path traversal & karakter path (\\ / : * ? " < > |)', () => {
      const out = sanitizeFileName('..\\..\\etc\\passwd');
      expect(out).not.toContain('/');
      expect(out).not.toContain('\\');
      expect(out).not.toContain(':');
    });

    it('mengganti karakter ilegal dengan "-"', () => {
      expect(sanitizeFileName('a/b:c*d?e"f<g>h|i')).toBe('a-b-c-d-e-f-g-h-i');
    });

    it('tidak pernah mengembalikan string kosong setelah sanitasi', () => {
      expect(sanitizeFileName('   ')).toBe('export');
      expect(sanitizeFileName('')).toBe('export');
    });

    it('mengganti semua karakter ilegal dengan "-"', () => {
      expect(sanitizeFileName('///***???')).toBe('---------');
    });

    it('mengembalikan nama file bersih apa adanya', () => {
      expect(sanitizeFileName('Laporan_Laba_Rugi_Zura')).toBe(
        'Laporan_Laba_Rugi_Zura',
      );
    });
  });

  describe('exportToPdfPrint — tidak mengeksekusi script lewat judul', () => {
    let printDoc: {
      write: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
      body: { appendChild: ReturnType<typeof vi.fn> };
    };
    let printWindow: {
      document: typeof printDoc;
      focus: ReturnType<typeof vi.fn>;
      print: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      printDoc = {
        write: vi.fn(),
        close: vi.fn(),
        body: { appendChild: vi.fn() },
      };
      printWindow = {
        document: printDoc,
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      };
      vi.useFakeTimers();

      vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);
      vi.spyOn(document, 'getElementById').mockReturnValue({
        cloneNode: () => ({ nodeName: 'TABLE' }),
      } as unknown as HTMLElement);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('menulis judul ter-escape (bukan HTML mentah) ke dokumen print', () => {
      exportToPdfPrint(`<img src=x onerror=alert(1)>DATA`, 'table-laba-rugi');

      const html = printDoc.write.mock.calls.map((c) => c[0] as string).join('');
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;DATA');
    });

    it('melakukan print() lalu close() pada window cetak', () => {
      exportToPdfPrint('Laporan', 'table-laba-rugi');

      vi.advanceTimersByTime(300);
      expect(printWindow.focus).toHaveBeenCalled();
      expect(printWindow.print).toHaveBeenCalled();
      expect(printWindow.close).toHaveBeenCalled();
    });

    it('mengkloning node tabel asli (bukan serialisasi string) ke dokumen print', () => {
      exportToPdfPrint('Laporan', 'table-laba-rugi');
      expect(printDoc.body.appendChild).toHaveBeenCalled();
      const appended = printDoc.body.appendChild.mock.calls[0][0];
      expect(appended.nodeName).toBe('TABLE');
    });

    it('tidak melakukan apa-apa jika tabel target tidak ditemukan', () => {
      (document.getElementById as ReturnType<typeof vi.fn>).mockReturnValue(null);
      exportToPdfPrint('Laporan', 'table-tidak-ada');
      expect(printDoc.write).not.toHaveBeenCalled();
    });
  });

  describe('exportToExcel — nama file didownload tersanitasi', () => {
    const originalCreateObjURL = (URL as unknown as Record<string, unknown>)
      .createObjectURL as ((blob: Blob) => string) | undefined;
    const originalRevokeObjURL = (URL as unknown as Record<string, unknown>)
      .revokeObjectURL as ((url: string) => void) | undefined;

    let appendSpy: { mock: { calls: unknown[][] } };

    beforeEach(() => {
      (URL as unknown as Record<string, unknown>).createObjectURL = vi.fn(
        () => 'blob:mock',
      );
      (URL as unknown as Record<string, unknown>).revokeObjectURL = vi.fn();
      appendSpy = vi.spyOn(document.body, 'appendChild');
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        () => undefined,
      );
    });

    afterEach(() => {
      (URL as unknown as Record<string, unknown>).createObjectURL =
        originalCreateObjURL;
      (URL as unknown as Record<string, unknown>).revokeObjectURL =
        originalRevokeObjURL;
      vi.restoreAllMocks();
    });

    const lastDownloadAnchor = (): HTMLAnchorElement | undefined => {
      const anchor = appendSpy.mock.calls
        .map(([node]) => node as Node)
        .find((node) => node instanceof HTMLAnchorElement);
      return anchor as HTMLAnchorElement | undefined;
    };

    it('menghapus karakter path traversal dari nama file download', async () => {
      await exportToExcel(
        '..\\..\\Laporan_Laba_Rugi',
        'Laba Rugi',
        ['Keterangan', 'Nominal'],
        [['Pendapatan', 1000]],
      );

      const anchor = lastDownloadAnchor();
      expect(anchor?.getAttribute('download')).toBe('..-..-Laporan_Laba_Rugi.xlsx');
    });

    it('menghasilkan file .xlsx dan melepas object URL setelahnya', async () => {
      await exportToExcel(
        'Laporan_Laba_Rugi_Zura',
        'Laba Rugi',
        ['Keterangan', 'Nominal'],
        [['Pendapatan', 1000]],
      );

      const anchor = lastDownloadAnchor();
      expect(anchor?.getAttribute('download')).toBe(
        'Laporan_Laba_Rugi_Zura.xlsx',
      );
      expect(anchor?.getAttribute('href')).toBe('blob:mock');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });
  });
});