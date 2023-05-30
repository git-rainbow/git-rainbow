function profile_stat(current_lines,last_month_lines,month_value,weeks) {
    const labels_data = [];
    for(let week = 1; week <= weeks; week++){
        labels_data.push(week + 'weeks');
    }

// --------------line graph----------------
    const Top1Config = {
            type: 'line',
            data: {
                labels: labels_data,
                datasets: [
            {
                label: month_value.now_month+'월',
                backgroundColor: '#0694a2',
                borderColor: '#0694a2',
                data: current_lines[0],
                fill: false
            },
            {
                label: month_value.last_month+'월',
                backgroundColor: '#CCCCCC',
                borderColor: '#CCCCCC',
                data: last_month_lines[0],
                fill: false,
            },
        ],
    },
    options: {
        responsive: true,
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
                beginAtZero: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Month',
                },
            },
            y: {
                display: true,
                beginAtZero: true,
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
const Top1lineCtx = document.getElementById('line_top1')
    window.myLine = new Chart(Top1lineCtx, Top1Config);

    const Top2Config = {
            type: 'line',
            data: {
                labels: labels_data,
                datasets: [
            {
                label: month_value.now_month+'월',
                backgroundColor: '#0694a2',
                borderColor: '#0694a2',
                data: current_lines[1],
                fill: false
            },
            {
                label: month_value.last_month+'월',
                backgroundColor: '#CCCCCC',
                borderColor: '#CCCCCC',
                data: last_month_lines[1],
                fill: false,
            },
        ],
    },
    options: {
        responsive: true,
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
                beginAtZero: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Month',
                },
            },
            y: {
                display: true,
                beginAtZero: true,
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
const Top2lineCtx = document.getElementById('line_top2')
    window.myLine = new Chart(Top2lineCtx, Top2Config);

    const Top3Config = {
            type: 'line',
            data: {
                labels: labels_data,
                datasets: [
            {
                label: month_value.now_month+'월',
                backgroundColor: '#0694a2',
                borderColor: '#0694a2',
                data: current_lines[2],
                fill: false
            },
            {
                label: month_value.last_month+'월',
                backgroundColor: '#CCCCCC',
                borderColor: '#CCCCCC',
                data: last_month_lines[2],
                fill: false,
            },
        ],
    },
    options: {
        responsive: true,
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
                beginAtZero: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Month',
                },
            },
            y: {
                display: true,
                beginAtZero: true,
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
const Top3lineCtx = document.getElementById('line_top3')
    window.myLine = new Chart(Top3lineCtx, Top3Config);
}
function top_projects(project_percentage,project_name){
    // --------------bar graph----------------
    const barConfig = {
    type: 'bar',
    plugins:[ChartDataLabels],
    data: {
    labels: project_name,
    datasets: [
      {
        backgroundColor:[
          '#96C362','#71C0AA', '#4569A8'
        ],
        data: project_percentage,
          datalabels : {
            anchor: 'end',
            align: 'bottom',
            color:'white',
              font: {
                  weight: 'bold'
              }
        }
      },
    ],
  },
    options: {
        scales: {
            y: {
                display: true,
                title: {
                    display: true,
                    text: '%',
                },
            }
        },
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
             datalabels: {
              formatter: function (value) {
                return value + '%';
              },
            },
        },
    },
};

const barsCtx = document.getElementById('top_projects')
window.myBar = new Chart(barsCtx, barConfig)
}
