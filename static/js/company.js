function search_tech(lang, tech,ex_tech=null) {
    $("#choice_tech").empty();
    let tech_skill = tech;
    let langs = Array.from(new Set(lang));
    let tech_lang = Array.from(new Set(tech_skill.concat(langs)));
    let baseUrl = new URL(document.location.href).origin;
    if (location.href == baseUrl+"/company-search"){
        let total_skill = $("#total_skill").children();
        for(let skill of total_skill){
            let tech_name = skill.id.replace('_bar','');
            let change_tech_name = encode_letter(tech_name);
            let tech_min = $('#'+change_tech_name+'_min').val();
            let tech_max = $('#'+change_tech_name+'_max').val();
            $("#choice_tech").append(`
            <div id="${change_tech_name}" min="${tech_min}" max="${tech_max}" class="flex rounded-full mt-1 bg-white text-blue-500 px-2 py-2 font-bold mr-2" style="width: min-content;height: min-content">
              <div class="mr-2 tech_name">${tech_name}</div>
              <svg class="my-auto" onclick="delete_tech(${change_tech_name})" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M0.882988 0.151497L5.00001 4.26852L9.11705 0.151497C9.31905 -0.0504989 9.6465 -0.0504989 9.8485 0.151497C10.0505 0.35349 10.0505 0.680994 9.8485 0.882988L5.7315 5.00001L9.8485 9.11705C10.0505 9.31905 10.0505 9.6465 9.8485 9.8485C9.6465 10.0505 9.31905 10.0505 9.11705 9.8485L5.00001 5.7315L0.882988 9.8485C0.680994 10.0505 0.35349 10.0505 0.151497 9.8485C-0.0504989 9.6465 -0.0504989 9.31905 0.151497 9.11705L4.26852 5.00001L0.151497 0.882988C-0.0504989 0.680994 -0.0504989 0.35349 0.151497 0.151497C0.35349 -0.0504989 0.680994 -0.0504989 0.882988 0.151497Z" fill="currentColor"></path>
              </svg>
            </div>`);
        };
    } else {
        if (ex_tech){
            for (let [skill, filter] of Object.entries(ex_tech)){
                let max_val = filter.max;
                let max_bar_fill = 10 - max_val;
                $("#choice_tech").append(`
                <div class="w-full" id="${skill}_bar">
                  <div class="flex">
                    <div class="font-bold text-gray-500 mb-3 tech_name">${skill}</div>
                    <div class="font-bold ml-3" id="${skill}_mintext">${filter.min == '0' ? "전체" : filter.min + "년" }</div>
                    <div class="font-bold ml-2">-</div>
                    <div class="font-bold ml-2" id="${skill}_maxtext">${filter.max}년</div>
                    <div class="flex rounded-full mt-1 text-blue-500 px-2 py-1 font-bold mr-2" style="width: min-content;height: min-content">
                      <svg class="my-auto" onclick="delete_tech(${skill}_bar)" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M0.882988 0.151497L5.00001 4.26852L9.11705 0.151497C9.31905 -0.0504989 9.6465 -0.0504989 9.8485 0.151497C10.0505 0.35349 10.0505 0.680994 9.8485 0.882988L5.7315 5.00001L9.8485 9.11705C10.0505 9.31905 10.0505 9.6465 9.8485 9.8485C9.6465 10.0505 9.31905 10.0505 9.11705 9.8485L5.00001 5.7315L0.882988 9.8485C0.680994 10.0505 0.35349 10.0505 0.151497 9.8485C-0.0504989 9.6465 -0.0504989 9.31905 0.151497 9.11705L4.26852 5.00001L0.151497 0.882988C-0.0504989 0.680994 -0.0504989 0.35349 0.151497 0.151497C0.35349 -0.0504989 0.680994 -0.0504989 0.882988 0.151497Z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </div>
                  <input type="range" id="${skill}_min" min="0" max="10" value="${filter.min}"/>
                  <input type="range" id="${skill}_max" min="0" max="10" value="${filter.max}"/>
                  <div class="career_slider mb-3">
                    <div class="track"></div>
                    <div class="range range${skill}" style="left: ${filter.min}0%; right: ${max_bar_fill}0%;"></div>
                    <div class="thumb left left${skill}" style="left: ${filter.min}0%;"></div>
                    <div class="thumb right right${skill}" style="right: ${max_bar_fill}0%;"></div>
                  </div>
                </div>
                `);
                career_bar(skill);
            };
        };
    };
    function autocomplete(inp, arr) {
        var currentFocus;
        inp.addEventListener("input", function (e) {
            var a, b, i, val = this.value;
            closeAllLists();
            if (!val) {
                return false;
            }
            currentFocus = -1;
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items scroll");
            this.parentNode.appendChild(a);
            for (i = 0; i < arr.length; i++) {
                if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    b = document.createElement("DIV");
                    b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].substr(val.length);
                    b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                    b.addEventListener("click", function (e) {
                        inp.value = this.getElementsByTagName("input")[0].value;
                        let tech_name = encode_letter(inp.value)
                        if(!$("#choice_tech #" + tech_name).length){
                          if (location.href == baseUrl+"/company-search") {
                            $("#choice_tech").append(`
                                <div id="${tech_name}" min="0" max="10" class="flex rounded-full mt-1 bg-white text-blue-500 px-2 py-2 font-bold mr-2" style="width: min-content;height: min-content">
                                  <div class="mr-2 tech_name">${inp.value}</div>
                                  <svg class="my-auto" onclick="delete_tech(${tech_name})" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M0.882988 0.151497L5.00001 4.26852L9.11705 0.151497C9.31905 -0.0504989 9.6465 -0.0504989 9.8485 0.151497C10.0505 0.35349 10.0505 0.680994 9.8485 0.882988L5.7315 5.00001L9.8485 9.11705C10.0505 9.31905 10.0505 9.6465 9.8485 9.8485C9.6465 10.0505 9.31905 10.0505 9.11705 9.8485L5.00001 5.7315L0.882988 9.8485C0.680994 10.0505 0.35349 10.0505 0.151497 9.8485C-0.0504989 9.6465 -0.0504989 9.31905 0.151497 9.11705L4.26852 5.00001L0.151497 0.882988C-0.0504989 0.680994 -0.0504989 0.35349 0.151497 0.151497C0.35349 -0.0504989 0.680994 -0.0504989 0.882988 0.151497Z" fill="currentColor"></path>
                                  </svg>
                                </div>`);
                            $("#myInput").val('');
                            $("#error_text").text('');
                          } else {
                            add_tech_job(tech_name);
                          };
                        }else{
                            $("#error_text").text('이미 추가한 기술입니다.');
                        }
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        });
        inp.addEventListener("keydown", function (e) {
            var x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode == 40) {
                currentFocus++;
                addActive(x);
            } else if (e.keyCode == 38) {
                currentFocus--;
                addActive(x);
            } else if (e.keyCode == 13) {
                e.preventDefault();
                if (currentFocus > -1) {
                    if (x) x[currentFocus].click();
                }
            }
        });

        function addActive(x) {
            if (!x) return false;
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            x[currentFocus].classList.add("autocomplete-active");
        }

        function removeActive(x) {
            for (var i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }

        function closeAllLists(elmnt) {
            var x = document.getElementsByClassName("autocomplete-items");
            for (var i = 0; i < x.length; i++) {
                if (elmnt != x[i] && elmnt != inp) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }
        document.addEventListener("click", function (e) {
            closeAllLists(e.target);
        });
    }
    autocomplete(document.getElementById("myInput"), tech_lang);
};

function delete_tech(index){
    $(index).remove();
}

function add_tech_tag(id){
    let tech_name = encode_letter(id);

    if(!$("#"+tech_name).length){
        $("#choice_tech").append(`
        <div id=${tech_name} min="0" max="10" class="flex rounded-full mt-1 bg-white text-blue-500 px-2 py-2 font-bold mr-2" style="width: min-content;height: min-content">
          <div class="mr-2 tech_name">${id}</div>
          <svg class="my-auto" onclick="delete_tech(${tech_name})" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M0.882988 0.151497L5.00001 4.26852L9.11705 0.151497C9.31905 -0.0504989 9.6465 -0.0504989 9.8485 0.151497C10.0505 0.35349 10.0505 0.680994 9.8485 0.882988L5.7315 5.00001L9.8485 9.11705C10.0505 9.31905 10.0505 9.6465 9.8485 9.8485C9.6465 10.0505 9.31905 10.0505 9.11705 9.8485L5.00001 5.7315L0.882988 9.8485C0.680994 10.0505 0.35349 10.0505 0.151497 9.8485C-0.0504989 9.6465 -0.0504989 9.31905 0.151497 9.11705L4.26852 5.00001L0.151497 0.882988C-0.0504989 0.680994 -0.0504989 0.35349 0.151497 0.151497C0.35349 -0.0504989 0.680994 -0.0504989 0.882988 0.151497Z" fill="currentColor"></path>
          </svg>
        </div>`);
        $("#error_text").text('');
    }else{
        $("#error_text").text('이미 추가한 기술입니다.');
    }
}

function add_tech_job(tech){
    let tech_name = encode_letter(tech);
        tech_name = encode_letter(tech_name);
        let min_val = '0';
        let min_text = '전체';
        let max_val = 10;
        let max_bar_fill = 10 - max_val;
    if (!$("#"+tech_name+"_bar").length) {
        $("#choice_tech").append(`
            <div class="w-full" id="${tech_name}_bar">
              <div class="flex">
                <div class="font-bold text-gray-500 mb-3 tech_name">${tech_name}</div>
                <div class="font-bold ml-3" id="${tech_name}_mintext">${min_text}</div>
                <div class="font-bold ml-2">-</div>
                <div class="font-bold ml-2" id="${tech_name}_maxtext">${max_val}년</div>
                <div class="flex rounded-full mt-1 text-blue-500 px-2 py-1 font-bold mr-2" style="width: min-content;height: min-content">
                  <svg class="my-auto" onclick="delete_tech(${tech_name}_bar)" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M0.882988 0.151497L5.00001 4.26852L9.11705 0.151497C9.31905 -0.0504989 9.6465 -0.0504989 9.8485 0.151497C10.0505 0.35349 10.0505 0.680994 9.8485 0.882988L5.7315 5.00001L9.8485 9.11705C10.0505 9.31905 10.0505 9.6465 9.8485 9.8485C9.6465 10.0505 9.31905 10.0505 9.11705 9.8485L5.00001 5.7315L0.882988 9.8485C0.680994 10.0505 0.35349 10.0505 0.151497 9.8485C-0.0504989 9.6465 -0.0504989 9.31905 0.151497 9.11705L4.26852 5.00001L0.151497 0.882988C-0.0504989 0.680994 -0.0504989 0.35349 0.151497 0.151497C0.35349 -0.0504989 0.680994 -0.0504989 0.882988 0.151497Z" fill="currentColor"></path>
                  </svg>
                </div>
              </div>
              <input type="range" id="${tech_name}_min" min="0" max="10" value="${min_val}"/>
              <input type="range" id="${tech_name}_max" min="0" max="10" value="${max_val}"/>
              <div class="career_slider mb-3">
                <div class="track"></div>
                <div class="range range${tech_name}" style="left: ${min_val}0%; right: ${max_bar_fill}0%;"></div>
                <div class="thumb left left${tech_name}" style="left: ${min_val}0%;"></div>
                <div class="thumb right right${tech_name}" style="right: ${max_bar_fill}0%;"></div>
              </div>
            </div>
        `);
        $("#error_text").text('');
        career_bar(tech_name);
    } else {
        $("#error_text").text('이미 추가한 기술입니다.');
    };
};

function career_bar(tech_name){
    tech_name = encode_letter(tech_name);
    const inputLeft = document.getElementById(tech_name+"_min");
    const inputRight = document.getElementById(tech_name+"_max");

    const thumbLeft = document.querySelector(".career_slider > .thumb.left"+tech_name);
    const thumbRight = document.querySelector(".career_slider > .thumb.right"+tech_name);
    const range = document.querySelector(".career_slider > .range"+tech_name);

    const setLeftValue = () => {
        const _this = inputLeft;
        let min_year = _this.value;
        const [min, max] = [parseInt(_this.min), parseInt(_this.max)];

        min_year = Math.min(parseInt(min_year), parseInt(inputRight.value) - 1);

        const percent = ((min_year - min) / (max - min)) * 100;
        thumbLeft.style.left = percent + "%";
        range.style.left = percent + "%";

        if(min_year == 0){
            $("#"+tech_name+"_mintext").text("전체");
        }else{
            $("#"+tech_name+"_mintext").text(min_year+"년");
        }
    };

    const setRightValue = () => {
        const _this = inputRight;
        const [min, max] = [parseInt(_this.min), parseInt(_this.max)];
        let max_year = _this.value;
        max_year = Math.max(parseInt(max_year), parseInt(inputLeft.value) + 1);

        const percent = ((max_year - min) / (max - min)) * 100;
        thumbRight.style.right = 100 - percent + "%";
        range.style.right = 100 - percent + "%";
        $("#"+tech_name+"_maxtext").text(max_year+"년");
    };

    inputLeft.addEventListener("input", setLeftValue);
    inputRight.addEventListener("input", setRightValue);
}

function save_tech(){
    $("#total_skill").empty();
    let choice_tech = $("#choice_tech").children();
    for(let i = 0 ; i <choice_tech.length;i++){
        let tech_name = choice_tech[i].innerText
        tech_name = encode_letter(tech_name);

        let min_val = choice_tech[i].getAttribute('min');
        let min_text;
        if (min_val == '0')
            min_text = '전체';
        else
            min_text =  min_val+'년';
        let max_val = choice_tech[i].getAttribute('max');
        let max_bar_fill = 10 - max_val;
         $("#total_skill").append(`
            <div class="w-full" id="${choice_tech[i].innerText}_bar">
              <div class="flex">
                <div class="font-bold text-gray-500 mb-3 tech_name">${choice_tech[i].innerText}</div>
                <div class="font-bold ml-3" id="${tech_name}_mintext">${min_text}</div>
                <div class="font-bold ml-2">-</div>
                <div class="font-bold ml-2" id="${tech_name}_maxtext">${max_val}년</div>
              </div>
              <input type="range" id="${tech_name}_min" min="0" max="10" value="${min_val}"/>
              <input type="range" id="${tech_name}_max" min="0" max="10" value="${max_val}"/>
    
              <div class="career_slider mb-3">
                <div class="track"></div>
                <div class="range range${tech_name}" style="left: ${min_val}0%; right: ${max_bar_fill}0%;"></div>
                <div class="thumb left left${tech_name}" style="left: ${min_val}0%;"></div>
                <div class="thumb right right${tech_name}" style="right: ${max_bar_fill}0%;"></div>
              </div>
            </div>`);

        career_bar(choice_tech[i].innerText);
    }
}


function create_company(){
    const not_null_list = document.querySelectorAll(".not_null");
    for (const item of not_null_list){
        if(item.value == ''){
            return document.querySelector("#check_msg").innerText = `${item.placeholder}이(가) 입력되지 않았습니다.`;
        }
    }
    const email_re = /([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@[A-Za-z0-9-]+(\.[A-Z|a-z]{2,})+/;
    const email = $("#email").val();
    const password = $("#password").val();
    const password_confirm = $("#password_confirm").val();
    const name = $("#name").val();
    const address = $("#address").val();
    const homepage = $("#homepage").val();
    const business_type = $("#business_type").val();
    const employees_count = $("#employees_count").val();
    const business_registration_number = $("#business_registration_number").val();
    const ceo = $("#ceo").val();
    const manager_name = $("#manager_name").val();
    const phone_number = $("#phone_number").val();
    const data = {
        "email": email,
        "password": password,
        "password_confirm": password_confirm,
        "name": name,
        "address": address,
        "homepage": homepage,
        "business_type": business_type,
        "employees_count": employees_count,
        "business_registration_number": business_registration_number,
        "ceo": ceo,
        "manager_name": manager_name,
        "phone_number": phone_number,
    };
    
    if(email_re.test(email) == false){
        return($("#check_msg").text(gettext("Invalid email")))
    };
    if(email == '' || password == ''){
        return($("#check_msg").text(gettext("Please enter your ID and password.")))
    };
    if(password != password_confirm){
        return($("#check_msg").text(gettext("Confirm password")))
    };
    
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + '/company/signup', 
        method: 'POST', 
        data: data, 
        async: false, 
        success: function (data) {
            if (data['response'] == 'created'){
                location.href = check_lang_code() + '/company/login';
            } else {
                document.querySelector("#check_msg").innerText = data['response'];
            }
        }
    })
}

function company_login(){
    const email_re = /([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@[A-Za-z0-9-]+(\.[A-Z|a-z]{2,})+/;
    const email = $("#email").val();
    const password = $("#password").val();
    const data = {
        "email": email,
        "password": password,
    };

    if(email_re.test(email) == false){
        return($("#login_error").text(gettext("Invalid email")))
    };
    if(email == '' || password == ''){
        return($("#login_error").text(gettext("Please enter your ID and password.")))
    };

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + '/company/login',
        method: 'POST',
        data: data,
        async: false,
        success: function (data) {
            if (data['response'] == 'complete'){
                location.href = check_lang_code() + '/company/main';
            } else {
                document.querySelector("#login_error").innerText = data['response'];
            }
        }
    })
}

function select_manager(ex_manager_id=null){
    const selected_manager_id = ex_manager_id ? ex_manager_id : document.querySelector("#manager").value
    const manager_list = document.querySelectorAll(".manager_list")
    for (const manager_div of manager_list){
        manager_id = manager_div.id.split("manager_")[1]
        if (manager_id != selected_manager_id){
            manager_div.setAttribute("style", "display:none")
        } else {
            manager_div.setAttribute("style", "display:block")
        }
    }
}

function upload_job(job_id=null){
    const create_error = document.querySelector("#create_error")
    const name = document.querySelector("#name")
    const position = document.querySelector("#position")
    const tech_exp = document.querySelector("#choice_tech");
    const tech_dict = {};
    for (let tech of tech_exp.children){
        const tech_name = tech.id.split("_")[0];
        tech_dict[tech_name] = {'min': null, 'max': null};
        tech_dict[tech_name]['min'] = tech.querySelector(`#${tech_name}_min`).value;
        tech_dict[tech_name]['max'] = tech.querySelector(`#${tech_name}_max`).value;
    };
    const exp =document.querySelector("#exp_select")
    const employment_type = Array.from(document.querySelector("#employment_type_check_box").querySelectorAll("input[type='checkbox']:checked"), item => item.value)
    const employment_count = document.querySelector("#employment_count")
    const job_role = document.querySelector("#job_role")
    const require = document.querySelector("#require")
    const prefer = document.querySelector("#prefer")
    const work_type = document.querySelector("#work_type")
    const working_day = document.querySelector("#working_day")
    const working_time_start = document.querySelector("#working_time_start")
    const working_time_end = document.querySelector("#working_time_end")
    
    const working_address = document.querySelector("#working_address")
    const working_area = document.querySelector("#working_area").querySelector("input[name='country']:checked")
    const outwork = document.querySelector("#outwork").checked;
    const job_start = document.querySelector("#job_start")
    const job_finish = document.querySelector("#job_finish")
    const selected_manager_id = document.querySelector("#manager")
    const default_img_root = '/static/img/profile.png';
    const main_img_file = document.querySelector("#company_logo");
    const main_img = document.querySelector("#company_logo_img");

    const value_check_list = [name, position, exp, employment_count, job_role, require, prefer, work_type, working_day, working_time_start, working_time_end, working_address, working_area, job_start, job_finish]

    for(let item of value_check_list){
        if(item.value == ''){
            item.placeholder = "필수입력 사항입니다."
            item.setAttribute("style", "background-color: rgba(0,0,0,0.05);")
            item.focus()
            return create_error.innerText = `${item.id} is missed`
        } else{
            item.placeholder = ""
            item.removeAttribute("style")
        }
    }

    if (job_start.value >= job_finish.value){
        job_finish.focus();
        return create_error.innerText = "공고 종료일은 시작일보다 나중이어야합니다."
    }

    const data = {
        'name': name.value,
        'position': position.value,
        'tech_exp': JSON.stringify(tech_dict),
        'exp': exp.value,
        'employment_type': JSON.stringify(employment_type),
        'employment_count': employment_count.value,
        'job_role': job_role.value,
        'require': require.value,
        'prefer': prefer.value,
        'work_type': work_type.value,
        'working_day': working_day.value,
        'working_time': JSON.stringify([working_time_start.value, working_time_end.value]),
        'working_address': working_address.value,
        'working_area': working_area.value,
        'outwork': outwork,
        'job_start': job_start.value,
        'job_finish': job_finish.value,
        'selected_manager_id': selected_manager_id.value,
    }

    let formData = new FormData();
    for (let item in data){
        formData.append(item, data[item]);
    }

    if (main_img.src.includes(default_img_root)){
        formData.append("is_default_logo", "true");
    } else {
        formData.append("is_default_logo", "false");
        formData.append("main_img", main_img_file.files[0]);
    };

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain){
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: job_id ? check_lang_code() + `/company/job/${job_id}` :check_lang_code() + '/company/job',
        method: 'POST',
        processData: false,
        contentType: false,
        data: formData,
        async: false,
        success: function (data) {
            if (data['response'] == 'created'){
                location.href = check_lang_code() + '/company/main';
            } else if(data['response'] == 'updated'){
                location.href = check_lang_code() + `/company/job/${job_id}`
            } else {
                create_error.innerText = data["response"];
            }
        }
    })
}

function add_dot(textarea){
    if(textarea.value == ''){
        textarea.value += '• '
    }
}

function show_logo(){
    const company_logo = document.querySelector("#company_logo");
    const company_logo_img = document.querySelector("#company_logo_img");
    company_logo_img.src = URL.createObjectURL(company_logo.files[0]);
}

function delete_logo(){
    const default_img_root = '/static/img/profile.png';
    const company_logo_img = document.querySelector("#company_logo_img");
    company_logo_img.src = default_img_root;
}

function send_company_info(){
    const default_img_root = '/static/img/profile.png';
    const company_logo = document.querySelector("#company_logo");
    const company_logo_img = document.querySelector("#company_logo_img");
    const value_check_list = document.querySelectorAll(".company_info");
    const welfare_list = Array.from(document.querySelector("#welfare_div").querySelectorAll("input[type='checkbox']:checked"), item => item.value);
    let formData = new FormData();

    for (let item of value_check_list){
        if (item.value == ''){
            item.focus()
            return true
        }
    };

    for (let item of value_check_list){
        formData.append(item.id, item.value);
    };
    formData.append("welfare", JSON.stringify(welfare_list));

    if (company_logo_img.src.includes(default_img_root)){
        formData.append("is_default_logo", "true");
    } else{
        formData.append("is_default_logo", "false");
        formData.append("company_logo", company_logo.files[0]);
    };

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain){
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + "/company/information",
        method: 'POST',
        processData: false,
        contentType: false,
        data: formData,
        async: false,
        success: function (data) {
            if (data["response"] == "updated") {
                window.location.reload()
            } else {
                create_error.innerText = data["response"];
            }
        }
    });
}

