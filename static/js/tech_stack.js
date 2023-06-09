function user_check(){
    var github_id = $('#github_id').val()
    var error_position = $('#error');
    if (github_id.startsWith(' ') || github_id == ''){
        error_position.text(gettext("Please check your GitHub ID")).attr("style", "color: red;text-align:left");
    }
    else{
        $.ajax({
        url: 'https://api.github.com/users/' + github_id
        , headers:{"Accept": "application/vnd.github+json"}
        , method: 'GET'
        , async: false
        , dataType: "Json"
        , success: function (data) {
            if(data.type == 'Organization'){
                error_position.text(gettext("Please input personal GitHub ID")).attr("style", "color: red;text-align:left");
            }
            else{
                location.href = 'developer/'+github_id;
            }
        },
        error: function(data){
            error_position.text(gettext("Please check your GitHub ID")).attr("style", "color: red;text-align:left");
        }
        });
    }
}

function enter_key(){
    if (event.keyCode === 13) {
      $('.user_check').click();
    }
}

function check_lang_code(){
    let lang_list = ['ko', 'en'];
    let path_one = location.pathname.split('/')[1];
    if (lang_list.includes(path_one)){
        return `/${path_one}`
    } else {
        return ''
    }
};

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
            if (data.status == 'completed') {
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

function origin_stack_data_save(){
    const upper = $('#upper');
    const invisible_upper = $('#invisible_upper');
    const tech_stack_data = [];

    for(let a=0; a< upper.children().length; a++){
        const location_y = upper.children().eq(a);
        const type_name = location_y.children('span').text();
        for(let b=0; b< location_y.children('table').children().length; b++){
            const stack_id = location_y.children('table').children().eq(b).attr('stack_id');
            const stack_data = {};
            stack_data['tech_stack_id'] = stack_id;
            stack_data['tech_type'] = type_name;
            stack_data['position_x'] = a+1;
            stack_data['position_y'] = b+1;
            stack_data['visible'] = true;
            tech_stack_data.push(stack_data);
        }
    }
    for(let i = 0; i<invisible_upper.children().length;i++){
        const invis_location_y = invisible_upper.children().eq(i);
        const invis_type_name = invis_location_y.children('span').text();
        for(let j = 0; j<invis_location_y.children('table').children().length;j++){
            const invis_stack_id = invis_location_y.children('table').children().eq(j).attr('stack_id')
            const invis_stack_data = {};
            invis_stack_data['tech_stack_id'] = invis_stack_id;
            invis_stack_data['tech_type'] = invis_type_name;
            invis_stack_data['position_x'] = i + 1;
            invis_stack_data['position_y'] = j + 1;
            invis_stack_data['visible'] = false;
            tech_stack_data.push(invis_stack_data);
        }
    }
    origin_stack_data= tech_stack_data;
}

function changed_stack_data_save() {
    const upper = $('#upper');
    const invisible_upper = $('#invisible_upper');
    const change_tech_stack_data = [];

    for (let a = 0; a < upper.children().length; a++) {
        const location_y = upper.children().eq(a);
        const type_name = location_y.children('span').text();
        for (let b = 0; b < location_y.children('table').children().length; b++) {
            const stack_id = location_y.children('table').children().eq(b).attr('stack_id');
            const stack_data = {};
            stack_data['tech_stack_id'] = stack_id;
            stack_data['tech_type'] = type_name;
            stack_data['position_x'] = a + 1;
            stack_data['position_y'] = b + 1;
            stack_data['visible'] = true;
            change_tech_stack_data.push(stack_data);
        }
    }
    for(let i = 0; i<invisible_upper.children().length;i++){
        const invis_location_y = invisible_upper.children().eq(i);
        const invis_type_name = invis_location_y.children('span').text();
        for(let j = 0; j<invis_location_y.children('table').children().length;j++){
            const invis_stack_id = invis_location_y.children('table').children().eq(j).attr('stack_id')
            const invis_stack_data = {};
            invis_stack_data['tech_stack_id'] = invis_stack_id;
            invis_stack_data['tech_type'] = invis_type_name;
            invis_stack_data['position_x'] = i + 1;
            invis_stack_data['position_y'] = j + 1;
            invis_stack_data['visible'] = false;
            change_tech_stack_data.push(invis_stack_data);
        }
    }

    const save_tech_stack_data = [];
    for (let c = 0; c < origin_stack_data.length; c++) {
        for (let d = 0; d < change_tech_stack_data.length; d++) {
            if (origin_stack_data[c].tech_stack_id == change_tech_stack_data[d].tech_stack_id) {
                if (origin_stack_data[c].tech_type != change_tech_stack_data[d].tech_type ||
                    origin_stack_data[c].position_x != change_tech_stack_data[d].position_x ||
                    origin_stack_data[c].position_y != change_tech_stack_data[d].position_y ||
                    origin_stack_data[c].visible != change_tech_stack_data[d].visible) {
                    save_tech_stack_data.push(change_tech_stack_data[d]);
                }
            }
        }
    }
    var split = location.href.split("/");
    var href_length = split.length;
    var user_name = split[href_length-2];

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url:'/user/'+user_name+'/edit'
        ,method: 'POST'
        ,data: {'update_tech_stack': JSON.stringify(save_tech_stack_data)}
        ,success: function (data) {
            if(data.status == "success") {
                alert('성공적으로 저장되었습니다.');
                location.href='/user/'+user_name;
            }
        },
        error: function (data) {
        }
    });
}

