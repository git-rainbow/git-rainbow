/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */

const scatterConfig = {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'garronej',
            data: [{
                x: 2,
                y: 304
            }, {
                x: 4,
                y: 101
            }, {
                x: 1,
                y: 20
            }],
            backgroundColor: 'rgb(255, 99, 132)'
        },
                   {
            label: 'kentcdodds',
            data: [{
                x: 6,
                y: 11
            }, {
                x: 6,
                y: 14
            }, {
                x: 4,
                y: 3142
            }],
            backgroundColor: 'rgb(2,119,189)'
                   },
                   {
            label: 'PowerKiKi',
            data: [{
                x: 3,
                y: 705
            }, {
                x: 1,
                y: 16
            }, {
                x: 5,
                y: 142
            }],
            backgroundColor: 'rgb(255,214,0)'
        }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            }
        },
        scales: {
            x: {
                min: 0,
                max: 24
            }
        }
    },
}
// change this to the id of your chart element in HMTL
const scatterCtx = document.getElementById('scatter')
window.myScatter = new Chart(scatterCtx, scatterConfig)
