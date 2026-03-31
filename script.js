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
const rolloverTotal = document.getElementById("rollover-total");
const spentTotal = document.getElementById("spent-total");
const committedTotal = document.getElementById("committed-total");
const remainingTotal = document.getElementById("remaining-total");
const availableTotal = document.getElementById("available-total");

const transactionCount = document.getElementById("transaction-count");
const recurringCount = document.getElementById("recurring-count");
const largestExpense = document.getElementById("largest-expense");
const monthLabel = document.getElementById("month-label");

const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const statusBadge = document.getElementById("status-badge");

const expenseList = document.getElementById("expense-list");
const recurringList = document.getElementById("recurring-list");
const clearAllBtn = document.getElementById("clear-all-btn");

let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let recurringBills = JSON.parse(localStorage.getItem("recurringBills")) || [];
let rolloverAmount = Number(localStorage.getItem("rolloverAmount")) || 0;
let lastActiveMonth = localStorage.getItem("lastActiveMonth") || getMonthKey(new Date());

let categoryChart = null;
let editingRecurringBillId = null;
let trendChart = null;

function saveData() {
  localStorage.setItem("monthlyBudget", monthlyBudget);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  localStorage.setItem("recurringBills", JSON.stringify(recurringBills));
  localStorage.setItem("rolloverAmount", rolloverAmount);
  localStorage.setItem("lastActiveMonth", lastActiveMonth);
}

function formatMoney(value) {
  return Number(value).toFixed(2);
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getReadableMonth(date) {
  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric"
  });
}

function getCurrentMonthKey() {
  return getMonthKey(new Date());
}

function isExpenseInMonth(expense, monthKey) {
  return typeof expense.date === "string" && expense.date.startsWith(monthKey);
}

function getExpensesForMonth(monthKey) {
  return expenses.filter((expense) => isExpenseInMonth(expense, monthKey));
}

function calculateSpentForMonth(monthKey) {
  return getExpensesForMonth(monthKey).reduce((sum, expense) => {
    return sum + Number(expense.amount);
  }, 0);
}

function hasRecurringBillPostedThisMonth(billId, monthKey) {
  return expenses.some((expense) => {
    return (
      expense.isRecurring &&
      expense.sourceRecurringId === billId &&
      isExpenseInMonth(expense, monthKey)
    );
  });
}

function calculateOutstandingRecurringCommitments(monthKey) {
  return recurringBills.reduce((sum, bill) => {
    const alreadyPosted = hasRecurringBillPostedThisMonth(bill.id, monthKey);
    return alreadyPosted ? sum : sum + Number(bill.amount);
  }, 0);
}

function getAvailableThisMonth() {
  return monthlyBudget + rolloverAmount;
}

function getActualSpentThisMonth() {
  return calculateSpentForMonth(getCurrentMonthKey());
}

function getRemainingThisMonth() {
  const monthKey = getCurrentMonthKey();
  return getAvailableThisMonth() - getActualSpentThisMonth() - calculateOutstandingRecurringCommitments(monthKey);
}

function getLargestExpenseThisMonth() {
  const currentMonthExpenses = getExpensesForMonth(getCurrentMonthKey());
  if (currentMonthExpenses.length === 0) return 0;
  return Math.max(...currentMonthExpenses.map((expense) => Number(expense.amount)));
}

function rolloverIfNeeded() {
  const currentMonth = getCurrentMonthKey();

  if (lastActiveMonth === currentMonth) {
    return;
  }

  let workingMonth = lastActiveMonth;
  let workingRollover = rolloverAmount;

  while (workingMonth !== currentMonth) {
    const previousMonthSpent = calculateSpentForMonth(workingMonth);
    const previousMonthCommitments = calculateOutstandingRecurringCommitments(workingMonth);
    const previousMonthAvailable = monthlyBudget + workingRollover;
    const previousMonthRemaining = previousMonthAvailable - previousMonthSpent - previousMonthCommitments;

    workingRollover = previousMonthRemaining > 0 ? previousMonthRemaining : 0;

    const [year, month] = workingMonth.split("-").map(Number);
    workingMonth = getMonthKey(new Date(year, month, 1));
  }

  rolloverAmount = workingRollover;
  lastActiveMonth = currentMonth;
  saveData();
}

function updateMonthLabel() {
  monthLabel.textContent = getReadableMonth(new Date());
}

