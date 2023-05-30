/**
 * For usage, visit Chart.js docs https://www.chartjs.org/docs/latest/
 */
const lineConfig = {
  type: 'line',
  data: {
    labels: ['1 week', '2 week', '3 week', '4 week'],
    datasets: [
      {
        /**
         * These colors come from Tailwind CSS palette
         * https://tailwindcss.com/docs/customizing-colors/#default-color-palette
         */
        backgroundColor: '#0694a2',
        borderColor: '#0694a2',
        data: [5,2,1,4],
        fill: false,
      },{
        backgroundColor: '#CCCCCC',
        borderColor: '#CCCCCC',
        data: [1, 3, 0, 2],
        fill: false,
      },
    ],
  },
  options: {
    responsive: true,
    /**
     * Default legends are ugly and impossible to style.
     * See examples in charts.html to add your own legends
     *  */
    legend: {
      display: false,
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    scales: {
      x: {
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Month',
        },
      },
      y: {
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Value',
        },
      },
    },
    plugins:{
      legend: {
        display:false
      }
    }
  },
}

// change this to the id of your chart element in HMTL
const lineCtx = document.getElementById('line_top1')
window.myLine = new Chart(lineCtx, lineConfig)

const lineConfig_top2 = {
  type: 'line',
  data: {
    labels: ['1 week', '2 week', '3 week', '4 week'],
    datasets: [
      {
        /**
         * These colors come from Tailwind CSS palette
         * https://tailwindcss.com/docs/customizing-colors/#default-color-palette
         */
        backgroundColor: '#0694a2',
        borderColor: '#0694a2',
        data: [1, 3, 0, 2],
        fill: false,
      },{
        backgroundColor: '#CCCCCC',
        borderColor: '#CCCCCC',
        data: [5,2,1,4],
        fill: false,
      },
    ],
  },
  options: {
    responsive: true,
    /**
     * Default legends are ugly and impossible to style.
     * See examples in charts.html to add your own legends
     *  */
    legend: {
      display: false,
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    scales: {
      x: {
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Month',
        },
      },
      y: {
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Value',
        },
      },
    },
    plugins:{
      legend: {
        display:false
      }
    }
  },
}

// change this to the id of your chart element in HMTL
const lineCtx_top2 = document.getElementById('line_top2')
window.myLine = new Chart(lineCtx_top2, lineConfig_top2)

const lineConfig_top3 = {
  type: 'line',
  data: {
    labels: ['1 week', '2 week', '3 week', '4 week'],
    datasets: [
      {
        /**
         * These colors come from Tailwind CSS palette
         * https://tailwindcss.com/docs/customizing-colors/#default-color-palette
         */
        backgroundColor: '#0694a2',
        borderColor: '#0694a2',
        data: [3, 1, 1, 2],
        fill: false,
      },{
        backgroundColor: '#CCCCCC',
        borderColor: '#CCCCCC',
        data: [1, 3, 0, 2],
        fill: false,
      },
    ],
  },
  options: {
    responsive: true,
    /**
     * Default legends are ugly and impossible to style.
     * See examples in charts.html to add your own legends
     *  */
    legend: {
      display: false,
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    scales: {
      x: {
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Month',
        },
      },
      y: {
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Value',
        },
      },
    },
    plugins:{
      legend: {
        display:false
      }
    }
  },
}

// change this to the id of your chart element in HMTL
const lineCtx_top3 = document.getElementById('line_top3')
window.myLine = new Chart(lineCtx_top3, lineConfig_top3)