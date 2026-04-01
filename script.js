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
      plugins: [centerTextPlugin],
      data: {
        labels: ["No Expenses Yet"],
        datasets: [
          {
            data: [0],
            backgroundColor: ["rgba(203, 213, 225, 0.85)"],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom"
          },
          tooltip: {
            enabled: true
          }
        },
        cutout: "75%"
      }
    });
    return;
  }

  categoryChart = new Chart(ctx, {
    type: "doughnut",
    plugins: [centerTextPlugin],
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
        },
        tooltip: {
          enabled: true
        }
      },
      cutout: "75%"
    }
  });
}
const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    const { width, height, ctx } = chart;
    const dataset = chart.data.datasets[0];
    const total = dataset.data.reduce((a, b) => a + b, 0);

    ctx.save();
    ctx.textAlign = "center";

    ctx.font = "600 14px Inter";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Total Spent", width / 2, height / 2 - 8);

    ctx.font = "700 18px Inter";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`$${total.toFixed(0)}`, width / 2, height / 2 + 14);

    ctx.restore();
  }
};
function renderTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;

  const { labels, values } = getDailyTrendData();
  const ctx = canvas.getContext("2d");

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
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: true,
            borderWidth: 3
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
              label: function (context) {
                return `Cumulative spent: $${Number(context.parsed.y).toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(148, 163, 184, 0.12)"
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
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
          pointRadius: 0,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true,
          borderWidth: 3
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
            title: function (context) {
              return `Day ${context[0].label}`;
            },
            label: function (context) {
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
            callback: function (value) {
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
function renderAll() {
  updateMonthLabel();
  updateSummary();
  renderExpenses();
  renderRecurringBills();
  renderChart();
  renderTrendChart();
}
try {
  rolloverIfNeeded();
  processRecurringBills();
  renderAll();
  resetRecurringForm();
} catch (error) {
  console.error("APP CRASH:", error);
}