function pop_adding_manager(){
    const manager_modal = document.querySelector("#manager_modal");
    manager_modal.style.display = "flex";
}

function down_adding_manager(){
    const manager_modal = document.querySelector("#manager_modal");
    const info_list = document.querySelectorAll(".manager_info");
    const error_div = document.querySelector("#manager_error");
    for (const info of info_list){
        info.value = ''
        info.placeholder = ''
        error_div.innerText = ''
    }
    manager_modal.style.display = "none";
}

function add_manager(){
    const partial_manager_div = document.querySelector("#partial_manager_div");
    const error_div = document.querySelector("#manager_error");
    const info_list = document.querySelectorAll(".manager_info");
    const email_re = /([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@[A-Za-z0-9-]+(\.[A-Z|a-z]{2,})+/;
    const data = new Object();
    for (const info_item of info_list){
        if (info_item.value == ''){
            info_item.focus()
            info_item.placeholder = "This is required"
            return true
        } else if (info_item.id == 'manager_email_add' && email_re.test(info_item.value) == false) {
            error_div.innerText = "Please input valid format of email"
            return false
        } else {
            data[info_item.id] = info_item.value;
        }
    };

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain){
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + "/company/manager",
        method: 'POST',
        data: data,
        async: false,
        success: function (data) {
            if (data["response"] == "created") {
                alert("New manager has been added")
                partial_manager_div.innerHTML = data["content"];
                down_adding_manager();
            } else {
                error_div.innerText = data["response"];
            }
        }
    });
}

function job_status(event, action, id){
    if (action == 'delete'){
        if (!confirm("Would you delete this job?")){
            return false
        }
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain){
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: check_lang_code() + "/company/job-status",
        method: 'POST',
        data: {
            "action": action,
            "id": id,
            "status": event.target.value
        },
        async: false,
        success: function (data) {
            window.location.reload();
        }
    });
}

function click_focus(click_val){
    $("." + click_val).addClass('focus')
}

function out_focus(val,name){
    if(val.value == ''){
        $("."+name).removeClass('focus');
    }
}

function copy_job_posting_link(job_id){
    let baseUrl = new URL(document.location.href).origin;
    let link = baseUrl + "/company/job/"+job_id+"/detail";
    navigator.clipboard.writeText(link);
    alert("링크가 복사되었습니다.");
}
