var is_random_img = true;

function show_group_img(){
    let group_img_file = document.querySelector('#group_img').files[0];
    document.querySelector("#basic_group_img").src = URL.createObjectURL(group_img_file);
    is_random_img = false;
}

function cal_len(event, sharp_id){
    let letter_len = event.currentTarget.value.length;
    let current_length = document.querySelector(sharp_id);
    current_length.innerText = letter_len;
}

function toggle_private_public(event) {
    let join_code_input = document.querySelector('#join_code_input');
    if (event.currentTarget.value=='private'){
        join_code_input.disabled=false;
        join_code_input.classList.remove('bg-gray-100');
    } else {
        join_code_input.disabled=true;
        join_code_input.classList.add('bg-gray-100');
        join_code_input.value='';
    }
}

function remove_repo(event){
    event.currentTarget.parentNode.remove();
}

function add_repo_input(){
    let repo_input_box = document.querySelector("#repo_input_box");
    let repo_input_values = Array.from(repo_input_box.getElementsByTagName("input")).map(input => input.value);
    let repo_input = `<div class="relative focus-within:text-purple-500 repo_input_div"
                          style="width:500px; margin-left:2px">
                        <input class="block w-full mt-1 text-sm dark:border-gray-600 dark:bg-gray-700 focus:border-purple-400 focus:outline-none focus:shadow-outline-purple dark:text-gray-300 dark:focus:shadow-outline-gray form-input">
                      </div>`;
    repo_input_box.innerHTML += repo_input;
    for (let i=0; i < repo_input_values.length; i++){
      repo_input_box.children[i].getElementsByTagName("input")[0].value = repo_input_values[i];
    }
}

function check_group_name(css_selector){
    let group_name = document.querySelector(css_selector);
    let error_msg = gettext('There is no group name');
    let name_pass = true;
    if (group_name.value == ''){
        name_pass = false;
        group_name.classList.add('border-red-600');
        let error_tag = group_name.parentNode.querySelector('.text-red-600');
        if (error_tag){
            error_tag.innerText = gettext('There is no group name');
        } else {
            group_name.parentNode.innerHTML += `<div class="text-xs text-red-600 dark:text-red-400">${error_msg}</div>`;
        }
        return {name_pass, 'group_name':group_name.value};
    }
    group_name.classList.remove('border-red-600');
    group_name.parentNode.querySelector('.text-red-600')?.remove();
    return {name_pass, 'group_name': group_name.value};
}

function check_repo_urls(css_selector, error_url=null){
    let pass = true;
    let repo_input_div_list = document.querySelectorAll(css_selector);
    let repo_url_list = [];
    for (let repo_input_div of repo_input_div_list){
        let repo_input = repo_input_div.getElementsByTagName("input")[0];
        let repo_url = repo_input.value;
        repo_input_div.querySelector('.text-red-600')?.remove();
        repo_input_div.getElementsByTagName("input")[0].classList.remove('border-red-600');
        let error_msg;
        if (repo_url != '' && (!repo_url.startsWith("https://") || !repo_url.endsWith(".git") || error_url == repo_url)) {
            if (!repo_url.startsWith("https://")) {
                error_msg = gettext('Your repository did not start with "https://"');
            } else if (!repo_url.endsWith(".git")) {
                error_msg = gettext('Your repository did not end with ".git"');
            } else if (error_url == repo_url) {
                error_msg = `${gettext('You need to check this url')}`;
            }
            repo_input_div.innerHTML += `<div class="text-xs text-red-600 dark:text-red-400">${error_msg}</div>`;
            repo_input_div.getElementsByTagName("input")[0].classList.add('border-red-600');
            pass = false;
        }
        repo_input_div.getElementsByTagName("input")[0].value = repo_url;
        repo_url_list.push(repo_url);
    }
    return {pass, repo_url_list};
}

