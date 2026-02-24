export function printBill(order, settings) {
  const { cafeName, address, phone, gstEnabled, gstRate, paperWidth, tagline } = settings;
  const w = paperWidth === '80mm' ? 320 : 216;
  const fc = (n) => `₹${Number(n).toFixed(2)}`;
  const fDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const rows = order.items.map((item) => {
    const name = item.name.length > 16 ? item.name.slice(0, 15) + '.' : item.name;
    return `<tr>
      <td>${item.emoji || ''} ${name}</td>
      <td style="text-align:center">x${item.qty}</td>
      <td style="text-align:right">${fc(item.price * item.qty)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Bill - ${cafeName}</title>
<style>
  @media print {
    @page { margin: 0; size: ${paperWidth} auto; }
    body { margin: 3mm; }
  }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: ${paperWidth === '80mm' ? '12px' : '10px'};
    width: ${w}px;
    margin: 0 auto;
    color: #000;
    background: #fff;
  }
  .c { text-align: center; }
  .b { font-weight: bold; }
  hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 2px 3px; vertical-align: top; }
  .tr td { font-weight: bold; font-size: 1.15em; padding-top: 6px; }
  h2 { font-size: ${paperWidth === '80mm' ? '16px' : '13px'}; letter-spacing: 3px; margin: 2px 0; }
  p { margin: 1px 0; font-size: 0.9em; }
</style>
</head><body>
<div class="c">
  <h2>${cafeName}</h2>
  <p>${address}</p>
  <p>📞 ${phone}</p>
</div>
<hr/>
<p class="b">Bill #: ${order.billNo || order._id?.slice(-8).toUpperCase()}</p>
<p>Date: ${fDate(order.createdAt)} | Time: ${fTime(order.createdAt)}</p>
<hr/>
<table>
  <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Amt</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<hr/>
<table>
  <tr><td>Subtotal</td><td style="text-align:right">${fc(order.subtotal)}</td></tr>
  ${order.gstEnabled ? `<tr><td>GST (${order.gstRate}%)</td><td style="text-align:right">${fc(order.gst)}</td></tr>` : ''}
  <tr class="tr"><td>*** TOTAL ***</td><td style="text-align:right">${fc(order.total)}</td></tr>
</table>
<hr/>
<div class="c">
  <p class="b" style="margin-top:6px">Thank you! Visit again 😊</p>
  ${tagline ? `<p style="margin-top:3px;font-size:0.8em">${tagline}</p>` : ''}
</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1000);}<\/script>
</body></html>`;

  const win = window.open('', '_blank', `width=${w + 50},height=650,toolbar=0`);
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    alert('Please allow popups to print the bill.');
  }
}
