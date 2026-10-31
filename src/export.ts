/**
 * Export module for SRich Editor
 * Provides functionality to export editor content to PDF and Word (.docx) formats.
 * Uses html2pdf.js for PDF export (loaded lazily) and docx library for Word export.
 */

// ─── Lazy html2pdf resolver ──────────────────────────────────────────
// The `html2pdf.js` library is an optional external dependency.
// • UMD / CDN: user loads <script src="...html2pdf.bundle.min.js"> → window.html2pdf
// • Bundler (Vite/Webpack): resolved via dynamic import (kept out of the
//   critical path so the editor core stays dependency-free).
async function getHtml2pdf(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).html2pdf) {
    return (window as any).html2pdf;
  }
  try {
    const mod = await import('html2pdf.js');
    return (mod as any).default ?? mod;
  } catch {
    throw new Error(
      'PDF export requires the "html2pdf.js" library.\n' +
      'Load it via CDN before the editor:\n' +
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js"></script>\n' +
      'Or install via npm: npm install html2pdf.js',
    );
  }
}

// ─── Lazy docx resolver ──────────────────────────────────────────────
// The `docx` library is an optional external dependency.
// • UMD / CDN: user loads <script src="...docx...umd.js"> before the editor → window.docx
// • Bundler (Vite/Webpack): the module resolution provides the import directly.
// We therefore read from `window.docx` first (always available in browser),
// and fall back to a clear error when the library is missing.

interface DocxModule {
  Document: any;
  Packer: any;
  Paragraph: any;
  TextRun: any;
  HeadingLevel: any;
  AlignmentType: any;
  BorderStyle: any;
}

function getDocx(): DocxModule {
  // Browser global from CDN / UMD
  if (typeof window !== 'undefined' && (window as any).docx) {
    return (window as any).docx as DocxModule;
  }
  throw new Error(
    'Word export requires the "docx" library.\n' +
    'Load it via CDN before the editor:\n' +
    '<script src="https://unpkg.com/docx@9/build/index.umd.js"></script>\n' +
    'Or install via npm: npm install docx',
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Options for the export module */
export interface ExportOptions {
  /** Document title for the exported file */
  documentTitle?: string;
  /** Callback before export starts */
  onBeforeExport?: (format: 'pdf' | 'docx') => void;
  /** Callback after export completes */
  onAfterExport?: (format: 'pdf' | 'docx') => void;
}

/** Locale strings for export UI */
export interface ExportLocale {
  exportPDF?: string;
  exportWord?: string;
  exportAs?: string;
}

/**
 * Convert an HTML element to a printable/print-friendly format.
 * Strips editor-specific elements and normalizes styling.
 */
function prepareContentForExport(contentArea: HTMLElement): string {
  // Clone to avoid modifying the original
  const clone = contentArea.cloneNode(true) as HTMLElement;

  // Remove comment highlights
  clone.querySelectorAll('.re-comment-highlight').forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      parent.normalize();
    }
  });

  return clone.innerHTML;
}

