export function printHtmlReport(htmlContent: string, title: string = 'Report') {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      line-height: 1.4;
      font-size: 11px;
    }
    h1 { font-size: 18px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; }
    h2 { font-size: 13px; margin: 14px 0 6px 0; font-weight: 800; border-bottom: 2px solid #111827; padding-bottom: 4px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 9px; text-transform: uppercase; border-bottom: 2px solid #9ca3af; font-weight: 800; color: #111827; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; word-break: break-word; color: #1f2937; }
    tr:nth-child(even) td { background-color: #f9fafb; }
    .header-box { border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { border: 1px solid #d1d5db; padding: 8px 10px; border-radius: 6px; background: #f9fafb; }
    .kpi-title { font-size: 9px; text-transform: uppercase; color: #4b5563; font-weight: 700; }
    .kpi-val { font-size: 15px; font-weight: 900; color: #111827; margin-top: 2px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .card { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px; background: #ffffff; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #9ca3af; font-size: 9px; color: #6b7280; display: flex; justify-content: space-between; font-family: ui-monospace, monospace; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #e5e7eb; color: #111827; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  // Strategy 1: Create a hidden iframe inside the current document to bypass popup blocks
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(fullHtml);
    doc.close();

    // Give browser time to parse CSS and render DOM before triggering print dialog
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Iframe print error, attempting popup window:", err);
        // Fallback Strategy 2: Popup window if iframe printing is restricted
        const printWin = window.open('', '_blank', 'width=1000,height=800');
        if (printWin) {
          printWin.document.open();
          printWin.document.write(fullHtml);
          printWin.document.close();
          printWin.focus();
          setTimeout(() => {
            printWin.print();
          }, 250);
        }
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 250);
  }
}
