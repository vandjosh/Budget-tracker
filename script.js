const budgetForm = document.getElementById("budget-form");
const budgetInput = document.getElementById("budget-input");

const expenseForm = document.getElementById("expense-form");
const expenseName = document.getElementById("expense-name");
const expenseAmount = document.getElementById("expense-amount");
const expenseCategory = document.getElementById("expense-category");
const expenseDate = document.getElementById("expense-date");

const recurringForm = document.getElementById("recurring-form");
const recurringName = document.getElementById("recurring-name");
const recurringAmount = document.getElementById("recurring-amount");
const recurringCategory = document.getElementById("recurring-category");
const recurringDay = document.getElementById("recurring-day");

const budgetTotal = document.getElementById("budget-total");
const spentTotal = document.getElementById("spent-total");
const remainingTotal = document.getElementById("remaining-total");
const recurringCount = document.getElementById("recurring-count");

const expenseList = document.getElementById("expense-list");
const recurringList = document.getElementById("recurring-list");
const clearAllBtn = document.getElementById("clear-all-btn");

let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let recurringBills = JSON.parse(localStorage.getItem("recurringBills")) || [];

let categoryChart = null;

function saveData() {
  localStorage.setItem("monthlyBudget", monthlyBudget);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  localStorage.setItem("recurringBills", JSON.stringify(recurringBills));
}

function formatMoney(value) {
  return Number(value).toFixed(2);
}

function getCurrentYearMonth() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth()
  };
}

function isExpenseInCurrentMonth(expense) {
  const expenseDate = new Date(`${expense.date}T00:00:00`);
  const now = getCurrentYearMonth();

  return (
    expenseDate.getFullYear() === now.year &&
    expenseDate.getMonth() === now.month
  );
}

function getCurrentMonthExpenses() {
  return expenses.filter(isExpenseInCurrentMonth);
}

function calculateSpent() {
  return getCurrentMonthExpenses().reduce((sum, item) => sum + Number(item.amount), 0);
}

function calculateRecurringCommitments() {
  return recurringBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
}

function updateSummary() {
  const spent = calculateSpent();
  const commitments = calculateRecurringCommitments();
  const remaining = monthlyBudget - spent - commitments;

  budgetTotal.textContent = formatMoney(monthlyBudget);
  spentTotal.textContent = formatMoney(spent);
  remainingTotal.textContent = formatMoney(remaining);
  recurringCount.textContent = recurringBills.length;
}

function createEmptyMessage(text) {
  const li = document.createElement("li");
  li.className = "empty-state";
  li.textContent = text;
  return li;
}

function renderExpenses() {
  expenseList.innerHTML = "";

  const currentMonthExpenses = [...getCurrentMonthExpenses()].sort(
    (a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`)
  );

  if (currentMonthExpenses.length === 0) {
    expenseList.appendChild(createEmptyMessage("No expenses added yet."));
    return;
  }

  currentMonthExpenses.forEach((expense) => {
    const li = document.createElement("li");

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = expense.name;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = `${expense.category} • ${expense.date}${expense.isRecurring ? " • Recurring bill" : ""}`;

    main.appendChild(title);
    main.appendChild(meta);

    const right = document.createElement("div");
    right.className = "item-right";

    const amount = document.createElement("span");
    amount.className = "amount-pill";
    amount.textContent = `$${formatMoney(expense.amount)}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      expenses = expenses.filter((item) => item.id !== expense.id);
      saveData();
      renderAll();
    });

    right.appendChild(amount);
    right.appendChild(deleteBtn);

    li.appendChild(main);
    li.appendChild(right);
    expenseList.appendChild(li);
  });
}

function renderRecurringBills() {
  recurringList.innerHTML = "";

  if (recurringBills.length === 0) {
    recurringList.appendChild(createEmptyMessage("No recurring bills added yet."));
    return;
  }

  const sortedBills = [...recurringBills].sort((a, b) => a.day - b.day);

  sortedBills.forEach((bill) => {
    const li = document.createElement("li");

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = bill.name;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = `${bill.category} • Due every month on day ${bill.day} • Counts against remaining immediately`;

    main.appendChild(title);
    main.appendChild(meta);

    const right = document.createElement("div");
    right.className = "item-right";

    const amount = document.createElement("span");
    amount.className = "amount-pill";
    amount.textContent = `$${formatMoney(bill.amount)}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      recurringBills = recurringBills.filter((item) => item.id !== bill.id);
      saveData();
      renderAll();
    });

    right.appendChild(amount);
    right.appendChild(deleteBtn);

    li.appendChild(main);
    li.appendChild(right);
    recurringList.appendChild(li);
  });
}

function getCategoryTotals() {
  const totals = {};
  const currentMonthExpenses = getCurrentMonthExpenses();

  currentMonthExpenses.forEach((expense) => {
    const category = expense.category || "Other";
    totals[category] = (totals[category] || 0) + Number(expense.amount);
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
    type: "doughnut",
    data: {
      labels: labels.length ? labels : ["No Data"],
      datasets: [
        {
          label: "Spending by Category",
          data: data.length ? data : [1]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      },
      cutout: "68%"
    }
  });
}

function processRecurringBills() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  recurringBills.forEach((bill) => {
    const alreadyPostedThisMonth = expenses.some((expense) => {
      if (!expense.isRecurring || expense.sourceRecurringId !== bill.id) return false;

      const expenseDate = new Date(`${expense.date}T00:00:00`);
      return (
        expenseDate.getFullYear() === currentYear &&
        expenseDate.getMonth() === currentMonth
      );
    });

    if (!alreadyPostedThisMonth && today.getDate() >= Number(bill.day)) {
      const safeDay = Math.min(
        Number(bill.day),
        new Date(currentYear, currentMonth + 1, 0).getDate()
      );

      const expenseDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;

      expenses.push({
        id: crypto.randomUUID(),
        sourceRecurringId: bill.id,
        name: bill.name,
        amount: Number(bill.amount),
        category: bill.category,
        date: expenseDateString,
        isRecurring: true
      });
    }
  });

  saveData();
}

function renderAll() {
  updateSummary();
  renderExpenses();
  renderRecurringBills();
  renderChart();
}

budgetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  monthlyBudget = Number(budgetInput.value);
  saveData();
  renderAll();
  budgetForm.reset();
});

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  expenses.push({
    id: crypto.randomUUID(),
    name: expenseName.value.trim(),
    amount: Number(expenseAmount.value),
    category: expenseCategory.value,
    date: expenseDate.value,
    isRecurring: false
  });

  saveData();
  renderAll();
  expenseForm.reset();
});

recurringForm.addEventListener("submit", (e) => {
  e.preventDefault();

  recurringBills.push({
    id: crypto.randomUUID(),
    name: recurringName.value.trim(),
    amount: Number(recurringAmount.value),
    category: recurringCategory.value,
    day: Number(recurringDay.value)
  });

  saveData();
  renderAll();
  recurringForm.reset();
});

clearAllBtn.addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to delete all budgets, expenses, and recurring bills?");
  if (!confirmed) return;

  monthlyBudget = 0;
  expenses = [];
  recurringBills = [];
  saveData();
  renderAll();
});

processRecurringBills();
renderAll();
