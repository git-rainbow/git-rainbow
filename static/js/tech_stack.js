function tech_name(tech) {
    let tech_name = tech.toLowerCase();
    tech_name = tech_name.replace('#', '_sharp');
    return tech_name
}

function analyze_developer(github_id, action, is_with_token) {
    let data = {
        'github_id': github_id,
        'action': action
    }
    if (is_with_token){
        let token = document.querySelector("#token_input").value;
        if (token == ''){
            alert(gettext('Please input your token'));
            return;
        }
        if (!token.startsWith('ghp')){
            alert(gettext('It is not starts with "ghp"'));
            return;
        }
        if (token.length != 40){
            alert(gettext('Token length is invalid'));
            return;
        }
        data['ghp_token'] = token;
    }
    let close_btn = document.querySelector("#close_btn");
    if (close_btn)
        close_btn.click();
    let updateBtn = document.querySelector("#update_btn_img");
    if (updateBtn){
        updateBtn.classList.add("rotate-img");
    }
    var interval = setInterval(function () {
        let waiting = _analyze_developer(data);
        if (waiting == false) {
            clearInterval(interval);
            if (updateBtn){
                updateBtn.classList.remove("rotate-img");
            }
        }
    }, 3000);
}


function save_public_repo(){
    let repo_url = document.querySelector("#public_repo_input").value;
    if (repo_url == ''){
        alert(gettext('Please input your public repository'));
        return;
    }
    if (!repo_url.startsWith("https://")){
        alert(gettext('Your repository did not start with "https://"'));
        return;
    }
    if (!repo_url.endsWith(".git")){
        alert(gettext('Your repository did not end with ".git"'));
        return;
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: window.location.pathname + '/save/repo'
        ,method: 'POST'
        ,async: false
        ,data: {'repo_url': repo_url}
        ,success: function (data) {
            if (data.status == 200) {
                alert(gettext("Your repository url has been saved"));
                location.reload();
            } else if(data.reason) {
                alert(data.reason);
            } else {
                alert(gettext("Invalid URL"));
            }
        }
    });
}

function _analyze_developer(data) {
    let waiting = true;
    const github_id = data['github_id'];
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: `/${github_id}/update`
        ,method: 'POST'
        ,data: data
        ,async: false
        ,success: function (data) {
            if (data.status == 'completed') {
                waiting = false;
                // Don't change template in ranking page - start
                const ranking_regex = /^\/ranking(\/[^/]+)?$/;
                if (ranking_regex.test(location.pathname)){
                    return waiting;
                }
                // Don't change template in ranking page - finish
                $("#under_header").html(data.content);
                draw_user_graph(github_id);
            } else if(data.status == 'fail') {
                waiting = false;
                alert(`status: fail, reaseon: ${data.reason}`);
            }
        },
        error: function (data) {
            waiting = false;
            alert(gettext("error occured"));
        }
    });
    return waiting;
}

function check_analysis_updating(github_id, status){
    if(status == 'fail') {
        alert(gettext("Analysis failed"));
    } else if (status == 'progress') {
        analyze_developer(github_id, 'update');
    } 
}

function is_valid_githubuser(github_id){
    let is_valid = false;
    let error_message;
    const white_space_regex = new RegExp(/\s+/);
    if (white_space_regex.test(github_id) || github_id == '') {
        error_message = gettext('Please check Github ID');
        return {'is_valid': is_valid, 'error_message': error_message};
    } else {
        $.ajax({
        url: 'https://api.github.com/users/' + github_id
        , headers:{"Accept": "application/vnd.github+json"}
        , method: 'GET'
        , async: false
        , dataType: "Json"
        , success: function (data) {
            if(data.type == 'User'){
                is_valid = true;
            } else {
                error_message =  gettext("Please input personal GitHub ID");
            }}
        , error: function (data) {
            error_message =  gettext("Please check your GitHub ID");
        }});
        return {'is_valid': is_valid, 'error_message': error_message};
    }
}

function analyze_github_user(){
    if (event.type !== "click" && event.key !== 'Enter'){
        return;
    }
    let github_id = document.querySelector('#input_github_id').value;
    let {is_valid, error_message} = is_valid_githubuser(github_id);
    if (!is_valid){
        document.querySelector('#error_text').textContent = error_message;
        return;
    }
    window.location.href = `/${github_id}`;
}

function copy_svg_url(github_id){
    let svg_url = new URL(window.document.location.href).origin + `/${github_id}/svg`;
    let textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.value = svg_url;
    textarea.select();
    window.navigator.clipboard.writeText(textarea.value).then(() => {
        alert(gettext("Copied!"));
        window.open(svg_url, "_blank");
    });
    document.body.removeChild(textarea);
}

function go_to_login() {
    let confirmed = confirm(gettext('This service is login required. \n Will you login?'));
    if (confirmed){
        let now_path = window.location.pathname;
        let query_str = (window.location.search).slice(1);
        let next_location = `?next=${now_path}&${query_str}`;
        location.href = '/login/github'+next_location;
    }
}

