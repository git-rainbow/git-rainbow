function check_lang_code(){
    let lang_list = ['ko', 'en'];
    let path_one = location.pathname.split('/')[1];
    if (lang_list.includes(path_one)){
        return `/${path_one}`
    } else {
        return ''
    }
};


function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim(); // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function csrfSafeMethod(method) { // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

var csrftoken = getCookie('csrftoken');

function interval_fn(fn, ms) {
    var waiting = fn();
    var interval = setInterval(function () {
        if (waiting == false)
            clearInterval(interval);
        else
            waiting = fn();
    }, ms);
}
function get_manage_groups_list(){
    var waiting = false
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/group-list'
        , method: 'GET'
        , async: false
        , success: function (data) {
            if (data.status == 200) {
                $("main").attr('class', "h-full overflow-y-auto");
                $("main").html(data.content);
                waiting = false;
            } else {
                if (data.status == 102) {
                    waiting = true;
                } else {
                    $("main").attr('class', "h-full overflow-y-auto");
                    $("main").html(data);
                    waiting = false;
                }
            }
        }
        , error: function (data) {
            if (data.status == 404) {
            }
        }
    });
    return waiting;
}
function get_ossca_proj_list() {
    var waiting = false
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/ossca-proj-list'
        , method: 'GET'
        , async: false
        , success: function (data) {
            if (data.status == 200) {
                $("main").attr('class', "h-full overflow-y-auto");
                $("main").html(data.content);
                get_proj_json_list();
                waiting = false;
            } else {
                if (data.status == 102) {
                    waiting = true;
                } else {
                    $("main").attr('class', "h-full overflow-y-auto");
                    $("main").html(data);
                    waiting = false;
                }
            }
        }
        , error: function (data) {
            if (data.status == 404) {
            }
        }
    });
    return waiting;
}

var proj_list;

function get_proj_json_list() {
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + '/proj-list'
        , method: 'POST'
        , data: {}
        , async: false
        , success: function (data) {
            proj_list = data;
            const result = Object.entries(proj_list).map(([key, value]) => ({
                repo: key,
                ...value
            }))

            for (let i = 0; i < result.length; i++) {
                if (result[i]["code_score"] != null) {
                    let changeNum = result[i]["code_score"].replaceAll(",", "");
                    let numeric = Number(changeNum);
                    result[i]["code_score"] = numeric;
                    let changeNum2 = result[i]["cowork_score"].replaceAll(",", "");
                    let numeric2 = Number(changeNum2);
                    result[i]["cowork_score"] = numeric2;
                    let test3 = result[i]["cowork_percent"]
                    if (test3 == "low") {
                        result[i]["cowork_percent_num"] = 1;
                    } else if (test3 == "moderate") {
                        result[i]["cowork_percent_num"] = 2;
                    } else {
                        result[i]["cowork_percent_num"] = 3;
                    }
                }
            }
            proj_list = result
          }
    });
}

var colPrev = "";

