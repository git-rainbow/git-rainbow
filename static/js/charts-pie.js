/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */
const pieConfig = {
  type: 'doughnut',
  data: {
    datasets: [
      {
        data: [15, 20, 27, 10, 28],
        /**
         * These colors come from Tailwind CSS palette
         * https://tailwindcss.com/docs/customizing-colors/#default-color-palette
         */
        backgroundColor: ['#0694a2', '#1c64f2', '#7e3af2','#005666','#4641d9'],
        label: 'Dataset 1',
      },
    ],
    labels: ['Code', 'Document', 'Test','Data','Etc'],
  },
   options: {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          usePointStyle : true,
        },
        position: 'bottom',
        maxBarThickness: "50%",
      },
    },
    cutout: "80%",
  },
}

// change this to the id of your chart element in HMTL
const pieCtx = document.getElementById('pie')
const Donut_chart = new Chart(pieCtx, pieConfig)
