import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDpu0HbJ_Pi1nKXc2tRhyKwFcRESEmJifw",
  authDomain: "inventory-system-a9982.firebaseapp.com",
  projectId: "inventory-system-a9982",
  storageBucket: "inventory-system-a9982.firebasestorage.app",
  messagingSenderId: "1048066565169",
  appId: "1:1048066565169:web:e38b20e3e176bbb002a110"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let chart;

// Navigation
document.getElementById("btnDashboard").onclick = () => {
  show("dashboard");
  loadData();
};

document.getElementById("btnAdd").onclick = () => show("add");

document.getElementById("btnView").onclick = () => {
  show("view");
  loadData();
};

function show(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// Submit
document.getElementById("submitBtn").addEventListener("click", async () => {
  const product = document.getElementById("product").value.trim();
  const sku = document.getElementById("sku").value.trim();
  const quantity = document.getElementById("quantity").value;
  const type = document.getElementById("type").value;

  if (!product || !sku || !quantity) return alert("Fill all fields");

  await addDoc(collection(db, "inventory"), {
    product,
    sku,
    quantity: Number(quantity),
    type
  });

  alert("Stock Added");
});

// Load Data
async function loadData() {
  const snapshot = await getDocs(collection(db, "inventory"));

  const inventory = {};

  snapshot.forEach(doc => {
  const item = doc.data();
  const id = doc.id; // IMPORTANT

  if (!inventory[item.sku]) {
    inventory[item.sku] = {
      product: item.product,
      stock: 0,
      ids: [] // store all doc IDs
    };
  }

  inventory[item.sku].ids.push(id);

  if (item.type === "IN") {
    inventory[item.sku].stock += item.quantity;
  } else {
    inventory[item.sku].stock -= item.quantity;
  }
});
  const table = document.getElementById("tableBody");
  table.innerHTML = "";

  let low = 0;

  Object.entries(inventory).forEach(([sku, item]) => {
    if (item.stock < 10) low++;

    table.innerHTML += `
<tr class="${item.stock < 10 ? 'low-stock' : ''}">
  <td>${item.product}</td>
  <td>${sku}</td>
  <td>${item.stock}</td>
  <td>
    <button onclick="deleteItem('${item.ids[0]}')">Delete</button>
  </td>
</tr>
`;
  });

  document.getElementById("totalProducts").innerText = Object.keys(inventory).length;
  document.getElementById("lowStock").innerText = low;

  renderChart(inventory);
}

// Chart
function renderChart(inventory) {
  const labels = [];
  const values = [];

  Object.values(inventory).forEach(item => {
    labels.push(item.product);
    values.push(item.stock);
  });

  const ctx = document.getElementById("stockChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Stock",
        data: values
      }]
    }
  });
}

// Export Excel
window.exportExcel = function() {
  const rows = [];

  document.querySelectorAll("#tableBody tr").forEach(row => {
    const cols = row.querySelectorAll("td");

    rows.push({
      Product: cols[0].innerText,
      SKU: cols[1].innerText,
      Stock: cols[2].innerText
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");

  XLSX.writeFile(wb, "Inventory.xlsx");
};

// Import Excel
window.importExcel = function() {
  const file = document.getElementById("importFile").files[0];
  if (!file) return alert("Select file");

  const reader = new FileReader();

  reader.onload = async function(e) {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    for (let item of json) {
      await addDoc(collection(db, "inventory"), {
        product: item.Product,
        sku: item.SKU,
        quantity: Number(item.Stock),
        type: "IN"
      });
    }

    alert("Imported!");
    loadData();
  };

  reader.readAsArrayBuffer(file);
};

import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

window.deleteItem = async function(id) {
  if (!confirm("Are you sure you want to delete?")) return;

  try {
    await deleteDoc(doc(db, "inventory", id));
    alert("Deleted successfully");

    loadData(); // refresh

  } catch (error) {
    console.error(error);
    alert("Error deleting item");
  }
};