function refresh_img(){
    is_random_img = true;
    let refresh_span = document.querySelector('#refresh_span');
    let rotating_img = document.querySelector('#rotating_img');
    refresh_span.classList.add('hidden');
    rotating_img.classList.remove('hidden');
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/group/refresh-img'
        ,method: 'POST'
        ,async: true
        ,success: function (data) {
            document.querySelector("#basic_group_img").src = `/${data.file_path}`
            refresh_span.classList.remove('hidden');
            rotating_img.classList.add('hidden');
        }
    });
}

function create_group(){
    let {name_pass, group_name} = check_group_name('#group_name_input');
    if (name_pass == false){
        return;
    }
    let {pass, repo_url_list} = check_repo_urls('.repo_input_div');
    if (pass == false){
        return;
    }
    let formData = new FormData();
    let account_type = document.querySelector('input[name="accountType"]:checked').value;
    if (account_type=='private') {
        let join_code = document.querySelector('#join_code_input').value;
        formData.append('join_code', join_code);
    }
    let tags = document.querySelector('input[name="tags"]');
    let topic_error_msg = document.querySelector('#topic_error_msg');
    if (!tags.value){
        topic_error_msg.classList.remove('hidden');
        return;
    } else {
        topic_error_msg.classList.add('hidden');
    }
    formData.append('account_type', account_type);
    formData.append('is_random_img', is_random_img);
    if (is_random_img) {
        formData.append('group_img', document.querySelector("#basic_group_img").src);
    } else {
        formData.append('group_img', document.querySelector('#group_img').files[0]);
    }
    formData.append('group_name', group_name);
    formData.append('description', document.querySelector('#description_input').value);
    formData.append('topic_list', JSON.stringify(Array.from(JSON.parse(tags.value), obj => obj.value)));
    formData.append('repo_url_list', JSON.stringify(repo_url_list));

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/group/new'
        ,method: 'POST'
        ,processData: false
        ,contentType:false
        ,enctype:'multipart/form-data'
        ,async: false
        ,data: formData
        ,success: function (data) {
            if (data.status == 'success'){
                location.href = '/group/list';
            } else{
                if (data.error_url){
                    check_repo_urls('.repo_input_div', data.error_url);
                } else {
                    alert(data.reason);
                }
            }
        }
    });
}

function _group_update(group_id){
    let data = {
        "group_id": group_id,
    }
    let waiting = true;
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: '/group/update'
        ,method: 'POST'
        ,data: data
        ,async: false
        ,success: function (data) {
            if (data.status == 'fail'){
                alert(data.reason);
                waiting = false;
            } else if (data.status == 'completed'){
                waiting = false;
            }
        }
        ,error: function (data) {
            waiting = false;
            alert(gettext("error occured"));
        }
    });
    return waiting;
}

function group_update(group_id){
    var interval = setInterval(function () {
        let waiting = _group_update(group_id);
        if (waiting == false) {
            clearInterval(interval);
        }
    }, 3000);
}

function show_rainbow_calendar(commit_data){
    calendar_commits = commit_data;
    let today = moment().endOf('day').toDate();
    let yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    let chartData = d3.time.days(yearAgo, today).map(function (dateElement) {
        return {
                date: dateElement,
                count:(calendar_commits[moment(dateElement).format('YYYY-MM-DD')] ? calendar_commits[moment(dateElement).format('YYYY-MM-DD')] : 0)
            };
        });
    let calendar = rainbow_calendar()
        .data(chartData)
        .selector('.git-table')
        .tooltipEnabled(true)
        .colorRange(['#c6e48b', '#196127'])
    calendar();
};