function sort_proj(c) {
    if (c === "repo") {
        proj_list.sort(
            function (a, b) {
                let compA = a[c].toLowerCase()
                let compB = b[c].toLowerCase()
                compA < compB ? -1 : compA > compB ? 1 : 0;
                compA > compB ? -1 : compA < compB ? 1 : 0;
                a[c] = compA;
                b[c] = compB;
            }
        )
    }

    if (c !== colPrev) {
        proj_list.sort(
            function (a, b) {
                if (a[c] === b[c]) {
                    return 0;
                } else {
                    return (a[c] < b[c] ? -1 : 1);
                }
            }
        );
    } else {
        proj_list.reverse(
            function (a, b) {
                if (a[c] === b[c]) {
                    return 0;
                } else {
                    return (a[c] > b[c] ? -1 : 1);
                }

            }
        );
    }
    colPrev = c;

    $('#proj_table').empty();
    for (let i = 0; i < proj_list.length; i++) {
        if (proj_list[i]["code_score"] || proj_list[i]["cowork_score"] != null) {
            var projScore = proj_list[i]["code_score"];
            var projCowork = proj_list[i]["cowork_score"];
            let filterScore = projScore.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            let filterCowork = projCowork.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            let repo_proj = proj_list[i]["repo"];
            let name_proj = proj_list[i]["name"];
            let owner_proj = proj_list[i]["owner"];
            let cowork_percent = proj_list[i]["cowork_percent"];
            let cowork_score = proj_list[i]["cowork_score"];
            let code_score = proj_list[i]["code_score"];
            code_score = filterScore
            cowork_score = filterCowork
            var tr_start = `<tr class="text-gray-700 dark:text-gray-400">
                <td class="px-4 py-3 text-sm">
                  <a class="text-blue-500" href= "./github/${repo_proj}">
                      <span>${name_proj}</span>
                      <span>/</span>
                      <span class="font-bold">${owner_proj}</span>
                  </a>
                </td>
                <td class="px-5 py-3 text-sm">
                  ${code_score} ${gettext("lines")}
                </td>
                  <td class="px-5 py-3 text-sm">
                    ${cowork_score} ${gettext("issues")}
                  </td>
                <td class="px-5 py-3 text-sm">
                  ${cowork_percent}
                </td>
                  </tr>`
            $('#proj_table').append(tr_start);
        } else {
            let repo_proj = proj_list[i]["repo"];
            var tr_end = `<tr class="text-gray-700 bg-gray-100 dark:text-gray-400">
                <td class="px-4 py-3 text-sm">
                  <p class="text-gray-500 font-bold">
                  ${repo_proj}
                  </p>
                </td>
                <td class="px-5 py-3 text-sm text-red-600">
                  ${gettext("Unable to verify information.")}
                </td>
                <td class="px-5 py-3 text-sm">
                </td>
                <td class="px-5 py-3 text-sm">
                </td>
              </tr>`
            $('#proj_table').append(tr_end);
        }
    }
}

var file_list;

function get_file_json_list() {
    const url = new URL(document.location.href)
    let query_str = url.search
    let url_path_split = url.pathname.split('/')
    let support_platforms = ['github']

    // remote_type && name_with_owner
    let remote_type = url_path_split[1]
    let name_with_owner = url_path_split[2] + '/' + url_path_split[3]
    if (!support_platforms.includes(remote_type)){
        remote_type = url_path_split[2]
        name_with_owner = url_path_split[3] + '/' + url_path_split[4]
    }

    // file_path
    let file_path = ""
    if (!url_path_split.includes('tree')){
    } else if (!support_platforms.includes(remote_type)) {
        var get_filePath = url_path_split.slice(7, url_path_split.length);
        for (let i = 0; i < get_filePath.length; i++) {
            file_path += get_filePath[i] + "/";
        }
    } else if (support_platforms.includes(remote_type)) {
        var get_filePath = url_path_split.slice(6, url_path_split.length);
        for (let i = 0; i < get_filePath.length; i++) {
            file_path += get_filePath[i] + "/";
        }
    }

    // month && days
    if (query_str && query_str.includes('month')) {
        var query_split = query_str.replace("?", "").split('&');
        for (var i = 0; i < query_split.length; i++) {
            if(query_split[i].includes('month'))
                 var month = query_split[i].replace('month=','')
             }
    } else {
        var query_split = query_str.replace("?", "").split('&');
        for (var i = 0; i < query_split.length; i++) {
            if(query_split[i].includes('days')){
                var days = query_split[i].replace('days=','')
            }
        }
    }
    if (!month && !days) {
        month = 1
    } else if (month){
        days = 0;
    } else {
        month = 0
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/analyze-file-list'
        , method: 'POST'
        , data: {
            'remote_type': remote_type,
            'name_with_owner': name_with_owner,
            'month': month,
            'days': days,
            'file_path': file_path
        }
        , async: false
        , success: function (data) {
            file_list = data
            if (data.status != 'fail'){
                var result = Object.entries(file_list).map(([key, value]) => ({
                file: key,
                ...value
            }))

            for (let i = 0; i < result[1]["file_list"].length; i++) {
                let del_com = result[1]["file_list"][i]["lines"].replaceAll(",", "")
                let numeric = Number(del_com)
                result[1]["file_list"][i]["lines"] = numeric
            }
            file_list = result;
            }
        }
    })
}

