let debounceTimeout;
let tech_list = document.querySelectorAll('.tech_list');


function search_tech(event) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
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
    }, 300);
}

function find_ranking_user(event, github_id=null) {
    if (event.type != "click" && !(event.keyCode && event.keyCode == 13)){
        return;
    }

    if (!github_id){
        github_id = document.querySelector("#ranking_search_input").value;
    }

    if (!github_id){
        alert('Please input user');
        return;
    }

    let tech_name = document.querySelector("#tech_title").innerHTML;

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
        ,data: {'tech_name': tech_name, 'search_user': github_id}
        ,async: false
        ,success: function (data) {
            if(data.exist == true) {
                location.href = `/ranking/${tech_name}?page=${data.search_user_page_number}&search_user=${data.search_user}`;
            } else {
                alert(`'${github_id}' does not exist in this tech ranking`);
            }
        },
    });
}

function show_ranking_user() {
    const queryParams = new URLSearchParams(location.search);
    const search_user = queryParams.get('search_user');
    if (search_user){
        const user_trs = document.querySelectorAll('.user_tr');
        let focus_tag = document.querySelector(`#${search_user}`);
        if (focus_tag){
            for (let user_tr of user_trs){
            user_tr.setAttribute('style', 'opacity: 0.2;');
            }
            focus_tag.setAttribute('style', 'opacity: 1;');
            focus_tag.scrollIntoView();
        } else {
            alert(`${search_user} does not exist in ranking`);
        }
    }
}