function get_tech_detection(tech_name) {
    var waiting = _get_tech_detection(tech_name);
    var interval = setInterval(function () {
        if (waiting == false)
            clearInterval(interval);
        else
            waiting = _get_tech_detection(tech_name);
    }, 3000);
}

function _get_tech_detection(tech_name) {
    var waiting = false;
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/admin/'+tech_name+'/get_tech_detection'
        ,method: 'POST'
        ,async: true
        ,success: function (data) {
            if (data.status == 200) {
                $("main").attr('class', "mb-auto mt-auto");
                $("main").html(data.content);
                waiting = false;
            } else {
                if (data.status == 102) {
                    waiting = true;
                } else {
                    $("main").attr('class', "h-full overflow-y-auto");
                    $("main").html(data.content);
                    waiting = false;
                }
            }
        },
        error: function (data) {
            if (data.status == 404) {
            }
        }
    });
    return waiting;
}

function check_type_exist() {
    const upper = $('#upper');
    const invisible_upper = $('#invisible_upper');
    let add = $("#plus");
    let invisible_add = $("#invisible_plus");
    for(let i = 0 ; i < upper.children().length; i++){
        var location_y = upper.children().eq(i);
        var type_name = location_y.children('span');
        let location_y_length = location_y.children('table').children().length;
        if(location_y_length == 0){
            location_y.not(add).remove();
            type_name.text('');
        }
        if(location_y_length == 1 && type_name.text()==''){
            type_name.text('edit');
        }
    }

    for(let j = 0; j<invisible_upper.children().length; j++){
        var invis_location_y = invisible_upper.children().eq(j);
        var invis_type_name = invis_location_y.children('span');
        var invis_location_y_length = invis_location_y.children('table').children().length;

        if(invis_location_y_length == 0){
            invis_location_y.not(invisible_add).remove();
            invis_type_name.text('');
        }
        if(invis_location_y_length == 1 && invis_type_name.text()==''){
            invis_type_name.text('edit');
        }
    }
}

function send_type_name_position(type_name_position){
    let tech_type_name = $("#"+type_name_position).text();
    $("#save_id").attr('onclick',"save_type_name(" + type_name_position + ")");
    $("#tech_type_input").attr('value',tech_type_name);
}

function scroll_position(event){
    const view_size = window.innerHeight;
    const mouse_y = event.clientY;

    if (mouse_y <= 300 && mouse_y != 0){
        window.scrollBy({top:-700, behavior: "smooth"})
    } else if (mouse_y > view_size * 0.8) {
        window.scrollBy({top:700, behavior: "smooth"})
    }
}

function save_type_name(type_name_id){
    const tech_type_position = document.getElementById(type_name_id);
    const input = $("#tech_type_input");
    tech_type_position.innerText = input.val();
    input.remove();
    $("#edit_tech_type_text").after('<input\n' + 'id="tech_type_input"\n' + 'class="w-full focus:border-purple-400 focus:outline-none focus:shadow-outline-purple form-input items-center"\n/>')
}

function add_tech(){
    var input_tech_name = $("#input_tech_name").val();
    var input_tech_type = $("#input_tech_type").val();

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: '/admin/tech_name'
        ,method: 'POST'
        ,data: {
            'tech_name': input_tech_name,
            'tech_type':input_tech_type
        }
        , async: false
        ,success: function (data) {
            if(data.status == "success"){
                alert('성공적으로 저장되었습니다.');
                location.href = '/admin'
            } else if(data.status == "exists"){
                alert('이미 목록에 있는 기술입니다.');
            }
        },
        error: function (data) {
        }
    });
}

function delete_tech_list(){
    var checkbox = $("input[name=checkbox]:checked");
    var delete_list = [];

    checkbox.each(function(i) {
        var check_data_list = checkbox.parent().parent().eq(i).children();
        var tech_name = check_data_list.eq(2).text().trimStart().trimEnd();
        delete_list.push(tech_name);
    })

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: 'admin/tech_name/delete'
        ,method: 'POST'
        ,async: false
        ,data:{'delete_list':delete_list}
        ,success: function (data) {
            if(data.status == "success"){
                alert('성공적으로 삭제되었습니다.');
                location.href = '/admin'
            }
        },
        error: function (data) {
        }
    });
}