function updateSummary() {
  const currentMonthKey = getCurrentMonthKey();
  const baseBudget = monthlyBudget;
  const rollover = rolloverAmount;
  const available = getAvailableThisMonth();
  const spent = getActualSpentThisMonth();
  const commitments = calculateOutstandingRecurringCommitments(currentMonthKey);
  const remaining = getRemainingThisMonth();

  budgetTotal.textContent = formatMoney(baseBudget);
  rolloverTotal.textContent = formatMoney(rollover);
  spentTotal.textContent = formatMoney(spent);
  committedTotal.textContent = formatMoney(commitments);
  remainingTotal.textContent = formatMoney(remaining);
  availableTotal.textContent = `$${formatMoney(available)}`;

  transactionCount.textContent = getExpensesForMonth(currentMonthKey).length;
  recurringCount.textContent = recurringBills.length;
  largestExpense.textContent = `$${formatMoney(getLargestExpenseThisMonth())}`;

  const denominator = available <= 0 ? 1 : available;
  const usedPercent = Math.min(((spent + commitments) / denominator) * 100, 100);
  progressFill.style.width = `${Math.max(0, usedPercent)}%`;
  progressText.textContent = `${formatMoney(usedPercent)}% used`;

  progressFill.classList.remove("progress-good", "progress-warning", "progress-danger");
  statusBadge.classList.remove("status-good", "status-warning", "status-danger");

  if (remaining > available * 0.35) {
    progressFill.classList.add("progress-good");
    statusBadge.classList.add("status-good");
    statusBadge.textContent = "Healthy";
  } else if (remaining > 0) {
    progressFill.classList.add("progress-warning");
    statusBadge.classList.add("status-warning");
    statusBadge.textContent = "Tight";
  } else {
    progressFill.classList.add("progress-danger");
    statusBadge.classList.add("status-danger");
    statusBadge.textContent = "Over Budget";
  }
}

function createEmptyMessage(text) {
  const li = document.createElement("li");
  li.className = "empty-state";
  li.textContent = text;
  return li;
}

function renderExpenses() {
  expenseList.innerHTML = "";

  const currentMonthExpenses = [...getExpensesForMonth(getCurrentMonthKey())].sort(
    (a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`)
  );

  if (currentMonthExpenses.length === 0) {
    expenseList.appendChild(createEmptyMessage("No expenses added for this month yet."));
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
    meta.textContent = `${expense.category} • ${expense.date}${expense.isRecurring ? " • Auto-posted recurring bill" : ""}`;

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

function fillRecurringFormForEdit(bill) {
  recurringName.value = bill.name;
  recurringAmount.value = bill.amount;
  recurringCategory.value = bill.category;
  recurringDay.value = bill.day;
  editingRecurringBillId = bill.id;

  const submitButton = recurringForm.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.textContent = "Save Changes";
  }
}

function resetRecurringForm() {
  recurringForm.reset();
  editingRecurringBillId = null;

  const submitButton = recurringForm.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.textContent = "Add Recurring Bill";
  }
}

function renderRecurringBills() {
  recurringList.innerHTML = "";

  if (recurringBills.length === 0) {
    recurringList.appendChild(createEmptyMessage("No recurring bills added yet."));
    return;
  }

  const currentMonthKey = getCurrentMonthKey();
  const sortedBills = [...recurringBills].sort((a, b) => a.day - b.day);

  sortedBills.forEach((bill) => {
    const li = document.createElement("li");

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = bill.name;

    const alreadyPosted = hasRecurringBillPostedThisMonth(bill.id, currentMonthKey);

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = alreadyPosted
      ? `${bill.category} • Due every month on day ${bill.day} • Already posted this month`
      : `${bill.category} • Due every month on day ${bill.day} • Counts toward remaining immediately`;

    main.appendChild(title);
    main.appendChild(meta);

    const right = document.createElement("div");
    right.className = "item-right";

    const amount = document.createElement("span");
    amount.className = "commitment-pill";
    amount.textContent = `$${formatMoney(bill.amount)}`;

    const editBtn = document.createElement("button");
    editBtn.className = "small-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      fillRecurringFormForEdit(bill);
      recurringForm.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      const wasEditingThisBill = editingRecurringBillId === bill.id;

      recurringBills = recurringBills.filter((item) => item.id !== bill.id);

      expenses = expenses.filter((expense) => {
        return !(expense.isRecurring && expense.sourceRecurringId === bill.id);
      });

      if (wasEditingThisBill) {
        resetRecurringForm();
      }

      saveData();
      renderAll();
    });

    right.appendChild(amount);
    right.appendChild(editBtn);
    right.appendChild(deleteBtn);

    li.appendChild(main);
    li.appendChild(right);
    recurringList.appendChild(li);
  });
}

function getCategoryTotals() {
  const totals = {};
  const currentMonthExpenses = getExpensesForMonth(getCurrentMonthKey());

  currentMonthExpenses.forEach((expense) => {
    const category = expense.category || "Other";
    totals[category] = (totals[category] || 0) + Number(expense.amount);
  });

  return totals;
}
function getCurrentMonthExpensesSorted() {
  return [...getExpensesForMonth(getCurrentMonthKey())].sort(
    (a, b) => new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`)
  );
}

