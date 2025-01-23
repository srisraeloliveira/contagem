const itemForm = document.getElementById("itemForm");
const inventoryTableBody = document.querySelector("#inventoryTable tbody");
const totalGeralSpan = document.getElementById("totalGeral");
const clearAllButton = document.getElementById("clearAll");
const exportPdfButton = document.getElementById("exportPdf");

let inventoryData = JSON.parse(localStorage.getItem("inventoryData")) || [];

function saveToLocalStorage() {
    localStorage.setItem("inventoryData", JSON.stringify(inventoryData));
}

function renderTable() {
    inventoryTableBody.innerHTML = "";
    let totalGeral = 0;

    inventoryData.forEach((item, index) => {
        const total = item.exposedQty + item.depositQty;
        totalGeral += total;

        const row = document.createElement("tr");

        const status = item.systemQty
            ? total < item.systemQty
                ? `Falta ${item.systemQty - total} unidad(es)`
                : total > item.systemQty
                ? `Sobra ${total - item.systemQty} unidad(es)`
                : "OK"
            : "";

        let statusClass = "";
        if (status.includes("Falta")) {
            statusClass = "message falta";
        } else if (status.includes("Sobra")) {
            statusClass = "message sobra";
        } else {
            statusClass = "message ok";
        }

        row.innerHTML = `
            <td><input type="text" value="${item.name}" onchange="updateField(${index}, 'name', this.value)" /></td>
            <td><input type="number" value="${item.exposedQty}" onchange="updateField(${index}, 'exposedQty', this.value)" /></td>
            <td><input type="number" value="${item.depositQty}" onchange="updateField(${index}, 'depositQty', this.value)" /></td>
            <td>${total}</td>
            <td>
                <input type="number" value="${item.systemQty || ''}" onchange="updateField(${index}, 'systemQty', this.value)" />
            </td>
            <td class="${statusClass}">
                ${status}
            </td>
            <td>
                <button onclick="deleteItem(${index})">Eliminar</button>
            </td>
        `;

        inventoryTableBody.appendChild(row);
    });

    totalGeralSpan.textContent = totalGeral;
}

function deleteItem(index) {
    inventoryData.splice(index, 1);
    saveToLocalStorage();
    renderTable();
}

function updateField(index, field, value) {
    inventoryData[index][field] = field === 'name' ? value : parseInt(value) || 0;
    saveToLocalStorage();
    renderTable();
}

itemForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("itemName").value;
    const exposedQty = parseInt(document.getElementById("exposedQty").value);
    const depositQty = parseInt(document.getElementById("depositQty").value);

    inventoryData.push({ name, exposedQty, depositQty });
    saveToLocalStorage();
    renderTable();

    itemForm.reset();
});

clearAllButton.addEventListener("click", () => {
    inventoryData = [];
    saveToLocalStorage();
    renderTable();
});

exportPdfButton.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({ orientation: 'landscape' }); // Modo paisaje
    const date = new Date().toLocaleDateString();

    // Definindo os cabeçalhos das colunas
    const headers = ["PRODUCTO", "EXHIBIDO", "DEPÓSITO", "TOTAL", "SISTEMA", "ESTADO"];
    const rowHeight = 10; // Altura constante das linhas
    const marginBottom = 10; // Margem inferior
    const pageHeight = doc.internal.pageSize.height; // Altura da página

    // Definir a largura da coluna "PRODUCTO" de forma flexível
    const columnWidths = [];
    let maxLengthProduct = 0;

    // Calcular o comprimento máximo da primeira coluna
    inventoryData.forEach(item => {
        maxLengthProduct = Math.max(maxLengthProduct, item.name.length);
    });

    // Ajustar a largura da primeira coluna com base no comprimento do texto
    const firstColumnWidth = maxLengthProduct * 1.5; // Fator de ajuste da largura
    columnWidths.push(firstColumnWidth); // A largura da primeira coluna será flexível

    // Definir larguras fixas para as outras colunas
    const fixedColumnWidths = [30, 30, 30, 30, 50];
    columnWidths.push(...fixedColumnWidths);

    // Calculando a largura total da tabela
    const totalWidth = columnWidths.reduce((acc, width) => acc + width, 0);
    const tableStartX = (doc.internal.pageSize.width - totalWidth) / 2; // Centralizando a tabela

    let y = 20; // Posição inicial para a tabela
    const tableHeight = pageHeight - 40; // Definindo a altura máxima da tabela (evitando que ultrapasse a página)

    // Adicionando os cabeçalhos das colunas
    doc.setFont("helvetica", "bold");
    let startX = tableStartX;
    headers.forEach((header, i) => {
        doc.text(header, startX + columnWidths[i] / 2, y, null, null, "center");
        startX += columnWidths[i];
    });

    y += 15; // Espaço entre o cabeçalho e as linhas de dados

    // Adicionando os dados da tabela
    doc.setFont("helvetica", "normal");

    inventoryData.forEach((item, index) => {
        const total = item.exposedQty + item.depositQty;
        const status = item.systemQty
            ? total < item.systemQty
                ? `Falta ${item.systemQty - total} unidade(s)`
                : total > item.systemQty
                ? `Sobra ${total - item.systemQty} unidade(s)`
                : "OK"
            : "";

        startX = tableStartX; // Reiniciar a posição X para as colunas

        // Verificar se a próxima linha ultrapassaria o limite da tabela
        if (y + rowHeight > tableHeight - marginBottom) {
            doc.addPage(); // Adiciona uma nova página
            y = 20; // Reiniciar a posição Y após a nova página

            // Adiciona os cabeçalhos novamente na nova página
            doc.setFont("helvetica", "bold");
            startX = tableStartX;
            headers.forEach((header, i) => {
                doc.text(header, startX + columnWidths[i] / 2, y, null, null, "center");
                startX += columnWidths[i];
            });
            y += 15; // Espaço entre o cabeçalho e as linhas de dados
        }

        // Adicionando os valores das colunas
        doc.text(item.name, startX + columnWidths[0] / 2, y, null, null, "center");
        startX += columnWidths[0];

        doc.text(String(item.exposedQty), startX + columnWidths[1] / 2, y, null, null, "center");
        startX += columnWidths[1];

        doc.text(String(item.depositQty), startX + columnWidths[2] / 2, y, null, null, "center");
        startX += columnWidths[2];

        doc.text(String(total), startX + columnWidths[3] / 2, y, null, null, "center");
        startX += columnWidths[3];

        doc.text(String(item.systemQty || ""), startX + columnWidths[4] / 2, y, null, null, "center");
        startX += columnWidths[4];

        doc.text(status, startX + columnWidths[5] / 2, y, null, null, "center");
        y += rowHeight; // Manter a altura constante entre as linhas
    });

    // Ajuste para garantir que a última linha seja impressa corretamente
    y = Math.round(y / rowHeight) * rowHeight;

    // Salvar o PDF com o nome formatado
    doc.save(`Stock_${date.replace(/\//g, "-")}.pdf`);
});


document.addEventListener("DOMContentLoaded", renderTable);
