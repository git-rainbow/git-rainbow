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

function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

function generateRandomColorObject(array) {
    const colorObject = {};
    for (let user of array) {
        const randomColor = getRandomColor();
        colorObject[user] = randomColor;
    }
    return colorObject;
}

function get_datasets(calendar_data, category, group_color_obj, member_list=null) {
    let user_info_obj = {};
    for (let each_data of calendar_data) {
        let github_id = each_data.github_id;
        if (member_list && !member_list.includes(github_id)){
            continue;
        }
        let code_lines = each_data.lines
        if(!user_info_obj[github_id]){
            user_info_obj[github_id] = {
                'monthly': {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0},
                'weekly': {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0},
                'hourly': {},
                'avatar_url': each_data.avatar_url,
                'color': group_color_obj[github_id]
            };
        }
        const user_key = user_info_obj[github_id]
        const date_obj = new Date(each_data.author_date)
        const month = date_obj.getUTCMonth();
        const day = date_obj.getUTCDay();
        const hour = date_obj.getUTCHours();
        const minute_float = Number((date_obj.getUTCMinutes()/60).toFixed(10));
        const second_float = Number((date_obj.getUTCSeconds()/3600).toFixed(10));
        const time_info = hour + minute_float + second_float;

        if (category == 'monthly') {
            user_key[category][month] += code_lines;
        } else if (category == 'weekly') {
                user_key[category][day] += code_lines;
        } else if (category == 'hourly') {
            user_key[category][time_info] = {x: time_info, y: code_lines};
        }
    }

    let datasets = []
    for (let user in user_info_obj){
        let user_info = user_info_obj[user]
        datasets.push({
            label: user,
            data: Object.values(user_info[category]),
            backgroundColor: user_info['color'],
            borderColor: user_info['color'],
            avatar_url: user_info['avatar_url']
        })
    }
    return datasets;
}

function get_grass_datasets(calendar_data, member_list=null) {
    let grass_data = {};
    for (let data of calendar_data) {
        const { author_date, github_id, tech_name, avatar_url, repo_url, commit_hash, lines } = data;
        const date = author_date.split('T')[0];
        if (member_list) {
            if (member_list.includes(github_id)){
                grass_data[date] = grass_data[date] || {};
                grass_data[date][tech_name] = grass_data[date][tech_name] || {total_lines: 0, commit_repo: { [repo_url]: [] }};
                grass_data[date][tech_name]["total_lines"] += lines;
                grass_data[date][tech_name]["commit_repo"][repo_url] = grass_data[date][tech_name]["commit_repo"][repo_url] || [];
                grass_data[date][tech_name]["commit_repo"][repo_url].push({avatar_url, commit_hash, github_id, lines});
            }
        } else {
            grass_data[date] = grass_data[date] || {};
            grass_data[date][tech_name] = grass_data[date][tech_name] || {total_lines: 0, commit_repo: { [repo_url]: [] }};
            grass_data[date][tech_name]["total_lines"] += lines;
            grass_data[date][tech_name]["commit_repo"][repo_url] = grass_data[date][tech_name]["commit_repo"][repo_url] || [];
            grass_data[date][tech_name]["commit_repo"][repo_url].push({avatar_url, commit_hash, github_id, lines});
        }
    }
    return grass_data;
}

function draw_graph_header(datasets, category) {
    let inserted_tag = '';
    for (let user_data of datasets){
        inserted_tag += `
            <div class="flex items-center">
                <span class="inline-block w-4 h-3 mr-1" style="background-color:${user_data.backgroundColor}"></span>
                <img class="object-cover w-full h-full rounded-full mx-2 my-2" src="${user_data.avatar_url}" style="width:32px;height:32px">
                <span>${user_data.label}</span>
            </div>
        `;
    }
    document.querySelector(`#${category}_graph_div`).innerHTML = inserted_tag;
}

function draw_monthly_graph(datasets) {
    draw_graph_header(datasets, 'monthly');
    const barConfig = {
        type: 'bar',
        data: {
            labels: getMonthListLastYear(),
            datasets: datasets
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
    const barsCtx = document.getElementById('bars');
    try {
        window.myBar = new Chart(barsCtx, barConfig);
    } catch {
        window.myBar.destroy();
        window.myBar = new Chart(barsCtx, barConfig);
    }
}

function draw_weekly_graph(datasets) {
    draw_graph_header(datasets, 'weekly');
    let day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const lineConfig = {
        type: 'line',
        data: {
            labels: day_names,
            datasets: datasets
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
    const lineCtx = document.getElementById('lines');
    try {
        window.myLine = new Chart(lineCtx,  lineConfig);
    } catch {
        window.myLine.destroy();
        window.myLine = new Chart(lineCtx, lineConfig);
    }
}

function draw_hourly_graph(datasets) {
    draw_graph_header(datasets, 'hourly');
    const scatterConfig = {
        type: 'scatter',
        data: {
            datasets: datasets
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
    const scatterCtx = document.getElementById('scatter');
    try {
        window.myScatter = new Chart(scatterCtx,  scatterConfig);
    } catch {
        window.myScatter.destroy();
        window.myScatter = new Chart(scatterCtx, scatterConfig);
    }
}

function fill_code_lines_color(group_color_obj) {
    const user_coding_lines = document.querySelectorAll(".user-coding-lines");
    user_coding_lines.forEach(line_div => {
        const github_id = line_div.getAttribute("github_id");
        line_div.style.backgroundColor = group_color_obj[github_id];
    })
}

function draw_group_graph(group_id) {
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/group/graph-data'
        ,method: 'POST'
        ,async: true
        ,data: {'group_id': group_id}
        ,success: function (data) {
            group_color_obj = generateRandomColorObject(data.member_list);
            calendar_data = data.calendar_data;
            const grass_data = get_grass_datasets(calendar_data);
            const last_date = Object.keys(grass_data).sort().reverse()[0];
            const last_tech_data = { [last_date]: grass_data[last_date] };
            const monthly_datasets = get_datasets(calendar_data, 'monthly', group_color_obj);
            const weekly_datasets = get_datasets(calendar_data, 'weekly', group_color_obj);
            const hourly_datasets = get_datasets(calendar_data, 'hourly', group_color_obj);
            show_rainbow_calendar(grass_data);
            show_group_total_lines(last_tech_data, true);
            draw_monthly_graph(monthly_datasets);
            draw_weekly_graph(weekly_datasets);
            draw_hourly_graph(hourly_datasets);
            fill_code_lines_color(group_color_obj);
        }
    });
}

function draw_user_graph(github_id) {
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: `/${github_id}/get`
        ,method: 'POST'
        ,data: {'github_id': github_id}
        ,async: true
        ,success: function (data) {
            const calendar_data = data.calendar_data;
            const grass_data = get_grass_datasets(calendar_data);
            const last_date = Object.keys(grass_data).sort().reverse()[0];
            const last_tech_data = { [last_date]: grass_data[last_date] };
            show_rainbow_calendar(grass_data);
            show_group_total_lines(last_tech_data, true);
        }
    });
}
