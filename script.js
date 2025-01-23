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

        const status = item.systemQty === 0 || item.systemQty
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
                <input type="number" value="${item.systemQty ?? ''}" onchange="updateField(${index}, 'systemQty', this.value)" />
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

    // Retornar o cursor ao campo "Nombre del Producto"
    document.getElementById("itemName").focus();
});

clearAllButton.addEventListener("click", () => {
    inventoryData = [];
    saveToLocalStorage();
    renderTable();
});

exportPdfButton.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const date = new Date().toLocaleDateString();

    const headers = ["PRODUCTO", "EXHIBIDO", "DEPÓSITO", "TOTAL", "SISTEMA", "ESTADO"];
    const columnWidths = calculateColumnWidths();
    const tableStartX = calculateTableStartX(columnWidths, doc);
    const rowHeight = 10;
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;

    // Adicionar cabeçalhos
    const addHeaders = () => {
        doc.setFont("helvetica", "bold");
        addRowToPdf(doc, headers, columnWidths, tableStartX, y);
        y += 15; // Espaço após os cabeçalhos
    };

    // Início da tabela
    addHeaders();

    // Adicionar linhas de dados
    doc.setFont("helvetica", "normal");
    inventoryData.forEach((item, index) => {
        const total = item.exposedQty + item.depositQty;
        const status = calculateStatus(item.systemQty, total);
        const row = [
            item.name,
            String(item.exposedQty),
            String(item.depositQty),
            String(total),
            String(item.systemQty ?? ""),
            status,
        ];

        // Verificar se a linha cabe na página
        if (y + rowHeight > pageHeight - 10) {
            doc.addPage(); // Nova página
            y = 20; // Reiniciar a posição Y
            addHeaders(); // Repetir os cabeçalhos
        }

        addRowToPdf(doc, row, columnWidths, tableStartX, y);
        y += rowHeight; // Próxima linha
    });

    // Salvar o PDF
    doc.save(`Stock_${date.replace(/\//g, "-")}.pdf`);
});

/**
 * Calcula larguras das colunas
 */
function calculateColumnWidths() {
    const maxLengthProduct = Math.max(...inventoryData.map(item => item.name.length));
    const firstColumnWidth = maxLengthProduct * 1.5;
    return [firstColumnWidth, 30, 30, 30, 30, 50];
}

/**
 * Calcula a posição inicial da tabela
 */
function calculateTableStartX(columnWidths, doc) {
    const totalWidth = columnWidths.reduce((acc, width) => acc + width, 0);
    return (doc.internal.pageSize.width - totalWidth) / 2;
}

/**
 * Adiciona uma linha ao PDF
 */
function addRowToPdf(doc, row, columnWidths, startX, y) {
    let x = startX;
    row.forEach((text, i) => {
        doc.text(text, x + columnWidths[i] / 2, y, null, null, "center");
        x += columnWidths[i];
    });
}


document.addEventListener("DOMContentLoaded", renderTable);
