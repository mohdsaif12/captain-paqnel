/**
 * printKOT — Kitchen Order Ticket auto-print utility
 *
 * Opens a new browser window with a formatted KOT and immediately triggers
 * the browser's print dialog. The window closes automatically after printing.
 *
 * @param {Object} params
 * @param {string}  params.tableId     - Human-readable table number (e.g. "T-01")
 * @param {string}  params.sessionId   - Session / order reference
 * @param {Array}   params.items       - Array of { name, qty, price, notes? }
 * @param {string}  [params.guestName] - Guest / customer name (optional)
 * @param {string}  [params.section]   - Restaurant section (optional)
 * @param {number}  [params.kotNumber] - Sequential KOT number (optional)
 * @param {string}  [params.orderNote] - Order-level notes (optional)
 */
export function printKOT(params) {
  const { tableId, sessionId, items = [], guestName, section, kotNumber, orderNote = '' } = params;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const kotRef = kotNumber
    ? `KOT-${String(kotNumber).padStart(4, '0')}`
    : `KOT-${Date.now().toString().slice(-6)}`;

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td class="qty">${item.qty}</td>
          <td class="name">
            ${item.name}
            ${item.notes || item.note ? `<div class="note">${item.notes || item.note}</div>` : ''}
          </td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>KOT – ${tableId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Courier Prime', 'Courier New', monospace;
      font-size: 13px;
      background: #fff;
      color: #111;
      width: 80mm;
      padding: 4mm 4mm 8mm;
    }

    .restaurant-name {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      border-bottom: 2px dashed #111;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }

    .kot-title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 4px;
      margin: 4px 0 8px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 8px;
      margin-bottom: 8px;
      font-size: 12px;
    }

    .meta-grid .label { color: #555; }
    .meta-grid .value { font-weight: 700; text-align: right; }

    .divider {
      border: none;
      border-top: 1px dashed #111;
      margin: 6px 0;
    }

    .section-heading {
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #333;
      margin-bottom: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #555;
      padding-bottom: 4px;
      border-bottom: 1px solid #ccc;
    }

    thead th.qty { width: 28px; }

    tbody tr td {
      padding: 5px 0 3px;
      border-bottom: 1px dotted #ddd;
      vertical-align: top;
    }

    td.qty {
      font-weight: 700;
      font-size: 14px;
      width: 28px;
    }

    td.name {
      font-weight: 700;
      font-size: 13px;
      line-height: 1.3;
    }

    td.name .note {
      font-weight: 400;
      font-size: 11px;
      color: #555;
      font-style: italic;
      margin-top: 1px;
    }

    .footer {
      margin-top: 10px;
      text-align: center;
      font-size: 10px;
      color: #777;
      letter-spacing: 1px;
    }

    @media print {
      body { width: 80mm; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="restaurant-name">The Golden Saffron</div>
  <div class="kot-title">★ K O T ★</div>

  <div class="meta-grid">
    <span class="label">Ref#</span>
    <span class="value">${kotRef}</span>

    <span class="label">Table</span>
    <span class="value">${tableId}</span>

    ${guestName ? `<span class="label">Guest</span><span class="value">${guestName}</span>` : ''}
    ${section ? `<span class="label">Section</span><span class="value">${section}</span>` : ''}

    <span class="label">Date</span>
    <span class="value">${dateStr}</span>

    <span class="label">Time</span>
    <span class="value">${timeStr}</span>
  </div>

  <hr class="divider" />
  <div class="section-heading">Order Items</div>

  <table>
    <thead>
      <tr>
        <th class="qty">Qty</th>
        <th>Item</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <hr class="divider" />
  ${orderNote ? `<div class="section-heading">Remarks</div>
  <p class="footer">${orderNote}</p>
  <hr class="divider" />` : ''}
  <div class="footer">** KITCHEN COPY – NOT A BILL **</div>
  <div class="footer">Session: ${sessionId || '—'}</div>
</body>
</html>`;

  // Open print window
  const win = window.open('', '_blank', 'width=380,height=600,scrollbars=no,menubar=no,toolbar=no');
  if (!win) {
    console.warn('printKOT: Pop-up blocked. Please allow pop-ups for this site.');
    return;
  }
  win.document.write(html);
  win.document.close();

  // Give fonts / layout time to render, then print
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
      win.close();
    }, 400);
  };
}