function show_desc(event){
    let desc_box = document.querySelector("#desc_div");
    if (event.type == 'mousemove') {
        desc_box.classList.remove('hidden');
    } else if (event.type == 'mouseleave') {
        desc_box.classList.add('hidden');
        return;
    }

    let target = event.currentTarget;
    let desc_object = {
        'code_crazy_btn':gettext('How much crazy about coding in the last year (%)'),
        'github_link':gettext('Github profile page'),
        'svg_link':gettext('Copy embeding link for README or Notion'),
        'update_btn':gettext('Update current work'),
        'rank_rank':gettext('Ranking of developers actively coded over the past year<br>(Code Crazy % X Code Lines)'),
        'rank_code_crazy':gettext('How much crazy about coding this tech in the last year<br>(100 days: 100%, 365 days: 365%)'),
        'rank_code_lines':gettext('lines of coding about corresponding tech in the last year'),
        'rank_major':gettext('Main technology for this GitHub user'),
        'rank_count':gettext('It is automatically updated every 1 day of the month'),
    }
    
    desc_box.innerHTML = desc_object[target.id];
    desc_box.setAttribute('style', `left: ${event.pageX-desc_box.clientWidth/2}px; top: ${event.pageY-desc_box.clientHeight-20}px`);
}

function show_more_ranking(page){
    $.ajax({
        url: `/ranking/all?page=`+page
        ,method: 'GET'
        ,async: true
        ,success: function (data) {
            page += 1
            let rank_data = data.rank_data;
            let rank_avatar_url_dict = data.rank_avatar_url_dict;
            let ranker_toptech_dict = data.ranker_toptech_dict;
            let new_tech_rank_tag = '';
            for (let tech_name in rank_data) {
                let tech_data = rank_data[tech_name]
                new_tech_rank_tag += `
                <div class="grid gap-4 pt-3 pb-3 pl-3 mb-3 tech-rankings" style="grid-template-columns: 0.6fr 1fr 1fr 1fr; background-color: #EEEEEE;">
                    <div onclick="window.open('/ranking/${tech_name}', '_blank')" class="flex mb-3 bg-white rounded-lg shadow-xs dark:bg-gray-800 mr-2"
                       style="height: 190px;width: 126px;align-items: center;flex-direction: column; cursor:pointer;">
                      <div class="w-full inline-block">
                        <div div class="tech_color mt-2 mr-2"
                           style="background-color: ${tech_data.color}; float: right; display: block;"></div>
                      </div>
                      <img class="mx-auto mb-2" src="${tech_data.logo_path}" style="margin-top: 25px;">
                      <p class="mx-auto mb-2 text-sm" id="tech_title">${tech_name}</p>
                    </div>
                    `

                let top3_ranker_data_list = tech_data.top3_data;
                top3_ranker_data_list.forEach(function(ranker, index) {
                    let rank = index + 1;
                    new_tech_rank_tag += `
                <div onclick="window.open('/${ranker.github_id}', '_blank')" class="flex bg-white rounded-lg shadow-xs dark:bg-gray-800"
                    style="height: 257px;width: 180px;align-items: center;flex-direction: column; cursor:pointer;">
                  <div class="flex mt-1">
                    <img style="width:30px;height:30px;" src="/static/img/rank_${rank}.png">
                    <p class="font-semibold ranking-ellipsis flex" style="font-size:15px; align-content: flex-start;">Top ${rank}</p>
                  </div>
                  <img class="object-cover w-full h-full rounded-full mt-1" src="${rank_avatar_url_dict[ranker.github_id]}" style="width:64px;height:64px">
                  <p class="mx-auto mt-2 mb-3 font-semibold ranking-ellipsis" style="font-size:15px"><a href="/${ranker.github_id}" target="_blank">${ranker.github_id}</a></p>
                  <button type="button" class="btn btn-danger font-semibold mt-2 mb-1" title="${ranker.tech_code_crazy}%"
                    style="color:rgb(200,30,30);background-color:rgb(253,232,232);border-color:rgb(253,232,232); font-size: 70%; padding: 2%; width: 70%;">
                    ${gettext("Code Crazy")} <span class="badge badge-danger" style="font-size:100%;margin-left:4px; top: 1px;">${ranker.int_code_crazy}%</span>
                  </button>
                  <div class="rounded-full mt-2 mb-1" style="background-color:lightgray; width: 70%;">
                    <div
                      class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                      style="width: ${ranker.code_line_percent }}%; background-color: ${tech_data.color}"><p style="color:white">${ranker.total_lines.toLocaleString()}</p>
                    </div>
                  </div>
                  <div class="flex mt-2 mb-1" style="align-items: center;flex-direction: row; justify-content: space-around; width: 50%;">
                    <img style="width:30px;height:30px;" src="/static/img/${ranker_toptech_dict[ranker.github_id].toLowerCase()}.png">
                    <p class="text-xs text-gray-600">${ranker_toptech_dict[ranker.github_id]}</p>
                  </div>
                </div>
                `;
                });
                new_tech_rank_tag += `</div>`;
            }
            $('#rank_card').append(new_tech_rank_tag);
            document.getElementById('more_btn').setAttribute('onclick',`show_more_ranking(${page})`);
        }
    });
}


