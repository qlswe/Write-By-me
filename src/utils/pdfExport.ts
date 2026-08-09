import { jsPDF } from 'jspdf';
import { printHtmlReport } from './printReport';

export interface PDFExportOptions {
  title: string;
  category?: string;
  author?: string;
  createdAt?: string;
  summary?: string;
  contentHtml: string;
  mediaUrl?: string;
  sectionName?: string;
  lang?: string;
}

/**
 * Strips HTML tags for clean plain-text fallback
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Formats date for PDF header
 */
function formatDate(dateStr?: string, lang: string = 'ru'): string {
  if (!dateStr) {
    return new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Primary Export Method: Uses a beautiful, high-contrast, PDF-optimized layout
 * with `@page` print rules. Triggers native browser PDF saving ("Сохранить как PDF")
 * with full Cyrillic unicode support, crisp text rendering, and multi-page pagination.
 */
export function exportContentToPDF(options: PDFExportOptions): void {
  const {
    title,
    category = 'General',
    author = 'AHA Platform',
    createdAt,
    summary,
    contentHtml,
    mediaUrl,
    sectionName = 'Аналитика и Посты',
    lang = 'ru'
  } = options;

  const dateFormatted = formatDate(createdAt, lang);

  const pdfHtml = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.6;">
      
      <!-- Top Brand Header -->
      <div style="border-bottom: 3px solid #ff4d4d; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <span style="background-color: #ff4d4d; color: #ffffff; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px;">
            ${sectionName.toUpperCase()}
          </span>
          <span style="color: #64748b; font-size: 11px; margin-left: 10px; font-weight: 600;">
            ${category.toUpperCase()}
          </span>
        </div>
        <div style="text-align: right; color: #64748b; font-size: 11px;">
          <strong style="color: #0f172a;">AHA Platform Document</strong> | ${dateFormatted}
        </div>
      </div>

      <!-- Main Title -->
      <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 0 0 16px 0; line-height: 1.25; letter-spacing: -0.5px;">
        ${title}
      </h1>

      <!-- Metadata Bar -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; display: flex; gap: 20px; font-size: 12px; color: #475569;">
        <div><strong>Автор:</strong> ${author}</div>
        <div><strong>Дата:</strong> ${dateFormatted}</div>
        <div><strong>Категория:</strong> ${category}</div>
      </div>

      <!-- Optional Summary Callout -->
      ${summary ? `
        <div style="background-color: #f1f5f9; border-left: 4px solid #ff4d4d; padding: 14px 18px; margin-bottom: 24px; border-radius: 0 12px 12px 0; font-style: italic; color: #334155; font-size: 14px;">
          <strong>Краткое содержание:</strong> ${summary}
        </div>
      ` : ''}

      <!-- Optional Hero Media Image -->
      ${mediaUrl && !mediaUrl.endsWith('.mp4') && !mediaUrl.endsWith('.webm') ? `
        <div style="margin-bottom: 24px; text-align: center;">
          <img src="${mediaUrl}" alt="${title}" style="max-width: 100%; max-height: 400px; border-radius: 12px; object-fit: cover; border: 1px solid #e2e8f0;" />
        </div>
      ` : ''}

      <!-- Main Body Content -->
      <div style="font-size: 14px; color: #1e293b; text-align: justify; line-height: 1.7;" class="pdf-content-body">
        ${contentHtml}
      </div>

      <!-- Footer Document Stamp -->
      <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>Сформировано платформой AHA | Экспорт в PDF</span>
        <span>Страница сохранена из приложения AHA App</span>
      </div>

    </div>
  `;

  printHtmlReport(pdfHtml, `${title} - AHA Export`);
}

/**
 * Backup Direct Download with jsPDF (Clean ASCII/Standard text generator)
 */
export function downloadDirectPDF(options: PDFExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const plainText = stripHtml(options.contentHtml);
  
  doc.setFillColor(37, 28, 53);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setTextColor(255, 77, 77);
  doc.setFontSize(18);
  doc.text('AHA PLATFORM EXPORT', 15, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(options.title, 180);
  doc.text(titleLines, 15, 30);

  doc.setTextColor(180, 180, 200);
  doc.setFontSize(10);
  let y = 30 + titleLines.length * 7 + 5;
  
  if (options.summary) {
    const summaryLines = doc.splitTextToSize(`Summary: ${options.summary}`, 180);
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 5 + 8;
  }

  doc.setTextColor(220, 220, 240);
  doc.setFontSize(9);
  const bodyLines = doc.splitTextToSize(plainText, 180);
  
  for (let i = 0; i < bodyLines.length; i++) {
    if (y > 280) {
      doc.addPage();
      doc.setFillColor(37, 28, 53);
      doc.rect(0, 0, 210, 297, 'F');
      y = 20;
    }
    doc.text(bodyLines[i], 15, y);
    y += 5;
  }

  const cleanFilename = options.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  doc.save(`${cleanFilename || 'aha_export'}.pdf`);
}