var col_listPrev = "";

function sort_list(c) {
    if (file_list.status == 'fail')
        return null
    var sort_fileList = file_list[1]["file_list"]
    var file_path = file_list[1]["path"]
    if (c === 'name') {
        sort_fileList.sort(
            function (a, b) {
                let compA = a[c]
                let lowerA = compA.toLowerCase()
                let compB = b[c]
                let lowerB = compB.toLowerCase()
                lowerA > lowerB ? -1 : lowerA < lowerB ? 1 : 0;
                lowerA < lowerB ? -1 : lowerA > lowerB ? 1 : 0;
                a[c] = lowerA;
                b[c] = lowerB;
            }
        )
    }

    if (c !== col_listPrev) {
        sort_fileList.sort(
            function (a, b) {
                if (a[c] === b[c]) {
                    return 0;
                } else {
                    return (a[c] < b[c] ? -1 : 1);
                }
            }
        );
    } else {
        sort_fileList.reverse(
            function (a, b) {
                if (a[c] === b[c]) {
                    return 0;
                } else {
                    return (a[c] > b[c] ? -1 : 1);
                }
            }
        );
    }
    col_listPrev = c;

    $('#list_table').empty()
    for (let i = 0; i < sort_fileList.length; i++) {
        var new_fileLines = sort_fileList[i]["lines"];
        let fileLines = new_fileLines.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        let fileName = sort_fileList[i]["name"];
        let filePercent = sort_fileList[i]["percent"];
        let fileType = sort_fileList[i]["type"]
        var link = document.location.href.split("?");
        var del_Host = link[0].replace("http://localhost:8000/", "")
        var link_Result = del_Host.split("/");
        if (!link.at(-1).includes("month=")) {
            link.push("month=1")
        }
        var remote_type = link_Result[0];
        var name_with_owner = link_Result[1] + "/" + link_Result[2];

        if (link[1].includes('month=')) {
            var month = link[1]

        } else {
            var days = link[1]
        }

        //  ** table list start **
        var file_tr_head =
            `<tr class="text-gray-700 dark:text-gray-400">
            <td class="px-4 py-3 overflow-td-auto">
                <div class="flex">`

        var file_tr_start;
        if (fileType == 'd') {
            file_tr_start = `<div style="min-width:32px">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 72 72">
                      <path fill="#6C87FE" d="M57.5,31h-23c-1.4,0-2.5-1.1-2.5-2.5v-10c0-1.4,1.1-2.5,2.5-2.5h23c1.4,0,2.5,1.1,2.5,2.5v10 C60,29.9,58.9,31,57.5,31z"></path>
                      <path fill="#8AA3FF" d="M59.8,61H12.2C8.8,61,6,58,6,54.4V17.6C6,14,8.8,11,12.2,11h18.5c1.7,0,3.3,1,4.1,2.6L38,24h21.8 c3.4,0,6.2,2.4,6.2,6v24.4C66,58,63.2,61,59.8,61z"></path>
                      <path display="none" fill="#8AA3FF" d="M62.1,61H9.9C7.8,61,6,59.2,6,57c0,0,0-31.5,0-42c0-2.2,1.8-4,3.9-4h19.3 c1.6,0,3.2,0.2,3.9,2.3l2.7,6.8c0.5,1.1,1.6,1.9,2.8,1.9h23.5c2.2,0,3.9,1.8,3.9,4v31C66,59.2,64.2,61,62.1,61z"></path><path fill="#798BFF" d="M7.7,59c2.2,2.4,4.7,2,6.3,2h45c1.1,0,3.2,0.1,5.3-2H7.7z"></path>
                    </svg>
                  </div>`
        } else {
            file_tr_start = `<div style="min-width:32px">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><path d="M50,61H22a6,6,0,0,1-6-6V22l9-11H50a6,6,0,0,1,6,6V55A6,6,0,0,1,50,61Z" style="fill:#36c684"></path><path d="M25,20.556A1.444,1.444,0,0,1,23.556,22H16l9-11h0Z" style="fill:#95e5bd"></path></svg></div>`
        }

        if (file_path == '') { //In case of the root
            var file_tr_body;
            if (new_fileLines == 0) {
                file_tr_body = `<a class="flex items-center px-3">${fileName}</a></div></td>`
            } else if (month != 0) {
                file_tr_body = `<a href="/${remote_type}/${name_with_owner}/tree/${fileName}?${month}"
               class="flex items-center px-3">${fileName}</a></div></td>`
            } else {
                file_tr_body = `<a href="/${remote_type}/${name_with_owner}/tree/${fileName}?days=${days}"
               class="flex items-center px-3">${fileName} </a></div></td>`
            }
        } else { // In case of the next folder
            `<div style="min-width:32px">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 72 72">
                      <path fill="#6C87FE" d="M57.5,31h-23c-1.4,0-2.5-1.1-2.5-2.5v-10c0-1.4,1.1-2.5,2.5-2.5h23c1.4,0,2.5,1.1,2.5,2.5v10 C60,29.9,58.9,31,57.5,31z"></path>
                      <path fill="#8AA3FF" d="M59.8,61H12.2C8.8,61,6,58,6,54.4V17.6C6,14,8.8,11,12.2,11h18.5c1.7,0,3.3,1,4.1,2.6L38,24h21.8 c3.4,0,6.2,2.4,6.2,6v24.4C66,58,63.2,61,59.8,61z"></path>
                      <path display="none" fill="#8AA3FF" d="M62.1,61H9.9C7.8,61,6,59.2,6,57c0,0,0-31.5,0-42c0-2.2,1.8-4,3.9-4h19.3 c1.6,0,3.2,0.2,3.9,2.3l2.7,6.8c0.5,1.1,1.6,1.9,2.8,1.9h23.5c2.2,0,3.9,1.8,3.9,4v31C66,59.2,64.2,61,62.1,61z">
                      </path><path fill="#798BFF" d="M7.7,59c2.2,2.4,4.7,2,6.3,2h45c1.1,0,3.2,0.1,5.3-2H7.7z"></path>
                    </svg>
                  </div>`
            if (new_fileLines == 0) {
                file_tr_body = `<a class="flex items-center px-3">${fileName}</a></div></td>`
            } else if (month != 0) {
                file_tr_body = `<a href="/${remote_type}/${name_with_owner}/tree/${file_path}/${fileName}?${month}"
               class="flex items-center px-3">${fileName}</a></div></td>`
            } else {
                file_tr_body = `<a href="/${remote_type}/${name_with_owner}/tree/${file_path}/${fileName}?days=${days}"
               class="flex items-center px-3">${fileName} </a></div></td>`
            }
        }
        var file_tr_end = `<td class="px-4 py-3 text-sm">
                ${filePercent}%
              </td>
              <td class="px-4 py-3 text-sm">
                ${fileLines}
              </td>
            </tr>`

        $('#list_table').append(file_tr_head + file_tr_start + file_tr_body + file_tr_end)
    }

}

