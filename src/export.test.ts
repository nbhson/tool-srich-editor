import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportToDocx } from './export';
import type { DocxModule } from './export';

/**
 * Fake docx module: records every Paragraph's options so we can assert
 * list nesting levels without the real docx library.
 */
interface CapturedParagraph {
  children: unknown[];
  bullet?: { level: number };
  heading?: unknown;
  alignment?: unknown;
}

function createFakeDocx() {
  const paragraphs: CapturedParagraph[] = [];
  const dx: DocxModule = {
    Document: class {
      options: unknown;
      constructor(options: unknown) {
        this.options = options;
      }
    },
    Packer: {
      toBlob: vi.fn(async () => new Blob(['fake-docx'])),
    },
    Paragraph: class {
      options: CapturedParagraph;
      constructor(options: CapturedParagraph) {
        this.options = options;
        paragraphs.push(options);
      }
    } as unknown as DocxModule['Paragraph'],
    TextRun: class {
      options: Record<string, unknown>;
      constructor(options: Record<string, unknown> | string) {
        this.options = typeof options === 'string' ? { text: options } : options;
      }
    } as unknown as DocxModule['TextRun'],
    HeadingLevel: {
      HEADING_1: 'Heading1',
      HEADING_2: 'Heading2',
      HEADING_3: 'Heading3',
    },
    AlignmentType: {
      CENTER: 'center',
      RIGHT: 'right',
      JUSTIFIED: 'both',
    },
    BorderStyle: {
      SINGLE: 'single',
    },
  };
  return { dx, paragraphs };
}

describe('exportToDocx', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
    delete (window as any).docx;
    vi.restoreAllMocks();
  });

  function stubDownload(): void {
    (URL as any).createObjectURL = vi.fn(() => 'blob:fake');
    (URL as any).revokeObjectURL = vi.fn();
  }

  function textOf(p: CapturedParagraph): string {
    return (p.children as Array<{ options?: { text?: string } }>)
      .map((r) => r?.options?.text ?? '')
      .join('');
  }

  it('throws a helpful error when the docx library is missing', async () => {
    delete (window as any).docx;
    await expect(exportToDocx(host)).rejects.toThrow(/requires the "docx" library/);
  });

  it('converts a flat list with bullet level 0', async () => {
    const { dx, paragraphs } = createFakeDocx();
    (window as any).docx = dx;
    stubDownload();
    host.innerHTML = '<ul><li>Alpha</li><li>Beta</li></ul>';

    await exportToDocx(host);

    expect(paragraphs.map(textOf)).toEqual(['Alpha', 'Beta']);
    expect(paragraphs.map((p) => p.bullet?.level)).toEqual([0, 0]);
  });

  it('assigns increasing bullet levels for nested lists', async () => {
    const { dx, paragraphs } = createFakeDocx();
    (window as any).docx = dx;
    stubDownload();
    host.innerHTML = '<ul><li>Level 0<ul><li>Level 1<ul><li>Level 2</li></ul></li></ul></li><li>Back to 0</li></ul>';

    await exportToDocx(host);

    expect(paragraphs.map(textOf)).toEqual(['Level 0', 'Level 1', 'Level 2', 'Back to 0']);
    expect(paragraphs.map((p) => p.bullet?.level)).toEqual([0, 1, 2, 0]);
  });

  it('handles nested ordered lists the same way', async () => {
    const { dx, paragraphs } = createFakeDocx();
    (window as any).docx = dx;
    stubDownload();
    host.innerHTML = `
      <ol>
        <li>First
          <ol><li>First child</li></ol>
        </li>
      </ol>`;

    await exportToDocx(host);

    expect(paragraphs.map((p) => p.bullet?.level)).toEqual([0, 1]);
  });

  it('clamps bullet level at the docx maximum (8)', async () => {
    const { dx, paragraphs } = createFakeDocx();
    (window as any).docx = dx;
    stubDownload();
    // 12 levels deep → level must be clamped to 8
    let html = '<li>deepest</li>';
    for (let i = 0; i < 11; i++) html = `<li>x<ul>${html}</ul></li>`;
    host.innerHTML = `<ul>${html}</ul>`;

    await exportToDocx(host);

    const levels = paragraphs.map((p) => p.bullet?.level ?? -1);
    expect(Math.max(...levels)).toBeLessThanOrEqual(8);
    expect(levels[levels.length - 1]).toBe(8);
  });

  it('keeps list item text runs and inline formatting', async () => {
    const { dx, paragraphs } = createFakeDocx();
    (window as any).docx = dx;
    stubDownload();
    host.innerHTML = '<ul><li>plain <b>bold</b></li></ul>';

    await exportToDocx(host);

    expect(paragraphs.length).toBe(1);
    expect(textOf(paragraphs[0])).toBe('plain bold');
    expect(paragraphs[0].bullet?.level).toBe(0);
  });
});
