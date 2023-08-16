/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */

function getMonthListLastYear() {
  const currentDate = new Date();
  const lastYearDate = new Date();
  lastYearDate.setFullYear(currentDate.getFullYear() - 1);

  const months = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  while (lastYearDate < currentDate) {
    const monthName = monthNames[lastYearDate.getMonth()];
    months.push(monthName);

    lastYearDate.setMonth(lastYearDate.getMonth() + 1);
  }

  return months;
}

const barConfig = {
    type: 'bar',
    data: {
        labels: getMonthListLastYear(),
        datasets: [
            {
                label: 'garronej',
                data: [13, 14, 52, 74, 33, 90, 70, 5, 61, 89, 12, 43],
                backgroundColor: '#F694a2',
            },
            {
                label: 'kentcdodds',
                data: [73, 13, 65, 11, 0, 57, 88, 12, 55, 13, 67, 14],
                backgroundColor: '#0694a2',
            },
            {
                label: 'PowerKiKi',
                data: [66, 33, 43, 12, 54, 62, 84, 12, 67, 3, 12, 67],
                backgroundColor: '#7e3af2',
            },
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true
            }
        },
    }
};

const barsCtx = document.getElementById('bars')
window.myBar = new Chart(barsCtx, barConfig)