function check_url(repo_url) {
    const urlList = ["github.com"];
    if (repo_url.startsWith("git@github.com:"))
        repo_url = repo_url.replace("git@github.com:", "https://github.com/");

    try {
        var new_url = new URL(repo_url);
        var webSite = new_url.hostname;
    } catch (e) {
        return false;
    }
    if (!urlList.includes(webSite))
        return false;
    var repo_path = repo_url.split("https://github.com/");
    var name_with_owner = repo_path[1].replace(".git", "");
    if (!(name_with_owner.includes("/"))) {
        return false;
    } else {
        var split_name_with_owner = name_with_owner.split("/");
        if (split_name_with_owner[0].length == 0 && split_name_with_owner[1].length == 0) {
            return false;
        }
    }

    return true;
}

function repo_url_request() {
    var repo_url = $("#repo_id").val();
    var error_text = $("#repo_error").text(gettext("Invalid URL")).attr("style", "color: red;text-align:left");
    if (check_url(repo_url) == false) {
        error_text;
        return;
    }
    var repo_path = repo_url.split("https://github.com/");
    var name_with_owner = repo_path[1].replace(".git", "");
    if (!repo_url.endsWith(".git"))
        repo_url = repo_url + ".git";

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: '/check-repo-url'
        , method: 'POST'
        , data: {'repo_url': repo_url, "name_with_owner": name_with_owner}
        , async: false
        , success: function (data) {
            if (data.request == "success") {
                window.location.href = check_lang_code() + "/github/" + name_with_owner;
            } else {
                if (data.request == "1year") {
                    $("body").html(data.content);
                } else {
                    $("body").html(data.content);
                }
            }
        }
        , error: function (data) {
        }
    });

}

