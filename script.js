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
            <td>${item.name}</td>
            <td>${item.exposedQty}</td>
            <td>${item.depositQty}</td>
            <td>${total}</td>
            <td>
                <input type="number" value="${item.systemQty || ''}" onchange="updateSystemQty(${index}, this.value)" />
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

function updateSystemQty(index, value) {
    inventoryData[index].systemQty = parseInt(value) || "";
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

    const doc = new jsPDF({ orientation: 'landscape' }); // Modo paisagem
    const date = new Date().toLocaleDateString();

    // Título "STOCK" centrado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const title = "STOCK";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (doc.internal.pageSize.width - titleWidth) / 2, 20); // Título centrado

    // Fecha centrada
    doc.setFontSize(12);
    const dateText = `Fecha: ${date}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (doc.internal.pageSize.width - dateWidth) / 2, 30); // Fecha centrada

    // "KIOSCO 365" centrado
    doc.setFontSize(14);
    const kioscoText = "KIOSCO 365";
    const kioscoWidth = doc.getTextWidth(kioscoText);
    doc.text(kioscoText, (doc.internal.pageSize.width - kioscoWidth) / 2, 40); // KIOSCO 365 centrado

    // Definiendo os encabezados de las columnas
    const headers = ["PRODUCTO", "EXHIBIDO", "DEPÓSITO", "TOTAL", "SISTEMA", "ESTADO"];
    const columnWidths = [40, 30, 30, 30, 30, 50]; // Ancho de las columnas

    // Calculando o total da largura das colunas
    const totalWidth = columnWidths.reduce((acc, width) => acc + width, 0);
    const tableStartX = (doc.internal.pageSize.width - totalWidth) / 2; // Centralizar a tabela

    let y = 50; // Posição inicial para a tabela (depois do título)

    // Desenhando o cabeçalho da tabela em uma linha
    doc.setFont("helvetica", "bold");
    let startX = tableStartX;
    headers.forEach((header, i) => {
        doc.text(header, startX + columnWidths[i] / 2, y, null, null, "center");
        startX += columnWidths[i];
    });

    y += 15; // Aumentando o espaço entre o cabeçalho e a tabela (agora 15)

    // Agregando os dados da tabela
    doc.setFont("helvetica", "normal");
    const rowHeight = 10; // Altura constante das linhas

    inventoryData.forEach((item, index) => {
        const total = item.exposedQty + item.depositQty;
        const status = item.systemQty
            ? total < item.systemQty
                ? `Falta ${item.systemQty - total} unidade(s)`
                : total > item.systemQty
                ? `Sobra ${total - item.systemQty} unidade(s)`
                : "OK"
            : "";

        startX = tableStartX; // Reinicia a posição X para as colunas

        // Verificando se a linha ultrapassa o limite da página
        if (y + rowHeight > doc.internal.pageSize.height) {
            doc.addPage(); // Adiciona uma nova página
            y = 20; // Reinicia a posição Y para a nova página
            doc.setFont("helvetica", "bold");
            startX = tableStartX;
            headers.forEach((header, i) => {
                doc.text(header, startX + columnWidths[i] / 2, y, null, null, "center");
                startX += columnWidths[i];
            });
            y += 15; // Aumenta o espaço após o cabeçalho
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
        y += rowHeight; // Mantém a altura constante entre as linhas
    });

    // Salvando o PDF com o nome formatado
    doc.save(`Stock_${date.replace(/\//g, "-")}.pdf`);
});


document.addEventListener("DOMContentLoaded", renderTable);
