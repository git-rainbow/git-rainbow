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

function show_group_calendar(commit_data){
    calendar_commits = commit_data;
    let today = moment().endOf('day').toDate();
    let yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    let chartData = d3.time.days(yearAgo, today).map(function (dateElement) {
        return {
                date: dateElement,
                count:(calendar_commits[moment(dateElement).format('YYYY-MM-DD')] ? calendar_commits[moment(dateElement).format('YYYY-MM-DD')] : 0)
            };
        });
    let calendar = group_calendar()
        .data(chartData)
        .selector('.git-table')
        .tooltipEnabled(true)
        .colorRange(['#c6e48b', '#196127'])
    calendar();
};