function show_calendar_commits(commit_data){
    let calendar_commits = commit_data.calendar_response_json;
    let today = moment().endOf('day').toDate();
    let yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    let chartData = d3.time.days(yearAgo, today).map(function (dateElement) {
        return {
                date: dateElement,
                count:(calendar_commits[moment(dateElement).format('YYYY-MM-DD')] ? calendar_commits[moment(dateElement).format('YYYY-MM-DD')] : 0)
            };
        });
    let heatmap = profile_calendar()
        .data(chartData)
        .selector('.git-table')
        .tooltipEnabled(true)
        .colorRange(['#c6e48b', '#196127'])
    heatmap();
};

function _analyze_project(name_with_owner, month, file_path, remote_type, days, contri) {
    var waiting = false;
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + "/analyze-project"
        ,
        method: 'POST'
        ,
        data: {
            'name_with_owner': name_with_owner,
            "month": month,
            "file_path": file_path,
            "remote_type": remote_type,
            "days": days,
            'contri': contri
        }
        ,
        async: false
        ,
        success: function (data) {
            if (data.status == 200) {
                $("main").attr('class', "h-full overflow-y-auto");
                $("main").html(data.content);
                file_stat(data.file_stat_data)
                get_file_json_list();
                show_calendar_commits(data)
                waiting = false;
            } else {
                if (data.status == 102) {
                    waiting = true;
                } else {
                    $("main").attr('class', "h-full overflow-y-auto");
                    $("main").html(data);
                    waiting = false;
                }
            }
        }
        ,
        error: function (data) {
            if (data.status == 404) {

            }
        }
    });
    return waiting;
}