/** Escape HTML attribute value */
function escapeHtmlAttr(text: string): string {
  const e = { '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' };
  return text.replace(/[&"<>]/g, (c) => e[c as keyof typeof e]);
}

/** Trigger a file download */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/** Sanitize filename */
function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'document';
}

// ─────────── PDF Export (using html2pdf.js) ──────────────────────────

/**
 * Export the editor content as PDF using html2pdf.js library.
 */
export async function exportToPDF(
  contentArea: HTMLElement,
  options?: ExportOptions,
): Promise<void> {
  const title = options?.documentTitle || 'Document';
  const content = prepareContentForExport(contentArea);

  options?.onBeforeExport?.('pdf');

  const container = document.createElement('div');
  container.innerHTML = content;
  container.style.padding = '20px';
  container.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  document.body.appendChild(container);

  const opt = {
    margin: 10,
    filename: `${sanitizeFilename(title)}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: {
      unit: 'mm',
      format: 'a4' as const,
      orientation: 'portrait' as const,
    },
  };

  try {
    const html2pdf = await getHtml2pdf();
    await html2pdf()
      .set(opt)
      .from(container)
      .save();
    options?.onAfterExport?.('pdf');
  } catch (err: any) {
    console.error('PDF export failed:', err);
  } finally {
    if (container.parentNode) container.parentNode.removeChild(container);
  }
}

// ─────────── Word (.doc) Export (HTML-based fallback) ────────────────

/**
 * Export the editor content as a Word (.doc) file using HTML-based approach.
 * Word can open HTML files directly, so this is the simplest method.
 */
export function exportToWord(
  contentArea: HTMLElement,
  options?: ExportOptions,
): void {
  const title = options?.documentTitle || 'Document';
  const content = prepareContentForExport(contentArea);

  options?.onBeforeExport?.('docx');

  const wordHTML = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtmlAttr(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    h1 { font-size: 24pt; font-weight: bold; margin: 12pt 0 6pt; }
    h2 { font-size: 18pt; font-weight: bold; margin: 10pt 0 5pt; }
    h3 { font-size: 14pt; font-weight: bold; margin: 8pt 0 4pt; }
    p { margin: 6pt 0; }
    blockquote { margin: 6pt 0 6pt 24pt; padding: 4pt 12pt; border-left: 3pt solid #3b82f6; color: #555; font-style: italic; }
    pre { font-family: 'Courier New', monospace; font-size: 9pt; background: #f5f5f5; padding: 8pt; border-radius: 4pt; white-space: pre-wrap; }
    code { font-family: 'Courier New', monospace; font-size: 9.5pt; background: #f0f0f0; padding: 1pt 3pt; }
    a { color: #3b82f6; }
    table { border-collapse: collapse; width: 100%; margin: 6pt 0; }
    td, th { border: 1pt solid #ccc; padding: 4pt 8pt; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    img { max-width: 100%; }
    hr { border: none; border-top: 1pt solid #ccc; margin: 12pt 0; }
  </style>
</head>
<body>
${content}
</body>
</html>`;

  const blob = new Blob([wordHTML], { type: 'application/msword' });
  downloadFile(blob, `${sanitizeFilename(title)}.doc`);
  options?.onAfterExport?.('docx');
}

// ─────────── Word (.docx) Export (using docx library) ────────────────

/**
 * Convert inline HTML nodes to docx TextRun[].
 */
function nodeToRuns(
  node: Node,
  dx: DocxModule,
  parentOpts?: Record<string, any>,
): any[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text.trim()) {
      const opts: Record<string, any> = { text, ...parentOpts };
      return [new dx.TextRun(opts)];
    }
    return [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = node as HTMLElement;
  const tag = el.tagName.toUpperCase();

  // Skip block-level elements at inline level
  if (
    ['P', 'DIV', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE'].includes(tag)
  ) {
    return [];
  }

  const opts: Record<string, any> = { ...(parentOpts || {}) };

  switch (tag) {
    case 'B':
    case 'STRONG':
      opts.bold = true;
      break;
    case 'I':
    case 'EM':
      opts.italics = true;
      break;
    case 'U':
      opts.underline = {};
      break;
    case 'S':
    case 'STRIKE':
    case 'DEL':
      opts.strike = true;
      break;
    case 'CODE':
      opts.font = 'Courier New';
      opts.size = 20;
      break;
    case 'A':
      opts.underline = {};
      break;
  }

  // Parse inline styles
  const style = el.getAttribute('style') || '';
  if (style) {
    const colorMatch = style.match(/color:\s*#?([\w]+)/);
    if (colorMatch) opts.color = colorMatch[1];
    const fontSizeMatch = style.match(/font-size:\s*([\d.]+)pt/);
    if (fontSizeMatch) opts.size = Math.round(parseFloat(fontSizeMatch[1]) * 2);
    if (style.includes('font-weight: bold')) opts.bold = true;
    if (style.includes('font-style: italic')) opts.italics = true;
    if (style.includes('text-decoration: underline')) opts.underline = {};
    if (style.includes('text-decoration: line-through')) opts.strike = true;
    const bgColorMatch = style.match(/background-color:\s*#?([\w]+)/);
    if (bgColorMatch) opts.shading = { fill: bgColorMatch[1] };
  }

  const runs: any[] = [];
  for (const child of Array.from(el.childNodes)) {
    runs.push(...nodeToRuns(child, dx, opts));
  }
  return runs;
}

/**
 * Convert HTML content to docx Paragraphs (runtime-resolved).
 */
function htmlToDocxParagraphs(html: string, dx: DocxModule): any[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  const paragraphs: any[] = [];

  function processElement(el: HTMLElement): void {
    const tag = el.tagName.toUpperCase();

    if (['P', 'DIV', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'PRE'].includes(tag)) {
      let headingLevel: any = undefined;
      let alignment: any = undefined;

      switch (tag) {
        case 'H1':
          headingLevel = dx.HeadingLevel.HEADING_1;
          break;
        case 'H2':
          headingLevel = dx.HeadingLevel.HEADING_2;
          break;
        case 'H3':
          headingLevel = dx.HeadingLevel.HEADING_3;
          break;
      }

      const style = el.getAttribute('style') || '';
      const alignMatch = style.match(/text-align:\s*([\w-]+)/);
      if (alignMatch) {
        const align = alignMatch[1].toLowerCase();
        if (align === 'center') alignment = dx.AlignmentType.CENTER;
        else if (align === 'right') alignment = dx.AlignmentType.RIGHT;
        else if (align === 'justify') alignment = dx.AlignmentType.JUSTIFIED;
      }

      const runs: any[] = [];
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || '';
          if (text.trim()) {
            const opts: Record<string, any> = { text };
            if (tag === 'PRE') {
              opts.font = 'Courier New';
              opts.size = 20;
            }
            if (tag === 'BLOCKQUOTE') opts.italics = true;
            runs.push(new dx.TextRun(opts));
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const parentOpts =
            tag === 'PRE'
              ? { font: 'Courier New', size: 20 }
              : tag === 'BLOCKQUOTE'
                ? { italics: true }
                : undefined;
          runs.push(...nodeToRuns(child, dx, parentOpts));
        }
      }

      paragraphs.push(
        new dx.Paragraph({
          children: runs,
          heading: headingLevel,
          alignment: alignment,
        }),
      );
      return;
    }

    if (tag === 'LI') {
      const runs: any[] = [];
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || '';
          if (text.trim()) runs.push(new dx.TextRun(text));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          runs.push(...nodeToRuns(child, dx));
        }
      }
      paragraphs.push(
        new dx.Paragraph({ children: runs, bullet: { level: 0 } }),
      );
      return;
    }

    if (tag === 'BR') return;

    if (tag === 'HR') {
      paragraphs.push(
        new dx.Paragraph({
          children: [new dx.TextRun({ text: '' })],
          border: {
            bottom: {
              style: dx.BorderStyle.SINGLE,
              size: 6,
              color: 'DEE2E6',
            },
          },
        }),
      );
      return;
    }

    if (tag === 'UL' || tag === 'OL') {
      for (const child of Array.from(el.children)) {
        if (child.tagName.toUpperCase() === 'LI')
          processElement(child as HTMLElement);
      }
      return;
    }

    if (tag === 'TABLE') {
      const rows = (el as HTMLTableElement).rows;
      for (let i = 0; i < rows.length; i++) {
        const cells: string[] = [];
        for (let j = 0; j < rows[i].cells.length; j++) {
          cells.push(rows[i].cells[j].textContent || '');
        }
        paragraphs.push(
          new dx.Paragraph({
            children: [new dx.TextRun({ text: cells.join(' | ') })],
          }),
        );
      }
      return;
    }

    // For other elements, recurse
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        processElement(child as HTMLElement);
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (text.trim()) {
          paragraphs.push(
            new dx.Paragraph({ children: [new dx.TextRun(text)] }),
          );
        }
      }
    }
  }

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      processElement(child as HTMLElement);
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text.trim()) {
        paragraphs.push(
          new dx.Paragraph({ children: [new dx.TextRun(text)] }),
        );
      }
    }
  }

  return paragraphs;
}

/**
 * Export the editor content as a .docx file using the docx library.
 * This creates a proper Office Open XML document.
 */
export async function exportToDocx(
  contentArea: HTMLElement,
  options?: ExportOptions,
): Promise<void> {
  const title = options?.documentTitle || 'Document';
  const content = prepareContentForExport(contentArea);

  options?.onBeforeExport?.('docx');

  const dx = getDocx(); // resolve docx at runtime
  const paragraphs = htmlToDocxParagraphs(content, dx);

  const doc = new dx.Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1800,
              bottom: 1440,
              left: 1800,
            },
          },
        },
        children: paragraphs,
      },
    ],
    title: title,
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt in half-points
          },
        },
      },
    },
  });

  try {
    const blob = await dx.Packer.toBlob(doc);
    downloadFile(blob, `${sanitizeFilename(title)}.docx`);
    options?.onAfterExport?.('docx');
  } catch (err) {
    console.error('DOCX export failed:', err);
  }
}