function show_total_lines(commit_data, is_reset=false, specific_tech){
    let tagArea = document.getElementById('tech_grahp');
    if (is_reset){
        tagArea.innerHTML = '';
        show_more_index = 0;
        show_more_btn.classList.remove('hidden');
    } else {
        show_more_index += 1;
    }
    current_data = commit_data;
    let full_sort_recent_list = Object.entries(commit_data).reverse();
    let sort_recent_list = full_sort_recent_list.slice(show_more_index*3, show_more_index*3+3)
    let new_show_more_btn = document.querySelector("#show_more_btn")
    if (full_sort_recent_list.length <= 3*show_more_index+3){
        new_show_more_btn.classList.add('hidden');
    } else if(new_show_more_btn.classList.contains('hidden')) {
        new_show_more_btn.classList.remove('hidden');
        new_show_more_btn.addEventListener('click', function(){
            show_total_lines(current_data, false, true)
        });
    }

    if (specific_tech && !show_more_index) {
        var k = Object.keys(commit_data)[0];
        var tech = Object.keys(commit_data[k])[0];

        tagArea.innerHTML +=
                `<div class="flex items-center text-sm mb-2">
                  <div style="width:60px;margin-right:20px">
                    <img src="/static/img/${tech_name(tech)}.png" onerror="this.onerror=null; this.src='/static/img/none3.png';" loading="lazy">
                  </div>
                  <div style="width:60px">
                    <p class="font-semibold">${tech}</p>
                  </div>
                </div>`
    }

    sort_recent_list.forEach(item => {
        let date = item[0];
        let tech_data = item[1];
        let dateObj = new Date(date);
        let day = dateObj.getDate();
        let month = dateObj.toLocaleString('en-US', {month: 'long'});
        let year = dateObj.getFullYear();
        let date_info = `
        <h3 class="h6 pr-2 py-1 border-bottom mb-3" style="height: 14px; border: none;">
        <span class="pl-2 pr-3 text-sm font-semibold" style="background-color:white">${month} ${day}<span style="font-weight: normal;">, ${year}</span>
        </span>
        </h3>`

        tagArea.innerHTML += date_info;

        Object.entries(tech_data).forEach(function ([tech, lines]) {
            let tech_info = `
            <div class="text-gray-700 dark:text-gray-400 tech_graph" style="display:flex; border: none;">`
            if (!specific_tech) {
                tech_info += `
              <div class="px-3 py-3">
                <div class="flex items-center text-sm">
                  <div style="width:60px;margin-right:20px">
                    <img src="/static/img/${tech_name(tech)}.png" onerror="this.onerror=null; this.src='/static/img/none3.png';" loading="lazy">
                  </div>
                  <div style="width:60px">
                    <p class="font-semibold">${tech}</p>
                  </div>
                </div>
              </div>`
            }
            tech_info += `
              <div class="px-3 py-3" style="width: 100%; display: flex; justify-content:center; align-items:center;">
                <div class="rounded-full" style="background-color:lightgray; width: 95%;">
                  <div
                    class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full tech_lines" lines=${lines} tech=${tech}><p style="color:white">${lines.toLocaleString()} lines</p>
                  </div>
                </div>
              </div>
            </div>`;
            tagArea.innerHTML += tech_info;
        });
    });

    let current_tech_lines_divs = document.querySelectorAll(".tech_lines");
    let line_count = 0;
    let line_sum = 0;
    for (let current_line_div of current_tech_lines_divs){
        let line = parseInt(current_line_div.getAttribute('lines'));
        if (line < 10000){
            line_sum += line;
            line_count += 1;
        }
    }
    let new_full_line = line_sum / line_count * 2
    for (let current_line_div of current_tech_lines_divs){
        let line = parseInt(current_line_div.getAttribute('lines'));
        let new_line_percent = line/new_full_line*100;
        if (new_line_percent >= 100) {
            new_line_percent = 99;
        } else if (new_line_percent <= 10){
            new_line_percent = 10;
        }
        current_line_div.setAttribute('style', `width:${new_line_percent}%; background-color:${github_calendar_colors(current_line_div.getAttribute('tech'), 1)};`);
    }
}

