const budgetForm = document.getElementById("budget-form");
const budgetInput = document.getElementById("budget-input");

const expenseForm = document.getElementById("expense-form");
const expenseName = document.getElementById("expense-name");
const expenseAmount = document.getElementById("expense-amount");
const expenseCategory = document.getElementById("expense-category");
const expenseDate = document.getElementById("expense-date");

const budgetTotal = document.getElementById("budget-total");
const spentTotal = document.getElementById("spent-total");
const remainingTotal = document.getElementById("remaining-total");
const expenseList = document.getElementById("expense-list");
const clearAllBtn = document.getElementById("clear-all-btn");

let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

let categoryChart;

function saveData() {
  localStorage.setItem("monthlyBudget", monthlyBudget);
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function calculateSpent() {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

function updateSummary() {
  const spent = calculateSpent();
  const remaining = monthlyBudget - spent;

  budgetTotal.textContent = monthlyBudget.toFixed(2);
  spentTotal.textContent = spent.toFixed(2);
  remainingTotal.textContent = remaining.toFixed(2);
}

function renderExpenses() {
  expenseList.innerHTML = "";

  expenses.forEach((expense, index) => {
    const li = document.createElement("li");

    const infoDiv = document.createElement("div");
    infoDiv.className = "expense-info";

    const mainText = document.createElement("strong");
    mainText.textContent = `${expense.name} - $${expense.amount.toFixed(2)}`;

    const metaText = document.createElement("span");
    metaText.className = "expense-meta";
    metaText.textContent = `${expense.category} | ${expense.date}`;

    infoDiv.appendChild(mainText);
    infoDiv.appendChild(metaText);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => {
      expenses.splice(index, 1);
      saveData();
      renderAll();
    });

    li.appendChild(infoDiv);
    li.appendChild(deleteBtn);
    expenseList.appendChild(li);
  });
}

function getCategoryTotals() {
  const totals = {};

  expenses.forEach((expense) => {
    if (totals[expense.category]) {
      totals[expense.category] += expense.amount;
    } else {
      totals[expense.category] = expense.amount;
    }
  });

  return totals;
}

function renderChart() {
  const categoryTotals = getCategoryTotals();
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const ctx = document.getElementById("categoryChart").getContext("2d");

  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Spending by Category",
          data: data
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderAll() {
  updateSummary();
  renderExpenses();
  renderChart();
}

budgetForm.addEventListener("submit", function (e) {
  e.preventDefault();
  monthlyBudget = Number(budgetInput.value);
  saveData();
  updateSummary();
  budgetForm.reset();
});

expenseForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const newExpense = {
    name: expenseName.value,
    amount: Number(expenseAmount.value),
    category: expenseCategory.value,
    date: expenseDate.value
  };

  expenses.push(newExpense);
  saveData();
  renderAll();
  expenseForm.reset();
});

clearAllBtn.addEventListener("click", function () {
  const confirmed = confirm("Are you sure you want to delete all budget and expense data?");
  if (confirmed) {
    monthlyBudget = 0;
    expenses = [];
    saveData();
    renderAll();
  }
});

renderAll();