function update_tech_list(){
    var checkbox = $("input[name=checkbox]:checked");
    if(!$("input[name=checkbox]").is(":checked")){
        alert('체크된 값이 없습니다.');
        return;
    }

    var tech_name_data_list = [];

    checkbox.each(function(i) {
        var tech_name_data = {};
        var check_data_list = checkbox.parent().parent().eq(i).children();
        tech_name_data['tech_name'] = check_data_list.eq(1).text().trimStart().trimEnd();
        tech_name_data['tech_files_lists'] = check_data_list.eq(4).children().val();
        tech_name_data['tech_files_keywords_lists'] = check_data_list.eq(5).children().val();
        tech_name_data['ext_lists']= check_data_list.eq(6).children().val();
        tech_name_data['include_filter'] = check_data_list.eq(7).children().val();
        tech_name_data['keywords_lists'] = check_data_list.eq(8).children().val();
        tech_name_data['package_list'] = check_data_list.eq(9).children().val();
        tech_name_data['is_special_tech_files'] = check_data_list.eq(10).children().prop('checked');
        tech_name_data_list.push(tech_name_data);
    });

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/admin/tech_name/update'
        ,method: 'POST'
        ,data:{'tech_name_data_list':JSON.stringify(tech_name_data_list)}
        , async: false
        ,success: function (data) {
            if(data.status == "success"){
                location.href = '/admin'
            }
        },
        error: function (data) {
        }
    });
}

function email_notification_set(github_id) {
    const email = $('#email').val();
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/user/'+github_id+'/email'
        ,method: 'POST'
        ,data:{'email': email}
        , async: false
        ,success: function (data) {
        },
        error: function (data) {
        }
    });
}

function copy_link(){
    let textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.value = window.document.location.href+'/tech-cards';
    textarea.select();
    window.navigator.clipboard.writeText(textarea.value).then(() => {
        alert("Url 복사가 완료되었습니다.");
    });
    document.body.removeChild(textarea);
}

function add_tech_position(){
    let cards = $("#tech_stack_cards span");
    let card_id;

    if(cards.length == 0) {
         card_id = 11;
    } else {
         card_id = parseInt(cards[cards.length-1].id)+1;
    }

    $("#plus").before(
        `<div id="tech_stack_cards" class="mx-auto" style="width: 80%">
         <span @click='openEmailModal' onclick=send_type_name_position(${card_id}) id=${card_id} style="font-family:Russo One;cursor:pointer">edit</span>
         <table class="table" style="min-height: 100px"></table>
         </div>`);

    let tables = document.querySelectorAll(".table");
    tables.forEach((table) => {
    new Sortable(table, {
        group: "shared",
        animation: 150,
        ghostClass: "blue-background-class"
    });
    });
}

function invisible_add_tech_position(){
    let invisible_cards = $("#invisble_tech_stack_cards span");
    let invisible_card_id;

    if(invisible_cards.length == 0){
         invisible_card_id = 101;
    } else{
         invisible_card_id = parseInt(invisible_cards[invisible_cards.length-1].id)+1;
    }

    $("#invisible_plus").before(
        `<div id="invisble_tech_stack_cards" class="mx-auto" style="width: 80%">
         <span @click="openEmailModal" onclick="send_type_name_position(${invisible_card_id})" id=${invisible_card_id} style="font-family: Russo One;cursor:pointer">edit</span>
         <table class="table" style="min-height: 100px;width: 100%"></table>
         </div>`);

    let tables = document.querySelectorAll(".table");
    tables.forEach((table) => {
    new Sortable(table, {
        group: "shared",
        animation: 150,
        ghostClass: "blue-background-class"
    });
    });
}

function request_tech_analyze(){
    const checked_list = document.querySelectorAll("input[type='checkbox']:checked");
    const filtered_tech_list = new Array;
    for (let i=0; i<checked_list.length; i++){
        const tech_name = checked_list[i].id
        filtered_tech_list.push(`whatsgog-${tech_name}-`);
    };
    if (checked_list.length !== 0){
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
        $.ajax({
            url: '/admin_tech_stack',
            method: 'POST',
            data: {'tech_list':JSON.stringify(filtered_tech_list)},
            success: function () {
                location.href = '/admin';
            },
            error: function () {
                alert("요청 실패. 확인 필요");
            }
        });
    } else {
        alert("선택된 기술이 없습니다.");
    }
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