function show_group_total_lines(commit_data, is_reset=false, specific_tech){
    let tagArea = document.getElementById('tech_grahp');
    if (is_reset){
        tagArea.innerHTML = '';
        show_more_index = 0;
        show_more_btn.classList.remove('hidden');
    } else {
        show_more_index += 1;
    }
    current_data = commit_data;
    let full_sort_recent_list = Object.entries(commit_data).reverse();
    let sort_recent_list = full_sort_recent_list.slice(show_more_index*3, show_more_index*3+3)
    let new_show_more_btn = document.querySelector("#show_more_btn")
    if (full_sort_recent_list.length <= 3*show_more_index+3){
        new_show_more_btn.classList.add('hidden');
    } else if(new_show_more_btn.classList.contains('hidden')) {
        new_show_more_btn.classList.remove('hidden');
        new_show_more_btn.addEventListener('click', function(){
            show_total_lines(current_data, false, true)
        });
    }

    if (specific_tech && !show_more_index) {
        var k = Object.keys(commit_data)[0];
        var tech = Object.keys(commit_data[k])[0];

        tagArea.innerHTML +=
                `<div class="flex items-center text-sm mb-2">
                  <div style="width:60px;margin-right:20px">
                    <img src="/static/img/${tech_name(tech)}.png" onerror="this.onerror=null; this.src='/static/img/none3.png';" loading="lazy">
                  </div>
                  <div style="width:60px">
                    <p class="font-semibold">${tech}</p>
                  </div>
                </div>`
    }

    sort_recent_list.forEach(item => {
        let date = item[0];
        let tech_data = item[1];
        let dateObj = new Date(date);
        let day = dateObj.getDate();
        let month = dateObj.toLocaleString('en-US', {month: 'long'});
        let year = dateObj.getFullYear();
        let date_info = `
        <h3 class="h6 pr-2 py-1 border-bottom mb-3" style="height: 14px; border: none;">
        <span class="pl-2 pr-3 text-sm font-semibold" style="background-color:white">${month} ${day}<span style="font-weight: normal;">, ${year}</span>
        </span>
        </h3>`

        tagArea.innerHTML += date_info;

        Object.entries(tech_data).forEach(function ([tech, tech_commit_data]) {
            let tech_info = `
            <div class="text-gray-700 dark:text-gray-400 tech_graph" style="display:flex; border: none;">`
            if (!specific_tech) {
                tech_info += `
                <div class="px-3 py-3">
                  <div class="flex items-center text-sm">
                    <div style="width:60px;margin-right:20px">
                      <img src="/static/img/${tech_name(tech)}.png" onerror="this.onerror=null; this.src='/static/img/none3.png';" loading="lazy">
                    </div>
                    <div style="width:60px">
                      <p class="font-semibold">${tech}</p>
                    </div>
                  </div>
                </div>
                  <div class="pt-4 px-3" style="width: 100%;">
                    <div class="py-3 flex" style="justify-content:center; align-items:center;">
                      <div class="rounded-full" style="background-color:lightgray; width: 95%;">
                        <div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full tech_lines" lines=${tech_commit_data.total_lines} tech=${tech}>
                          <p style="color:white">${tech_commit_data.total_lines.toLocaleString()} lines</p>
                        </div>
                      </div>
                    </div>
                    <div class="ml-4 mb-4">
                      <div class="flex">
                        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="mt-1">
                          <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
                        </svg>`
                let repo_cnt = 0;
                let commit_cnt = 0;
                let commit_data_tags = ``;
                    Object.entries(tech_commit_data.commit_repo).forEach(function ([repo_url, commit_hash]) {
                        let slice_repo_url = repo_url.slice(0,-4)
                        let name_with_owner = new URL(slice_repo_url).pathname
                        repo_cnt += 1
                        commit_cnt += commit_hash.length
                        commit_data_tags += `<div class="mt-2 flex">
                                        <a class="text-blue-500 mr-3"
                                          href="${slice_repo_url}">${name_with_owner.slice(1)}</a>
                                        <p class="text-gray-400">${commit_hash.length} commits</p>
                                       </div>`
                    })
                    tech_info += `
                    <span class="ml-2">Created ${commit_cnt} commits in ${repo_cnt} repositories</span>
                  </div>
                  <div class="ml-4">` + commit_data_tags +
                 `</div>
                </div>
              </div>`;
            } else {
                tech_info +=`
                  <div class="px-3" style="width: 100%;">
                    <div class="py-3 flex" style="justify-content:center; align-items:center;">
                      <div class="rounded-full" style="background-color:lightgray; width: 95%;">
                        <div class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full tech_lines" lines=${tech_commit_data.total_lines} tech=${tech}>
                          <p style="color:white">${tech_commit_data.total_lines.toLocaleString()} lines</p>
                        </div>
                      </div>
                    </div>`
                let repo_cnt = 0;
                let commit_cnt = 0;
                let commit_data_tags = ``;
                Object.entries(tech_commit_data.commit_repo).forEach(function ([repo_url, commit_hash]) {
                    let slice_repo_url = repo_url.slice(0,-4)
                    let name_with_owner = new URL(slice_repo_url).pathname
                    repo_cnt += 1
                    commit_cnt += commit_hash.length
                    commit_data_tags += `<div class="mt-2 flex">
                                    <a class="text-blue-500 mr-3"
                                      href="${slice_repo_url}">${name_with_owner.slice(1)}</a>
                                    <p class="text-gray-400">${commit_hash.length} commits</p>
                                   </div>`
                })
                tech_info += `
                <div class="ml-4 mb-4">
                  <div class="flex">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="mt-1">
                      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
                    </svg>
                    <span class="ml-2">Created ${commit_cnt} commits in ${repo_cnt} repositories</span>
                  </div>
                  <div class="ml-4">` + commit_data_tags
                    tech_info += `
                  </div>
                </div>
              </div>
            </div>`;
            }
            tagArea.innerHTML += tech_info;
        });
    });

    let current_tech_lines_divs = document.querySelectorAll(".tech_lines");
    let line_count = 0;
    let line_sum = 0;
    for (let current_line_div of current_tech_lines_divs){
        let line = parseInt(current_line_div.getAttribute('lines'));
        if (line < 10000){
            line_sum += line;
            line_count += 1;
        }
    }
    let new_full_line = line_sum / line_count * 2
    for (let current_line_div of current_tech_lines_divs){
        let line = parseInt(current_line_div.getAttribute('lines'));
        let new_line_percent = line/new_full_line*100;
        if (new_line_percent >= 100) {
            new_line_percent = 99;
        } else if (new_line_percent <= 10){
            new_line_percent = 10;
        }
        current_line_div.setAttribute('style', `width:${new_line_percent}%; background-color:${github_calendar_colors(current_line_div.getAttribute('tech'), 1)};`);
    }
}