function log_in() {
    var user_email = $("#email").val();
    var user_password = $("#password").val();
    $("#login_error").attr("class","text-xs text-red-600 pre")
    if(user_email == '' && user_password == '')
        return(
            $("#email,#password").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#login_error").text(gettext("Please enter your ID and password.")))
    else if(user_password == '')
        return(
            $("#password").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#email").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#login_error").text(gettext("Please enter your password.")))
    else if(user_email == '')
        return(
            $("#email").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#password").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#login_error").text(gettext("Please enter your email address.")))
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + '/login'
        , method: 'POST'
        , data: {'email': user_email, "password": user_password }
        , async: false
        , success: function (data) {
            if (data['response'] == 'login')
                location.href = check_lang_code() + '/groups'
            else if (data['response'] == 'company_login'){
                location.href = check_lang_code() + '/company/main'
            }
            else if(data['response'] == 'invalid_email'){
                $("#password").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#email").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#login_error").text(gettext("This email doesn't fit the valid format."))
            }
            else if(data['response'] == 'fail'){
                $("#email,#password").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#login_error").text(gettext("Please check your email or password."))
            }
        }
    });
}

function log_out(){
     $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + '/logout'
        , method: 'POST'
        , async: false
        , success: function (data) {
            if (data['response'] == 'logout')
                location.href = check_lang_code() + '/'
        }
    })
}
function sign_up() {
    var sign_email = $("#sign_email").val();
    var sign_password = $("#password").val();
    if(sign_email == '' && sign_password == ''){
        return(
            $("#sign_email,#password").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#check_msg").text(gettext("Please enter your ID and password.")))
    }
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + '/signup'
        , method: 'POST'
        , data: {'email': sign_email, "password": sign_password }
        , async: false
        , success: function (data) {
            if (data['response'] == 'success')
                location.href = check_lang_code() + '/login'
            else if(data['response'] == 'invalid_email'){
                $("#password").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#sign_email").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#check_msg").text(gettext("This email doesn't fit the valid format."))
            }
            else if(data['response'] == 'exist')
                $("#check_msg").text(gettext("This account already exists."))
        }
    })
}
function add_group(){
    var group_name = $("#group_name").val();
    $("#error").attr("class","text-xs text-red-600 pre")
    if(group_name == ''){
        return(
            $("#group_name").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red')),
            $("#error").text(gettext("Please enter group name."))
    }
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/group'
        , method: 'POST'
        , data: {'group_name':group_name}
        , async: false
        , success: function (data) {
            if(data['response']=='success')
                location.href = check_lang_code() + '/groups'
            else if(data['response']=='duplicate_name'){
                $("#group_name").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#error").text(gettext("This group already exists."))
            }
        }
    })
}

function update_group(group_id){
    var group_name = $("#group_name").val();
    $("#error").attr("class","text-xs text-red-600 pre")
    if(group_name == ''){
        return(
            $("#group_name").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#error").text(gettext("Please enter group name.")))
    }
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/group/'+group_id
        , method: 'POST'
        , data: {'group_name':group_name}
        , async: false
        , success: function (data) {
            if(data['response']=='update_success')
                location.href = check_lang_code() + '/groups'
        }
    })
}

function delete_group(group_id){
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/group/'+group_id
        , method: 'DELETE'
        , async: false
        , success: function (data) {
            if(data['response']=='delete_success')
                location.href = check_lang_code() + '/groups'
        }
    })
}


