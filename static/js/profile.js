function developer_profile(github_id, edit) {
    var waiting = _developer_profile(github_id, edit);
    var interval = setInterval(function () {
        if (waiting == false)
            clearInterval(interval);
        else
            waiting = _developer_profile(github_id, edit);
    }, 3000);
}

function _developer_profile(github_id, edit){
    var waiting = false;
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: '/developer-profile'
        , method: 'POST'
        ,data:{'github_id':github_id, 'edit':edit}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            if (data.status == 200) {
                $("#under_header").html(data.content).attr('class', "h-full");
                top3_tech_stack(data.month_top_tech_data);
                analyze_top_projects(data.top3_proj_data);
                show_profile_calendar(data.calendar_data)
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
        },
    });
    return waiting;
}

function top3_tech_stack(data){
    let current_data = data.cur_month;
    let zero_list = [0,0,0,0,0]
    if (Object.keys(current_data).length == 0)
        current_data = {'Nodata1':zero_list, 'Nodata2':zero_list, 'Nodata3':zero_list};
    let last_month_data = data.last_month;
    if (Object.keys(last_month_data).length == 0)
        last_month_data = {'Nodata1':zero_list, 'Nodata2':zero_list, 'Nodata3':zero_list};
    const current_lines = Object.values(current_data);
    const last_month_lines = Object.values(last_month_data);
    const month_value = {};
    let now_date = new Date();
    let now_month = now_date.getMonth()+1;
    month_value['now_month'] = now_month;
    let last_month = new Date(now_date.setMonth(now_date.getMonth() - 1)).getMonth()+1;
    month_value['last_month'] = last_month;
    $("#month").text(now_month + '월의 코딩라인 수 Top3')
    for(let i = 0 ; i < Object.keys(last_month_data).length ; i++) {
        if (Object.keys(last_month_data)[i].includes('Nodata') == false)
            $("#top"+ `${i+1}`).after(`<div>
                        ${Object.keys(last_month_data)[i]}
                      </div>`)
    }
    let weeks;
    if (current_lines[0].length >= last_month_lines[0].length)
        weeks = current_lines[0].length;
    else
        weeks = last_month_lines[0].length;
    profile_stat(current_lines,last_month_lines,month_value,weeks);
}

function analyze_top_projects(data){
    const project_percentage = [];
    const project_information = data.result;
    const project_name = [];
    for(let i = 0 ; i < Object.keys(project_information).length ; i++){
        project_percentage.push(Object.values(project_information)[i]['project_contri']);
        project_name.push(Object.keys(project_information)[i].split('/').pop().split('.')[0]);
    }
    top_projects(project_percentage,project_name);
}

function edit_project(user, repo_url, action){
    const github_id = user
    const first_commit_date = document.querySelector('#first_commit_date')?`${document.querySelector('#first_commit_date').value}-01`:'';
    const last_commit_date = document.querySelector('#last_commit_date')?`${document.querySelector('#last_commit_date').value}-01`:'';
    const description = document.querySelector('#description')?document.querySelector('#description').value:'';
    const contri_description = document.querySelector('#contri_description')?document.querySelector('#contri_description').value:'';
    if(action=='delete'){
        if(!confirm("프로젝트를 삭제 하시겠습니까?")){
            return false
        }
    };

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
    url: '/update-top-project'
    , method: 'POST'
    , async: false
    , data: {
        'action': action,
        'github_id': github_id,
        'repo_url':repo_url,
        'first_commit_date': JSON.stringify(first_commit_date),
        'last_commit_date': JSON.stringify(last_commit_date),
        'description': description,
        'contri_description': contri_description,
    }
    , success: function (data) {
        window.location.reload();
    },
    error: function(data){
        alert("오류")
    }
    });
}

function pop_new_major_work(func, message, commit_id){
    const commit_message = document.querySelector('.commit_message');
    const major_work_input = document.querySelector('.major_work_input');
    commit_message.innerText = message;

    major_work_input.value = null;
    major_work_input.id = commit_id;
    major_work_input.action = 'create';
}

function pop_exist_major_work(func, message, label, major_work_id){
    const commit_message = document.querySelector('.commit_message');
    const major_work_input = document.querySelector('.major_work_input');
    commit_message.innerText = message;

    major_work_input.value = label;
    major_work_input.id = major_work_id;
    major_work_input.action = 'update'
}

