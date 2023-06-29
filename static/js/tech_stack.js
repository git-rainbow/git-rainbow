function analyze_developer(github_id) {
    var waiting = _analyze_developer(github_id);
    var interval = setInterval(function () {
        if (waiting == false)
            clearInterval(interval);
        else
            waiting = _analyze_developer(github_id);
    }, 3000);
}

function _analyze_developer(github_id) {
    var waiting = true;
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: '/analysis'
        ,method: 'POST'
        ,data:
            {
                'github_id': github_id
            }
        ,async: false
        ,success: function (data) {
            if (data.status == 'success') {
                waiting = false;
                $("#under_header").html(data.content);
                show_profile_calendar(data.calendar_data)
            } else if(data.status == 'fail') {
                waiting = false;
                alert('status:fail');
            }
        },
        error: function (data) {
            waiting = false;
            alert("error occured");
        }
    });
    return waiting;
}

function update_analysis(github_id){
    let updateBtn = document.querySelector("#update_btn");
    updateBtn.classList.add("rotate-img");

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: `/${github_id}`,
        method: 'POST',
        data: {'github_id': github_id, 'update': true},
        async: true,
        success: function (data) {
            if (data.status == 'analyzing') {
                analyze_developer(github_id);
            } else {
                updateBtn.classList.remove("rotate-img");
                alert(data.reason);
            }
        },
        error: function (data) {
            updateBtn.classList.remove("rotate-img");
            alert("Update failed");
        }
    });
}

function check_analysis_updating(github_id, status){
    if(status == 'fail') {
        alert("Analysis failed");
    } else if (status != 'success') {
        let updateBtn = document.querySelector("#update_btn");
        updateBtn.classList.add("rotate-img");
        analyze_developer(github_id);
    } 
}

function save_token(){
    const target_user = location.pathname.replace('/', '');
    const token = document.querySelector("#token_input").value;
    const close_btn = document.querySelector("#close_btn");

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/save-token',
        method: 'POST',
        data: {'target_user': target_user, 'token': token},
        async: true,
        success: function (data) {
            alert(data.response);
            close_btn.click();
        }
    });
}

function is_valid_githubuser(github_id){
    let is_valid = false;
    let error_message;
    const white_space_regex = new RegExp(/\s+/);
    if (white_space_regex.test(github_id) || github_id == '') {
        error_message = 'Please check Github ID';
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
                error_message =  "Please input personal GitHub ID";
            }}
        , error: function (data) {
            error_message =  "Please check your GitHub ID";
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
        alert("Copied!");
        window.open(svg_url, "_blank");
    });
    document.body.removeChild(textarea);
}

function admin_tech_list_manage(action){
    let tech_name_list = [];
    if (action != 'create'){
        let checkboxs = $("input[name=checkbox]:checked");
        if(!$("input[name=checkbox]").is(":checked")){
            alert('체크된 값이 없습니다.');
            return;
        }
        checkboxs.each(function(i) {
            tech_name_list.push(checkboxs[i].id);
        });
    }

    let data = {'action': action};
    if (action == 'create'){
        let input_tech_name = document.querySelector(`#input_tech_name`).value;
        let input_tech_type = document.querySelector(`#input_tech_type`).value;
        if (!input_tech_name || !input_tech_type){
            alert('기술명, 기술종류를 확인해주세요');
            return;
        }
        data.tech_name = input_tech_name;
        data.tech_type = input_tech_type;
    } else if (action == 'update'){
        let update_tech_date_list = [];
        tech_name_list.forEach(tech_name => {
            let tech_data = {
                'tech_name': tech_name,
                'tech_files_lists': document.querySelector(`#${tech_name}_tech_files_lists`).value,
                'tech_files_keywords_lists': document.querySelector(`#${tech_name}_tech_files_keywords_lists`).value,
                'ext_lists': document.querySelector(`#${tech_name}_ext_lists`).value,
                'include_filter': document.querySelector(`#${tech_name}_include_filter`).value,
                'keyword_lists': document.querySelector(`#${tech_name}_keyword_lists`).value,
                'package_list': document.querySelector(`#${tech_name}_package_list`).value,
                'is_special_tech_files': document.querySelector(`#${tech_name}_is_special_tech_files`).checked,
            };
            update_tech_date_list.push(tech_data);
        });
        data.update_tech_date_list = JSON.stringify(update_tech_date_list);
    } else {
        let delete_confirm = confirm("기술을 삭제하시겠습니까?");
        if (delete_confirm){
            data.delete_tech_list = JSON.stringify(tech_name_list);
        }
    }
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/tech-list/edit'
        ,method: 'POST'
        ,data: data
        ,async: false
        ,success: function (data) {
            if(data.status == "success"){
                location.href = '/tech-list';
            }
        },
    });
}