function highlight_group_card_tech(event, tech_name, tech_color) {
    let cards = document.querySelectorAll('.tech_card');
    let cells = document.querySelectorAll(".day-cell");
    for (let cell of cells) {
            cell.setAttribute('selected', 'false');
            cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            cell.setAttribute('style', 'opacity:1;');
        }

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
            cell.setAttribute('style', 'opacity:1;');
        }
        show_group_total_lines(last_tech_data, true, true);
    } else {
        for (let card of cards) {
            card.setAttribute('selected', 'false');
            card.setAttribute('style', 'opacity:0.2;');
        }

        event.currentTarget.setAttribute('selected', 'true');
        event.currentTarget.setAttribute('style', 'opacity:1;');
        let tech_commit_data = {}
        for (let cell of cells) {
            let date = cell.getAttribute('date');
            if (calendar_commits[date]?.[tech_name]){
                tech_commit_data[date] = {}
                tech_commit_data[date][tech_name] = calendar_commits[date][tech_name]
                cell.setAttribute('style', 'opacity:1;');
                cell.setAttribute('fill', tech_color);
            } else {
                cell.setAttribute('style', 'opacity:0.2;');
                cell.setAttribute('fill', cell.getAttribute('origin-fill'));
            }
        }
        show_group_total_lines(tech_commit_data, true, true);
    }
}

