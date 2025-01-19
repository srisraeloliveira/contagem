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

    const doc = new jsPDF({ orientation: 'landscape' }); // Modo paisaje
    const date = new Date().toLocaleDateString();

    // Definindo as variáveis do título e data
    const title = "STOCK";
    const dateText = `Fecha: ${date}`;
    const kioscoText = "KIOSCO 365";

    // Definindo os cabeçalhos das colunas
    const headers = ["PRODUCTO", "EXHIBIDO", "DEPÓSITO", "TOTAL", "SISTEMA", "ESTADO"];
    const columnWidths = [40, 30, 30, 30, 30, 50]; // Largura das colunas

    // Calculando a largura total da tabela
    const totalWidth = columnWidths.reduce((acc, width) => acc + width, 0);
    const tableStartX = (doc.internal.pageSize.width - totalWidth) / 2; // Centralizando a tabela

    let y = 50; // Posição inicial para a tabela (depois do título)
    let firstPage = true; // Flag para saber se estamos na primeira página

    // Função para adicionar o título na primeira página
    function addTitle() {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, (doc.internal.pageSize.width - titleWidth) / 2, 20); // Título centralizado

        doc.setFontSize(12);
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, (doc.internal.pageSize.width - dateWidth) / 2, 30); // Data centralizada

        doc.setFontSize(14);
        const kioscoWidth = doc.getTextWidth(kioscoText);
        doc.text(kioscoText, (doc.internal.pageSize.width - kioscoWidth) / 2, 40); // KIOSCO 365 centralizado
    }

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
    const rowHeight = 10; // Altura constante das linhas
    const pageHeight = doc.internal.pageSize.height; // Altura da página

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

        // Verificar se a próxima linha ultrapassaria o limite da página
        if (y + rowHeight > pageHeight - 10) {
            doc.addPage(); // Adiciona uma nova página
            y = 20; // Reiniciar a posição Y após a nova página
            if (firstPage) {
                addTitle(); // Adiciona o título apenas na primeira página
                firstPage = false; // Desativa a adição do título nas próximas páginas
            }
            doc.setFont("helvetica", "bold"); // Redesenha os cabeçalhos na nova página
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
