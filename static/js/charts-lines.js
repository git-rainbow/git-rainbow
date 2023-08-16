/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */
const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const lineConfig = {
    type: 'line',
    data: {
        labels: labels,
        datasets: [
            {
                label: 'garronej',
                data: [43, 48, 40, 54, 67, 73, 700],
                borderColor: '#7e3af2',
                backgroundColor: '#7e3af2',
            },
            {
                label: 'kentcdoddso',
                data: [24, 50, 64, 740, 52, 51, 65],
                borderColor: '#0694a2',
                backgroundColor: '#0694a2',
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
        }
    },
};

// change this to the id of your chart element in HMTL
const lineCtx = document.getElementById('lines')
window.myLine = new Chart(lineCtx, lineConfig)