function show_side_all() {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/group')) {
        window.location.href = '/group/list'
    } else if (currentPath.startsWith('/ranking')) {
        window.location.href = '/ranking/all'
    }
}

function replace_special_char(tech_name) {
    return tech_name.replace("#", "_sharp");
}

function select_side_tech(tech_name) {
    const currentPath = window.location.pathname;
    const filtered_tech_name = replace_special_char(tech_name);
    if (currentPath.startsWith('/group')) {
        window.location.href = `/group/list?tech_name=${filtered_tech_name}`;
    } else if (currentPath.startsWith('/ranking')) {
        window.location.href = `/ranking/${filtered_tech_name}`;
    } else {
        const searchInput = document.querySelector('input[name="tags"]');
        if (searchInput.value == '') {
            searchInput.value = tech_name;
        } else {
            let parsedSearchInput = JSON.parse(searchInput.value);
            parsedSearchInput.push({"value":tech_name});
            searchInput.value = JSON.stringify(parsedSearchInput);
        }
    }
}

function delete_repos() {
    const repos = document.querySelectorAll(".repos");
    const checkedRepos = Array.from(repos).filter(box => box.checked).map(box => box.getAttribute('repo_id'));

    if (checkedRepos.length == 0) {
        alert("There is no selected repository");
        return;
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: `${window.location.pathname}/delete/repo`
        ,method: 'POST'
        ,data: {"repo_id_list": JSON.stringify(checkedRepos)}
        ,async: true
        ,success: function (data) {
            if (data.status == 'success'){
                alert("Selected repositories are deleted");
                location.reload();
            } else{
                alert(data.reason);
            }
        }
    });
}

function tech_ranking(github_id){
    $.ajax({
        url: `/${github_id}/top3`
        ,method: 'POST'
        ,async: true
        ,success: function (data) {
            if (data.status == 'success'){
                let top3_tech_data = data.top3_tech_data
                let rank_tags = `
                            <h1 class="font-bold mb-3" style="font-size: 1rem;">${gettext('My Ranking')}</h1>
                            <div class="mt-2">`
                top3_tech_data.forEach(rank_data => {
                    let tech_name = rank_data.name;
                        rank_tags += `
                        <div onclick="find_ranking_user(event, ${github_id}, ${tech_name})" class="flex mt-2 bg-white rounded-lg shadow-xs dark:bg-gray-800" style="justify-content: space-between; padding: 1%; cursor:pointer;">
                          <div class="flex align-center">
                            <img style="width: 3.5rem; height: 3.5rem;" src="/static/img/${rank_data.file}.png" onerror="this.onerror=null; this.src='/static/img/none3.png';">
                            <span class="ml-4 font-bold" style="font-size: 1rem;">${tech_name}</span>
                          </div>
                          <div class="flex" style="align-items: center; justify-content: center; width: 38%;">
                            <div class="flex" style="flex-direction: column; align-items: center; justify-content: center;">
                              <span class="font-bold" style="font-size: 1rem;">${rank_data.rank.rank}</span>
                              <h5 class="font-bold" style="color: #D5D8DD">rank</h5>
                            </div>
                            <div class="flex ml-3" style="flex-direction: column;">
                              <div class="flex" style="align-items: center; justify-content: center;">`
                    let change_rank = rank_data.rank.change_rank;
                    if (change_rank > 0){
                        rank_tags +=
                            `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="red" class="bi bi-caret-up-fill" viewBox="0 0 16 16">
                              <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/>
                             </svg>`
                    } else if (change_rank < 0) {
                        rank_tags +=
                        `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="blue" class="bi bi-caret-down-fill" viewBox="0 0 16 16">
                          <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                        </svg>`
                    } else {
                        rank_tags +=
                        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#96C362" class="bi bi-circle-fill" viewBox="0 0 16 16" style="margin-left: 6px; margin-right: 7px;">
                           <circle cx="8" cy="8" r="8"/>
                         </svg>`
                    }
                    rank_tags +=
                        `<span class="text-xs">${change_rank}</span>
                        </div>
                       <span style="color: #A3A19C; font-size: 0.6rem;">(Top ${rank_data.rank_percent}%)</span>
                      </div>
                    </div>
                   </div>`
                });
                rank_tags += `</div>`
                $('#top3_rank').empty()
                $('#top3_rank').append(rank_tags)
            }
        }
    });
}
