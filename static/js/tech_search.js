let debounceTimeout;
let tech_list = document.querySelectorAll('.tech_list');


function search_tech(event) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        let tech_types = document.querySelectorAll(".side_tech_type");
        let search_value = document.getElementById("input_tech").value.toLowerCase();
        if (!search_value) {
            tech_list.forEach(target => {
                target.classList.remove('hidden');
            });
        } else {
            tech_list.forEach((entry, index) => {
                if (entry.children[1].textContent.toLowerCase().startsWith(search_value)) {
                    tech_list[index].classList.remove('hidden');
                } else {
                    tech_list[index].classList.add('hidden');
                }
            });
        }
        tech_types.forEach(tech_type_div => {
            let tech_card_list = tech_type_div.children[1].children;
            if (tech_card_list.length == tech_type_div.querySelectorAll('.hidden').length){
                tech_type_div.classList.add('hidden');
            } else {
                tech_type_div.classList.remove('hidden');
            }
        })
    }, 300);
}

function alert_not_exist(event){
    event.stopPropagation();
    alert(gettext('You do not have a commit about this tech'));
}

function find_ranking_user(event, github_id=null, tech_name=null) {
    event.stopPropagation();
    if (event.type != "click" && !(event.keyCode && event.keyCode == 13)){
        return;
    }

    if (!github_id){
        github_id = document.querySelector("#ranking_search_input").value;
    }

    if (!github_id){
        alert(gettext('Please input user'));
        return;
    }

    if (!tech_name){
        tech_name = document.querySelector("#tech_title").innerHTML;
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/find-user-page'
        ,method: 'POST'
        ,data: {'tech_name': tech_name, 'github_id': github_id}
        ,async: false
        ,success: function (data) {
            if(data.exist == true) {
                location.href = `/ranking/${tech_name}?github_id=${github_id}`;
            } else {
                alert(`'${github_id}' ${gettext('does not exist in this tech ranking')}`);
            }
        },
    });
}

function show_ranking_user() {
    const queryParams = new URLSearchParams(location.search);
    const search_user = queryParams.get('github_id');
    if (search_user){
        const user_trs = document.querySelectorAll('.user_tr');
        let focus_tag = document.getElementById(`${search_user}`);
        if (focus_tag){
            for (let user_tr of user_trs){
            user_tr.setAttribute('style', 'opacity: 0.2;');
            }
            focus_tag.setAttribute('style', 'opacity: 1;');
            focus_tag.scrollIntoView();
        }
    }
}

function reset_opacity() {
    const user_trs = document.querySelectorAll('.user_tr');
    for (let user_tr of user_trs){
    user_tr.setAttribute('style', 'opacity: 1;');
    }
}
