let calendar_commits;

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


function highlight_card_tech(event, tech_name) {
    let cards = document.querySelectorAll('.tech_card');
    let cells = document.querySelectorAll(".day-cell");

    if (event.currentTarget.getAttribute('selected') == 'true') {
        event.currentTarget.setAttribute('selected', 'false');
        for (let cell of cells) {
            cell.setAttribute('opacity', 1);
        }
    } else {
        for (let card of cards) {
            card.setAttribute('selected', 'false');
        }

        event.currentTarget.setAttribute('selected', 'true');
        
        for (let cell of cells) {
            let date = cell.getAttribute('date');
            if (calendar_commits[date]?.[tech_name]){
                cell.setAttribute('opacity', 1);
            } else {
                cell.setAttribute('opacity', 0.2);
            }
        }
    }
}
