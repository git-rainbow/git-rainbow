let calendar_commits;
let last_tech_data;

function show_profile_calendar(commit_data){
    calendar_commits = commit_data;
    let today = moment().endOf('day').toDate();
    let yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    let chartData = d3.time.days(yearAgo, today).map(function (dateElement) {
        return {
                date: dateElement,
                count:(calendar_commits[moment(dateElement).format('YYYY-MM-DD')] ? calendar_commits[moment(dateElement).format('YYYY-MM-DD')] : 0)
            };
        });
    let calendar = profile_calendar()
        .data(chartData)
        .selector('.git-table')
        .tooltipEnabled(true)
        .colorRange(['#c6e48b', '#196127'])
    calendar();
};

function save_global_var(tech_data){
    last_tech_data = tech_data;
}

function highlight_card_tech(event, tech_name, tech_color) {
    let cards = document.querySelectorAll('.tech_card');
    let cells = document.querySelectorAll(".day-cell");
    let tech_graphs = document.querySelectorAll(".tech_graph");

    if (event.currentTarget.getAttribute('selected') == 'true') {
        event.currentTarget.setAttribute('selected', 'false');
        let selected_list = Array.from(cards).map(card => card.getAttribute('selected'));
        if (!selected_list.includes('true')){
            cards.forEach(card => {
                card.setAttribute('style', 'opacity:1;');
            });
        }
        for (let cell of cells) {
            cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            cell.setAttribute('opacity', 1);
        }
        for (let tech_graph of tech_graphs) {
            tech_graph.setAttribute('style', 'opacity:1;');
        }
    } else {
        for (let card of cards) {
            card.setAttribute('selected', 'false');
            card.setAttribute('style', 'opacity:0.2;');
        }

        event.currentTarget.setAttribute('selected', 'true');
        event.currentTarget.setAttribute('style', 'opacity:1;');
        
        for (let cell of cells) {
            let date = cell.getAttribute('date');
            if (calendar_commits[date]?.[tech_name]){
                cell.setAttribute('opacity', 1);
                cell.setAttribute('fill', tech_color);
            } else {
                cell.setAttribute('opacity', 0.2);
                cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            }
        }
        for (let tech_graph of tech_graphs) {
            if (tech_graph.id == `tech_${tech_name}`){
                tech_graph.setAttribute('style', 'opacity:1;');
            } else{
                tech_graph.setAttribute('style', 'opacity:0.2;');
            }
        }
    }
}

function make_tech_lines(calendar_commits){
    const totals = {};
    for (const date in calendar_commits) {
      const technologies = calendar_commits[date];
      for (const technology in technologies) {
        const count = technologies[technology];
        if (totals[technology]) {
          totals[technology] += count;
        } else {
          totals[technology] = count;
        }
      }
    }
    const totalsArray = Object.entries(totals);
    totalsArray.sort((a, b) => b[1] - a[1]);
    let new_tech_lines_data  = Object.fromEntries(totalsArray);


    let new_total_lines = 0;
    for (const tech in new_tech_lines_data) {
    new_total_lines += new_tech_lines_data[tech];
    }
    return {new_tech_lines_data, new_total_lines};
}

function show_total_lines(commit_data){
    let tagArea = document.getElementById('tech_grahp');
    tagArea.innerHTML='';
    let lines_data = make_tech_lines(commit_data)
    let new_tech_lines_data = lines_data['new_tech_lines_data']
    let new_total_lines = lines_data['new_total_lines']
    for (const tech in new_tech_lines_data) {
        const tech_line = new_tech_lines_data[tech];
        let percentage = Math.round((tech_line / new_total_lines) * 100);
        if (percentage < 20){
            percentage = 13
        }
        let tech_info = `<tr class="text-gray-700 dark:text-gray-400 tech_graph" id="tech_${tech}">
          <td class="px-3 py-3" style="width:150px;border:none!important">
            <div class="flex items-center text-sm">
              <div class="relative hidden w-8 h-8 mr-3 rounded-full md:block" style="min-width:40px;">
                <img class="object-cover w-full h-full rounded-full"
                     src="https://git-rainbow.com/static/img/${tech.toLowerCase()}.png" alt="" loading="lazy">
                <div class="absolute inset-0 rounded-full shadow-inner" aria-hidden="true"></div>
              </div>
              <div class="ranking-ellipsis">
                <p class="font-semibold">${tech}</p>
              </div>
            </div>
          </td>
          <td style="border:none!important">
            <div class="rounded-full" style="background-color:lightgray; width: 97%">
              <div
                class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                style="width:  ${percentage.toFixed(2)}%; background-color: ${color_choice(tech, 1)};"><p style="color:white">${new_tech_lines_data[tech].toLocaleString()} lines</p></div>
            </div>
          </td>
        </tr>`;
        tagArea.innerHTML += tech_info;
    }
}

function highlight_cell(event, commits=null){
    let cells = document.querySelectorAll(".day-cell");

    if (event.currentTarget.getAttribute('selected') == 'true') {
        event.currentTarget.setAttribute('selected', 'false');
        let selected_cell_list = Array.from(cells).map(cell => cell.getAttribute('selected'));
        if (!selected_cell_list.includes('true')){
            cells.forEach(cell => {
                cell.setAttribute('style', 'opacity:1;');
            });
        }
        for (let cell of cells) {
            cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            cell.setAttribute('opacity', 1);
        }
        show_total_lines(last_tech_data);

    } else {
        for (let cell of cells) {
            cell.setAttribute('selected', 'false');
            cell.setAttribute('style', 'opacity:0.2;');
        }
        event.currentTarget.setAttribute('selected', 'true');
        event.currentTarget.setAttribute('style', 'opacity:1;');
        show_total_lines(commits);
    }
}
