function createPanel(docs) {
  if (document.getElementById("auto-panel")) {
    document.body.removeChild(document.getElementById("auto-panel"))
  }

  const panel = document.createElement("div");
  panel.id = "auto-panel";
  panel.style = `
    position: fixed;
    top: 185px;
    left: 0px;
    width: 1000px;
    max-height: 520px;
    overflow-y: auto;
    background: white;
    z-index: 9999;
    font-family: monospace;
  `

  const header = document.createElement("div");
  header.textContent = "Doctools - Automação de Documentos";
  header.id = "header-id"
  header.style = `
  background: #121212;
  color: #8b8b8b;
  padding: 6px 10px;
  font-weight: bold;
  border-bottom: 1px solid #444;
  position: sticky;
  top: 0;
  text-align: center;
  `;


  const table = document.createElement("table");
  table.style = `
  width: 100%;
  border-collapse: collapse;`;

  table.innerHTML = `
  <thead>
  <tr style="background: #121212; color: #8b8b8b">
    <th style="padding:4px;border-bottom:1px solid #444;">#</th>
    <th style="padding:4px;border-bottom:1px solid #444;">Documento</th>
    <th style="padding:4px;border-bottom:1px solid #444;">Status</th>
  </tr>
  </thead>
  <tbody>
  ${docs.map((d, i) => `
    <tr id="doc-row-${i}">
      <td style="padding:4px;">${i + 1}</td>
      <td style="padding:4px;">${d}</td>
      <td style="padding:4px;color:gray;">Aguardando...</td>
      </tr>
    `).join("")}
    </tbody>
  `;

  panel.appendChild(header);
  panel.appendChild(table);
  document.body.appendChild(panel)
}
export async function startAutomate(dactes, time, prod) {

  createPanel(dactes)

  const localErrors = localStorage.getItem("log");
  const data = localStorage.getItem("data")

  if (localErrors || data) {
    localStorage.removeItem("log");
    localStorage.removeItem("data")
  }

  for (const [index, dacte] of dactes.entries()) {

    const row = document.getElementById(`doc-row-${index}`);
    const statusCell = row.querySelector("td:last-child");

    statusCell.textContent = "Processando...";
    statusCell.style.color = "blue";

    document.getElementById("1").value = dacte
    document.getElementById("2").click()

    await new Promise(resolve => setTimeout(resolve, time))

    const errorLabel = document.getElementById("errormsglabel");
    if (errorLabel && errorLabel.innerText.trim() !== "") {
      const errorMsg = errorLabel.textContent;
      const errorlog = JSON.parse(localStorage.getItem("log") || "[]");

      errorlog.push({ dacte, errorMsg });
      localStorage.setItem("log", JSON.stringify(errorlog));

      document.getElementById("0").click();

      statusCell.textContent = `🔴 ${errorMsg}`
      statusCell.style.color = "#e74c3c"
      await new Promise(resolve => setTimeout(resolve, time))
    } else {
      statusCell.textContent = "🟢 Faturado"
      statusCell.style.color = "#2ecc71"
    }

    if (index === dactes.length - 1) {
      const fatura = document.querySelector("#nro_fatura")?.value || "0";
      const valor = document.querySelector("#vlr")?.value || "0";
      const data = { fatura, valor_faturado: valor }

      const logsRaw = localStorage.getItem("log")
      const payload = { data, logsRaw }

      localStorage.setItem("data", JSON.stringify(data))
      alert("Automação encerrada. Clique em OK para realizar a impressão do relatório.")
      await generatePDF(logsRaw, data)

      const token = encodeURIComponent(JSON.stringify(payload))

      const link = document.createElement("a")
      link.href = `${prod ? "https://doctools-io.vercel.app/" : "http://localhost:5173/"}/barcode/decode-report/${token}`
      link.target = "_blank"
      link.textContent = "Caso não tenha gerado o relatório automaticamente, clique aqui."

      document.getElementById("header-id").appendChild(link)


    }
  }
}
async function generatePDF(errorsLog, data) {

  const log = Array.isArray(errorsLog) ? errorsLog : JSON.parse(errorsLog || "[]");
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DocTools - Relatório de Automação</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --color-background: #ffffff;
      --color-surface: #f8f9fa;
      --color-text-primary: #121212;
      --color-text-secondary: #575757;
      --color-border: #e0e0e0;
      --color-primary: #16b4f8;
      --color-info: #4077d1;
      --color-success: #47d5a6;
      --color-danger: #d94a4a;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--color-surface);
      color: var(--color-text-primary);
      line-height: 1.6;
      padding: 20px;
    }

    /* Impressão */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
      }
    }

    .page {
      max-width: 297mm;
      min-height: 210mm;
      margin: 0 auto;
      background-color: var(--color-background);
      padding: 40px 50px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      page-break-after: always;
    }

    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }

    .header {
      border-bottom: 3px solid var(--color-primary);
      padding-bottom: 20px;
      margin-bottom: 40px;
    }

    .header h1 { font-size: 32px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: var(--color-text-secondary); }

    .info-box {
      padding: 5px 10px;
      border-radius: 8px;
      margin-bottom: 16px;
      border-left: 4px solid;
    }
    .info-box h3 { font-size: 16px; font-weight: 600; }
    .info-box p { font-size: 12px; margin-bottom: 0; }
    .info-box.info { background-color: rgba(64, 119, 209, 0.08); border-left-color: var(--color-info); }
    .info-box.success { background-color: rgba(71, 213, 166, 0.08); border-left-color: var(--color-success); }
    .info-box.danger { background-color: rgba(217, 74, 74, 0.08); border-left-color: var(--color-danger); }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 14px;
      page-break-inside: auto;
    }
    .table thead { background-color: var(--color-surface); }
    .table th, .table td { padding: 12px; border-bottom: 1px solid var(--color-border); text-align: left; }
    .table tbody tr:hover { background-color: var(--color-surface); }

    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge.error { background-color: #eb9e9e; color: #9c2121; }
    .badge.success { background-color: #9ae8ce; color: #22946e; }

    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--color-text-secondary);
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      <h1>DocTools - Relatório de Automação</h1>
      <p class="subtitle">Relatório gerado em ${new Date().toLocaleString('pt-BR', {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
  })}</p>
    </header>

    <section class="section">
      <h2>Resumo</h2>
      <div class="info-box info">
        <h3>Fatura</h3>
        <p>${data.fatura || "Não informada"}</p>
      </div>
      
      <div class="info-box success">
        <h3>Valor Faturado</h3>
        <p>${Number(data.valor_faturado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      </div>
      
      <div class="info-box danger">
        <h3>Total de Documentos não Faturados</h3>
        <p>${log.length} documento(s)</p>
      </div>
    </section>

    <section class="section">
      <h2>Documentos Processados</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Status</th>
            <th>Mensagem</th>
          </tr>
        </thead>
        <tbody>
          ${log.map(item => {
    const documento = item.dacte;
    const message = item.errorMsg;
    return `
              <tr>
                <td>${documento}</td>
                <td><span class="badge error">Erro</span></td>
                <td>${message}</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </section>

    <footer class="footer">
      <div>© 2025 DocTools - Sistema de Automação de Documentos</div>
      <div>Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
    </footer>
  </div>
</body>
</html>
  `

  const printWindow = window.open('', '_blank', 'width=900, height=700');

  if (!printWindow) {
    alert("Não foi possível abrir a janela de impressão. Copie o token de resultados e cole no site para gerar o relatório manualmente.")
    return
  }
  printWindow.document.open();
  printWindow.document.writeln(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  }
}