function getDailyTrendData() {
  const currentMonthExpenses = getCurrentMonthExpensesSorted();
  const dailyTotals = {};

  currentMonthExpenses.forEach((expense) => {
    const day = expense.date.slice(-2);
    dailyTotals[day] = (dailyTotals[day] || 0) + Number(expense.amount);
  });

  const labels = Object.keys(dailyTotals).sort((a, b) => Number(a) - Number(b));
  let runningTotal = 0;

  const values = labels.map((day) => {
    runningTotal += dailyTotals[day];
    return runningTotal;
  });

  return { labels, values };
}
const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    const { width, height, ctx } = chart;
    ctx.save();

    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

    ctx.font = "600 14px Inter";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.fillText("Total Spent", width / 2, height / 2 - 8);

    ctx.font = "700 18px Inter";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`$${total.toFixed(0)}`, width / 2, height / 2 + 14);

    ctx.restore();
  }
};
function renderChart() {
  const categoryTotals = getCategoryTotals();
  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const ctx = document.getElementById("categoryChart").getContext("2d");

  if (categoryChart) {
    categoryChart.destroy();
  }

  if (labels.length === 0) {
    categoryChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["No Expenses Yet"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["rgba(203, 213, 225, 0.85)"],
            borderWidth: 0
          }
        ]
      },
      options: {
        plugins: {
  legend: {
    position: "bottom"
  },
  tooltip: {
    enabled: true
  }
}
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom"
          }
        },
        cutout: "68%"
      }
    });
    return;
plugins: [centerTextPlugin],
  }

  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#2563eb",
            "#7c3aed",
            "#14b8a6",
            "#f59e0b",
            "#ef4444",
            "#06b6d4",
            "#22c55e",
            "#8b5cf6",
            "#f97316",
            "#e11d48"
          ],
          borderWidth: 0,
          hoverOffset: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      },
      cutout: "68%"
    }
  });
}
function renderTrendChart() {
  const { labels, values } = getDailyTrendData();
  const ctx = document.getElementById("trendChart").getContext("2d");

  if (trendChart) {
    trendChart.destroy();
  }

  if (labels.length === 0) {
    trendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["No Data"],
        datasets: [
          {
            label: "Cumulative Spending",
            data: [0],
            borderColor: "#94a3b8",
            backgroundColor: "rgba(148, 163, 184, 0.15)",
            pointBackgroundColor: "#94a3b8",
            pointRadius: 4,
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` $${Number(context.parsed.y).toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return `$${value}`;
              }
            }
          }
        }
      }
    });
    return;
  }

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Cumulative Spending",
          data: values,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          pointBackgroundColor: "#7c3aed",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointRadius: 5,
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      animation: {
        duration: 900
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return `Day ${context[0].label}`;
            },
            label: function(context) {
              return `Cumulative spent: $${Number(context.parsed.y).toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Day of Month"
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Total Spent"
          },
          ticks: {
            callback: function(value) {
              return `$${value}`;
            }
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        }
      }
    }
  });
}
function processRecurringBills() {
  const today = new Date();
  const currentMonthKey = getCurrentMonthKey();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  recurringBills.forEach((bill) => {
    const alreadyPostedThisMonth = hasRecurringBillPostedThisMonth(bill.id, currentMonthKey);

    if (!alreadyPostedThisMonth && today.getDate() >= Number(bill.day)) {
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const safeDay = Math.min(Number(bill.day), lastDayOfMonth);

      const expenseDateString = `${currentMonthKey}-${String(safeDay).padStart(2, "0")}`;

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
  updateMonthLabel();
  updateSummary();
  renderExpenses();
  renderRecurringBills();
  renderChart();
  renderTrendChart();
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

  const formData = {
    name: recurringName.value.trim(),
    amount: Number(recurringAmount.value),
    category: recurringCategory.value,
    day: Number(recurringDay.value)
  };

  if (editingRecurringBillId) {
    recurringBills = recurringBills.map((bill) => {
      if (bill.id !== editingRecurringBillId) return bill;
      return {
        ...bill,
        ...formData
      };
    });

    expenses = expenses.map((expense) => {
      if (!(expense.isRecurring && expense.sourceRecurringId === editingRecurringBillId)) {
        return expense;
      }

      return {
        ...expense,
        name: formData.name,
        amount: formData.amount,
        category: formData.category
      };
    });

    resetRecurringForm();
  } else {
    recurringBills.push({
      id: crypto.randomUUID(),
      ...formData
    });
    resetRecurringForm();
  }

  saveData();
  renderAll();
});

clearAllBtn.addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to delete all budgets, expenses, recurring bills, and rollover data?");
  if (!confirmed) return;

  monthlyBudget = 0;
  expenses = [];
  recurringBills = [];
  rolloverAmount = 0;
  lastActiveMonth = getCurrentMonthKey();
  editingRecurringBillId = null;
  saveData();
  renderAll();
  resetRecurringForm();
});

rolloverIfNeeded();
processRecurringBills();
renderAll();
resetRecurringForm();

