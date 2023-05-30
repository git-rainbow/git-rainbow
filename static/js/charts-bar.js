/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */
const barConfig = {
    type: 'bar',
    data: {
    labels: ["Project1", "Project2", "Project3"],
    datasets: [
      {
        backgroundColor:[
          '#E1D2D0', '#C2D3DB','#643A6A'
        ],
        data: [33,10,30],
      },
    ],
  },
    options: {
        indexAxis: 'x',
        elements: {
            bar: {
                borderWidth: 2,
            }
        },
        responsive: true,
        plugins: {
            legend: {
                display:false
            },
        },
    },
};

const barsCtx = document.getElementById('bar')
window.myBar = new Chart(barsCtx, barConfig)
