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