function delete_major_work(){
    const major_work_input = document.querySelector('.major_work_input');
    major_work_input.action = 'delete'
    manage_major_work()
}

function manage_major_work(){
    const major_work_input = document.querySelector('.major_work_input');
    const req_id = major_work_input.id;
    const req_label = major_work_input.value;
    const action = major_work_input.action;
    const project_id = document.querySelector('.project_name').id;
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
    url: '/profile/major_work'
    , method: 'POST'
    , async: false
    , data: {
        'action': action,
        'req_id': req_id,
        'req_label': req_label,
        'project_id': project_id
    }
    , success: function (data) {
        if(data['status'] === 'success'){
            window.location.reload();
        } else if(data['status'] === 'empty input'){
            alert("값을 입력해주세요")
        }
    },
    error: function(data){
        alert("오류")
    }
    });
}

function add_projects_repo_url(){
    let github_id = $("#user_github_id").text()
    let input_repo_url = $("#input_repo_url").val();

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
    url: '/profile/top-project'
    , method: 'POST'
    , async: false
    , data: {'repo_url': input_repo_url, 'github_id':github_id, 'action': 'create'}
    , success: function (data) {
        window.location.reload();
    },
    });
}

function show_commit(repo_url, hash){
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.ajax({
            url: '/commit'
            , method: 'POST'
            , async: false
            , data: {'repo_url': repo_url, 'hash':hash}
            , success: function (data) {
                if (data.status == 'success') {
                    const diffString = `${data.commit}`
                let commit_msg = document.getElementById('commit_msg');
                let commit_date = document.getElementById('commit_date');
                let commit_author = document.getElementById('commit_author');
                let date = diffString.split('\n')[2].substr(7);

                commit_msg.innerText=diffString.split('\n')[4];
                commit_date.innerText = moment(date).format("YYYY-MM-DD HH:mm");
                commit_author.innerText = diffString.split('\n')[1].split(' ')[1]
                document.addEventListener('DOMContentLoaded', function () {
                    var targetElement = document.getElementById('myDiffElement');
                    var configuration = {
                        drawFileList: true,
                        fileListToggle: false,
                        fileListStartVisible: false,
                        fileContentToggle: false,
                        matching: 'lines',
                        synchronisedScroll: true,
                        highlight: true,
                        renderNothingWhenEmpty: false,
                    };
                    var diff2htmlUi = new Diff2HtmlUI(targetElement, diffString, configuration);
                    diff2htmlUi.draw();
                    diff2htmlUi.highlightCode();});
                } else {
                    $("#content").html(data.content);
                }
                },
        });
}

function show_profile_calendar(commit_data){
    let calendar_commits = commit_data;
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


function search_developer(num=1){
    const location = document.querySelector("input[name='location']").value;
    const search_list = ["position", "work_type", "job_seek"];
    const selected_list = new Array();
    const tech_skill_years = [];
    const tech_skills = $("#total_skill").children()
    for (const args of search_list){
        selected_list.push(this[`${args}_selected_list`] = Array.from(
            document.querySelector(`.${args}_search`).querySelectorAll("input[type='checkbox']:checked"),
            item => item.name
        ));
    };

    for(let i = 0; i<tech_skills.length;i++){
        let tech_skill = tech_skills[i].id.replace('_bar',' ').replace(/\s/gi, "");
        tech_skill = encode_letter(tech_skill);
        const tech_years_min = $(".left"+tech_skill).attr('style').replace(/[^0-9]/g, "")/10;
        const tech_years_max = 10-($(".right"+tech_skill).attr('style').replace(/[^0-9]/g, "")/10);
        const skillObj = {
            tech_skills: tech_skill,
            tech_years_min: tech_years_min,
            tech_years_max: tech_years_max
        };
        tech_skill_years.push(skillObj)
    }
    const data = {
        "location":location,
        "position": position_selected_list,
        "work_type": work_type_selected_list,
        "job_seek": job_seek_selected_list,
        "tech_skill_years": tech_skill_years,
        "page": num,
    }

    scroll(top);

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/company',
        method: 'POST',
        data: {"data": JSON.stringify(data)},
        success: function (data) {
             $("#search_box").children().remove();
             $("#search_box").html(data.content);
        },
    });
}