function add_repository(){
    var proj_name = $("#proj_name").val();
    var proj_url = $("#proj_url").val();
    var proj_user_id = $("#proj_user_id").val();
    var proj_user_password = $("#proj_user_password").val();
    var group_id = $("#group_id").val();
    $("#proj_error").attr("class","text-xs text-red-600 pre")
    if(proj_name == ''|| proj_url == ''){
        return(
            $("#proj_name,#proj_url").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_user_id,#proj_user_password,#group_id").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_error").text(gettext("Please enter empty spaces.")))
    }
    else if(group_id == ''){
        return(
            $("#group_id").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_name,#proj_url,#proj_user_id,#proj_user_password").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_error").text(gettext("Please select a group of project.")))
    } else if((proj_user_id == '' && proj_user_password != '') || (proj_user_id != '' && proj_user_password == '')){
        return(
            $("#proj_user_id,#proj_user_password").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_name,#proj_url,#group_id").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_error").text(gettext("Please enter the ID and password together.")))
    }
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/project'
        , method: 'POST'
        , data: {'proj_name':proj_name,'proj_url':proj_url,'proj_user_id':proj_user_id,'proj_user_password':proj_user_password,'group_id':group_id}
        , async: false
        , success: function (data) {
            if(data['response']=='success')
                location.href = check_lang_code() + '/groups'
            else if(data['response'] == 'exist_proj'){
                $("#proj_url").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#proj_name,#proj_user_id,#proj_user_password,#group_id").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#proj_error").text(gettext("This project already exists."))
            } else if(data['response'] == 'empty i/p'){
                $("#proj_error").text(gettext("Please enter the ID and password together."))
            } else if(data['response'] == 'wrong_url'){
                $("#proj_url").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#proj_name,#proj_user_id,#proj_user_password,#group_id").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#proj_error").text(gettext("Please enter URL in the correct format."))
            }
        }
    })
}

function update_repository(proj_id){
    var proj_name = $("#proj_name").val();
    var proj_url = $("#proj_url").val();
    var proj_user_id = $("#proj_user_id").val();
    var proj_user_password = $("#proj_user_password").val();
    var group_id = $("#group_id").val();
    $("#proj_error").attr("class","text-xs text-red-600 pre")
    if(proj_name == ''|| proj_url == ''){
        return(
            $("#proj_name,#proj_url").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_user_id,#proj_user_password,#group_id").removeClass('border-red-600 focus:border-red-400 focus:outline-none'),
            $("#proj_error").text(gettext("Please enter empty spaces.")))
    }
    else if(group_id == ''){
        return(
            $("#group_id").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_name,#proj_url,#proj_user_id,#proj_user_password").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_error").text(gettext("Please select a group of project.")))
    } else if((proj_user_id == '' && proj_user_password != '') || (proj_user_id != '' && proj_user_password == '')){
        return(
            $("#proj_user_id,#proj_user_password").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_name,#proj_url,#group_id").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
            $("#proj_error").text(gettext("Please enter the ID and password together.")))
    }
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/project/'+proj_id
        , method: 'POST'
        , data: {'proj_name':proj_name,'proj_url':proj_url,'proj_user_id':proj_user_id,'proj_user_password':proj_user_password,'group_id':group_id}
        , async: false
        , success: function (data) {
            if(data['response']=='update_success')
                location.href = check_lang_code() + '/groups'
            else if(data['response'] == 'empty i/p'){
                $("#proj_error").text(gettext("Please enter the ID and password together."))
            } else if(data['response'] == 'wrong_url'){
                $("#proj_url").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#proj_name,#proj_user_id,#proj_user_password,#group_id").removeClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red'),
                $("#proj_error").text(gettext("Please enter URL in the valid format."))
            }
        }
    })
}

function delete_repository(proj_id){
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/project/'+proj_id
        , method: 'DELETE'
        , async: false
        , success: function (data) {
            if(data['response']=='delete_success')
                location.href = check_lang_code() + '/groups'
        }
    })

}
function check_password() {
    var password = $("#password").val();
    var check_password = $("#check_password").val();

    if (password != check_password) {
        $("#check_msg").text(gettext("Password is not correct.")),
        $("#check_password").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red')
    } else {
        $("#check_msg").html("")
    }
    if (check_password == "") {
        $("#check_msg").text(gettext("Please check your password."))
        $("#check_password").addClass('border-red-600 focus:border-red-400 focus:outline-none focus:shadow-outline-red')
    }
}

function analyze_project(name_with_owner, month, file_path, remote_type, days, contri) {
    var waiting = _analyze_project(name_with_owner, month, file_path, remote_type, days, contri);
    var interval = setInterval(function () {
        if (waiting == false)
            clearInterval(interval);
        else
            waiting = _analyze_project(name_with_owner, month, file_path, remote_type, days, contri);
    }, 3000);
}

function select_month(contri) {
    var selected_date = $("#select_month option:selected").val()
    var now_url = location.pathname.split("?")[0]
    var move_url = now_url + selected_date
    if (contri != '')
        move_url += '&contri=' + contri
    location.href = move_url;
}

function go_back() {
    window.history.back()
}

function uncheck() {
    var checked_input = event.target
    checked_input.checked = false
}

function check() {
    var unchecked_input = event.target
    unchecked_input.checked = true
}
