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

function generateRandomColorArray(count) {
    const colorArray = [];
    for (let i = 0; i < count; i++) {
        const randomColor = getRandomColor();
        colorArray.push(randomColor);
    }
    return colorArray;
}

function draw_monthly_graph(commit_data) {
    let month_key = {1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December'};
    let monthly_data = {};
    for (const date_info in commit_data) {
        const date = new Date(date_info);
        const month_name = month_key[date.getMonth()+1];
        for (const tech_name in commit_data[date_info]){
            for (const repo_url in commit_data[date_info][tech_name]['commit_repo']) {
                for (const commit_info of commit_data[date_info][tech_name]['commit_repo'][repo_url]){
                    if (!monthly_data[commit_info['github_id']]){
                        monthly_data[commit_info['github_id']] = {};
                    }
                    if (!monthly_data[commit_info['github_id']][month_name]) {
                        monthly_data[commit_info['github_id']][month_name] = commit_info['lines'];
                    } else {
                        monthly_data[commit_info['github_id']][month_name] += commit_info['lines'];
                    }
                    monthly_data[commit_info['github_id']]['avatar_url'] = commit_info['avatar_url'];
                }
            }
        }
    }

    let user_info_list = [];
    for (let user in monthly_data){
        let user_info_obj = {};
        user_info_obj[user] = [];
        user_info_obj['avatar_url'] = monthly_data[user]['avatar_url'];
        for (let month in month_key){
            let month_name = month_key[month];
            if (monthly_data[user][month_name]) {
                user_info_obj[user].push(monthly_data[user][month_name]);
            } else {
                user_info_obj[user].push(0);
            }
        }
        user_info_list.push(user_info_obj);
    }

    let backgroundColorList = generateRandomColorArray(user_info_list.length);
    let datasets = [];
    let inserted_tag = '';
    for (let i=0; i < user_info_list.length; i++){
        let info_obj = {};
        for (user in user_info_list[i]){
            info_obj['label'] = user;
            info_obj['data'] = user_info_list[i][user];
            info_obj['backgroundColor'] = backgroundColorList[i];
            break;
        }
        datasets.push(info_obj);
        inserted_tag += `
          <div class="flex items-center">
            <span class="inline-block w-4 h-3 mr-1" style="background-color:${backgroundColorList[i]}"></span>
            <img class="object-cover w-full h-full rounded-full mx-2 my-2" src="${user_info_list[i]['avatar_url']}" style="width:32px;height:32px">
            <span>${user}</span>
          </div>
        `;
    }

    let bar_graph_div = document.querySelector("#bar_graph_div");
    bar_graph_div.innerHTML = inserted_tag;

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
    window.myBar = new Chart(barsCtx, barConfig);
}
