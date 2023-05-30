/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */
const config = {
  type: 'bar',
  data: {
    labels: ["Python", "C++", "Markdown", "HTML", "CSS", "Javascript", "TXT"],
    datasets: [
      {
        label: 'Addition',
        backgroundColor: '#0694a2',
        // borderColor: window.chartColors.red,
        borderWidth: 1,
        data: [3,10,30,57,21,14,10],
      },
      {
        label: 'Delete',
        backgroundColor: '#7e3af2',
        // borderColor: window.chartColors.blue,
        borderWidth: 1,
        data: [20,4,17,24,31,9,40],
      },
    ],
  },
  options: {
        indexAxis: 'y',
        elements: {
            bar: {
                borderWidth: 2,
            }
        },
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
        }
    },
}

const barsCtx = document.getElementById('bars').getContext('2d');
const mybar = new Chart(barsCtx, config)
