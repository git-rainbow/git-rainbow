var calendar_commits;
var last_tech_data;

function save_global_var(tech_data){
    last_tech_data = tech_data;
}

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
        url: '/save-repo-url'
        ,method: 'POST'
        ,async: false
        ,data: {'repo_url': repo_url}
        ,success: function (data) {
            if (data.status == 200) {
                alert(gettext("Your repository url has been saved"));
            } else {
                alert(gettext("Invalid URL"));
            }
        }
    });
}

function _analyze_developer(data) {
    let waiting = true;
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: '/update-git-rainbow'
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
                show_rainbow_calendar(data.calendar_data);
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
    let svg_url = new URL(window.document.location.href).origin + '/svg/' + `${github_id}`;
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

function show_more_ranking(event){
    let hidden_tech_rankings = document.querySelectorAll(".tech-rankings.hidden");
    let count = 0;
    for (let i=0; i < hidden_tech_rankings.length; i++){
        hidden_tech_rankings[i].classList.remove('hidden');
        count ++;
        if (count == 10){
            break;
        }
    }
    if(document.querySelectorAll(".tech-rankings.hidden").length==0){
        event.currentTarget.classList.add('hidden');
    };
}