function highlight_group_cell(event, commits=null){
    let cells = document.querySelectorAll(".day-cell");
    let cards = document.querySelectorAll('.tech_card');
    for (let card of cards) {
        card.setAttribute('selected', 'false');
        card.setAttribute('style', 'opacity:1;');
    }

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
        show_group_total_lines(last_tech_data, true, false);

    } else {
        for (let cell of cells) {
            cell.setAttribute('selected', 'false');
            cell.setAttribute('style', 'opacity:0.2;');
        }
        event.currentTarget.setAttribute('selected', 'true');
        event.currentTarget.setAttribute('style', 'opacity:1;');
        show_group_total_lines(commits, true, false);
    }
}

var calendar_data;

function highlight_group_member(event) {
    const member_card_list = document.querySelectorAll(".member_card");
    const tech_card_list = document.querySelectorAll(".tech_card");
    const target = event.currentTarget;
    let is_target_selected = target.getAttribute('selected');
    if (is_target_selected=='false') {
        target.setAttribute('selected', 'true');
        target.setAttribute('style', `border: 2px ${group_color_obj[target.getAttribute('github_id')]} solid;`);
    } else {
        target.setAttribute('selected', 'false');
        target.setAttribute('style', 'border: none;');
    }
    let selected_list = Array.from(member_card_list).map(card => {
        if (card.getAttribute('selected') == 'true'){
            return card.getAttribute('github_id');
        }
    }).filter(item => item != undefined);

    let data_object;
    if (selected_list.length == 0) {
        data_object = get_grass_datasets(calendar_data);
        show_rainbow_calendar(data_object);
        tech_card_list.forEach(each => {
            each.classList.remove('hidden');
            each.setAttribute('style', 'opacity: 1;');
            each.setAttribute('selected', 'false');
        })
    } else {
        data_object = get_grass_datasets(calendar_data, selected_list);
        show_rainbow_calendar(data_object);
        const tech_set = new Set();
        Object.values(data_object).forEach(tech_data => {
            Object.keys(tech_data).forEach(tech_name => tech_set.add(tech_name));
        });
        tech_card_list.forEach(each => {
            if (tech_set.has(each.getAttribute('tech_name'))) {
                each.classList.remove('hidden');
            } else {
                each.classList.add('hidden');
            }
            each.setAttribute('style', 'opacity: 1;');
            each.setAttribute('selected', 'false');
        });
    }
    const last_date = Object.keys(data_object).sort().reverse()[0];
    const last_tech_data = { [last_date]: data_object[last_date] };
    show_group_total_lines(last_tech_data, true);
}

function group_join(group_id, is_login){
    if (!is_login){
        return alert('Login is required')
    }
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: '/group/'+group_id+'/join'
        ,method: 'POST'
        ,async: false
        ,success: function (data) {
            let status = data.status
            if (status == 'fail') {
                alert(data.reason);
            } else {
                location.reload();
            }
        }
    });
}

var show_more_index = 0;
var current_data;
var show_more_btn = document.querySelector("#show_more_btn");
show_more_btn?.addEventListener('click', function(){
    show_group_total_lines(current_data, false, true)
});

function show_github_id(event, github_id){
    let desc_box = document.querySelector("#desc_div");
    if (event.type == 'mousemove') {
        desc_box.classList.remove('hidden');
    } else if (event.type == 'mouseleave') {
        desc_box.classList.add('hidden');
        return;
    }
    desc_box.innerHTML = github_id;
    desc_box.setAttribute('style', `left: ${event.pageX-desc_box.clientWidth/2}px; top: ${event.pageY-desc_box.clientHeight-20}px`);
}

function toggle_arrow(arg) {
    const arrow_type = document.querySelector(`.${arg}`);
    const arrow_type_btn = document.querySelector(`.${arg}-btn`);
    arrow_type.classList.toggle(`${arg}-box`);
    arrow_type_btn.classList.toggle("turn-half");
}
