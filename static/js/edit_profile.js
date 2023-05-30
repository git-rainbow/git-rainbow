function add(id) {
    $("#" + id).attr('style', 'display:' + ($("#" + id).css('display') === 'block' ? 'none' : 'block'));
    let input = $("#" + id).find('input');
    let textarea = $("#" + id).find('textarea');

    $(input).val('').attr('style','border:1px solid black');
    $(textarea).val('').attr('style','border:1px solid black');
}

function edit_add(id){
    $("#edit_work"+id).remove();
    $("#edit_education"+id).remove();
    $("#edit_activity"+id).remove();
    $("#edit_award"+id).remove();
    $("#work"+id).show();
    $("#education"+id).show();
    $("#activity"+id).show();
    $("#award"+id).show();
}

//work experience
function edit_personal_info(){
    let name = $("#name").val();
    let github_id = $("#user_github_id").text();
    let bio = $("#bio").val();
    let location = $("#location").val();
    let company = $("#company").val();
    let email = $("#email").val();
    let blog = $("#blog").val();
    let profile_image = $("#profile_image")[0].files[0];
    let img_reset = $("#img_reset").val()
    let position = JSON.stringify(Array.from(document.querySelectorAll(".position_round"), item => item.id));
    let formData = new FormData();
    let default_img_root = '/static/img/profile.png'
    let work_type = [];
    let jobseek = [];

    $("input[name=work_type]:checked").each(function (){
        let val = $(this).val();
        work_type.push(val);
    });
    work_type = JSON.stringify(work_type);

    $("input[name=jobseek]:checked").each(function (){
        let val = $(this).val();
        jobseek.push(val);
    });

    if (img_reset == 'checked' && $("#user_img").attr('src') == default_img_root){
        formData.append('img_reset', img_reset)
    } else {
        formData.append("profile_image", profile_image)
    }
    formData.append('github_id', github_id)
    formData.append('user_name', name)
    formData.append('bio', bio)
    formData.append('location', location)
    formData.append('company', company)
    formData.append('email', email)
    formData.append('link', blog)
    formData.append('position', position)
    formData.append('job_seek', jobseek)
    formData.append('work_type', work_type)

    const userData = {
        email: email,
        link: blog,
        location: location
    };

    Object.entries(userData).forEach(([key, value]) => {
        if (!value) {
            value = '-';
        }
        $(`#user_${key}`).text(value);
    });

     $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/update-personal-info'
        , method: 'POST'
        , processData: false
        , contentType: false
        , data: formData
        , async: false
        , dataType: "Json"
        , success: function (data) {
            window.location.reload();
        },
    });
}

function save_work(){
    let github_id = $("#user_github_id").text();
    let start_work = $("#start-work").val();
    let end_work = $("#end-work").val();
    let company_name = $("#company_name").val();
    let job = $("#job").val();
    let keyword = $("#keyword").val();
    let link = $("#link").val();
    let description = $("#work_description").val();

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/profile/exp'
        , method: 'POST'
        ,data:{'github_id':github_id,'start':start_work,'end':end_work, 'company':company_name,'position':job, 'tech':keyword,
            'link':link, 'description':description, 'action': 'create'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            let id = data.new_work_exp_id;
            if(data.status == 'fail'){
                if(start_work == ''){
                    $("#start-work").attr('style','border:1px solid red !important');
                } if(keyword == ''){
                    $("#keyword").attr('style','border:1px solid red !important');
                } if(description == ''){
                    $("#work_description").attr('style','border:1px solid red !important');
                }
            }else{
                $("#work").attr('style','display:none');
                const inputs = [
                  'start-work',
                  'end-work',
                  'company_name',
                  'job',
                  'keyword',
                  'link',
                  'work_description'
                ];

                inputs.forEach(input => {
                  $(`#${input}`).val('');
                  $(`#${input}`).attr('style','border:1px solid black');
                });

                $("#work_experience").append(`
                <div id="work${id}">
                <div class="grid xl:grid-cols-2-1 mb-3">
                  <div class="flex">
                    <span id="work_date_start${id}" class="text-gray-500">${start_work}</span>
                    <span> ~ </span>
                    <span id="work_date_end${id}">${end_work}</span>
                  </div>
                  <div class="flex flex-col mt-3">
                    <div class="flex justify-between">
                      <div class="flex">
                        <span id="work_company${id}" class="font-semibold text-xl">${company_name}</span>
                        <span id="work_position${id}" class="my-auto mr-2">(${job})</span>
                      </div>
                      <div class="flex">
                        <svg class="my-auto mr-2" onclick="edit_work(${id})" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-pencil">
                          <path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                        </svg>
                        <svg class="my-auto" onclick="delete_work(${id})" fill="red" viewBox="0 0 24 24" width="1em" height="1em">
                          <path d="M18.707 5.293a1 1 0 0 0-1.414 0L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0 0-1.414z"></path>
                        </svg>
                      </div>
                    </div>
                    <a href="${link}">
                      <span id="work_link${id}">${link}</span>
                    </a>
                    <span id="work_description${id}">${description}</span>
                    <div class="flex-row mt-3">
                      <span id="work_tech${id}"style="width: min-content" class="md:space px-2 py-1 mr-2 font-semibold leading-tight bg-gray-100" style="font-size: 1rem">${keyword}</span>
                    </div>
                  </div>
                </div>
                </div>`);}
            },
    });
}

function edit_work(id) {
    let work_date_start = $("#work_date_start"+id).text().replace('.','-');
    let work_date_end = $("#work_date_end"+id).text().replace('.','-');
    let work_company = $("#work_company"+id).text();
    let work_position = $("#work_position"+id).text().replace('(','').replace(')','');
    let work_link = $("#work_link"+id).text();
    let work_description = $("#work_description"+id).text();
    let work_tech = $("#work_tech"+id).text().replace(/(\s*)/g,'');

    $("#work"+id).hide();
    $("#work"+id).after(
        `<div class="flex flex-col border pr-2 pb-2" id="edit_work${id}">
            <div class="grid xl:grid-cols-2-1 p-3">
              <div class="flex flex-col mb-2" style="width: min-content">
                <div class="flex flex-col mb-3">
                  <div class="flex">
                    <span class="text-red-600 font-bold mr-2">*</span>
                    <span class="mb-2" style="width: auto">업무시작</span>
                  </div>
                  <input type="month" id="edit_date_start${id}" value="${work_date_start}"
                         class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3"
                         placeholder="업무시작">
                </div>
                <div class="flex flex-col">
                  <span class="mb-2">업무종료</span>
                  <input type="month" id="edit_date_end${id}" value="${work_date_end}"
                         class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3"
                         style="width: min-content" placeholder="업무종료">
                </div>
              </div>
              <div class="flex flex-col">
                <div class="flex flex-col">
                  <span class="mb-2">회사 이름</span>
                  <input type="text" id="edit_company_name${id}" value="${work_company}" placeholder="회사이름"
                         class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
                </div>
                <div class="flex flex-col">
                  <span class="mb-2">직무</span>
                  <input type="text" id="edit_position${id}" value="${work_position}" placeholder="프론트엔드개발 담당"
                         class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
                </div>
                <div class="flex flex-col">
                  <div class="flex">
                    <span class="text-red-600 font-bold mr-2">*</span>
                    <span class="mb-2">주요 기술 키워드</span>
                  </div>
                  <input type="text" id="edit_keyword${id}" value="${work_tech}" placeholder="주요 기술 입력"
                         class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
                </div>
                <div class="flex flex-col">
                  <span class="mb-2">기타 링크</span>
                  <input type="text" id="edit_link${id}" value="${work_link}" placeholder="https://"
                         class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
                </div>
                <div class="flex flex-col">
                  <div class="flex">
                    <span class="text-red-600 font-bold mr-2">*</span>
                    <span class="mb-2">기타 설명</span>
                  </div>
                  <textarea type="text" id="edit_description${id}" cols="3" placeholder="기타 설명을 입력해 주세요"
                            class="border px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">${work_description}</textarea>
                </div>
              </div>
            </div>
            <footer class="flex justify-end">
              <button onclick="edit_add(${id})"
                      class="py-2 px-3 mr-1 text-sm font-medium transition-colors duration-150 border border-gray-300 rounded-lg sm:px-4 sm:py-2 sm:w-auto active:bg-transparent hover:border-gray-500 focus:border-gray-500 active:text-gray-500 focus:outline-none">
                취소
              </button>
              <button onclick="edit_save(${id})"
                class="py-2 px-3 text-sm font-medium text-white transition-colors duration-150 bg-blue-500 border border-transparent rounded-lg sm:w-auto sm:px-4 sm:py-2 focus:outline-none">
                저장
              </button>
            </footer>
         </div>`
    )
}

function edit_save(id){
    let github_id = $("#user_github_id").text();
    let edit_date_start = $("#edit_date_start"+id).val();
    let edit_date_end = $("#edit_date_end"+id).val();
    let edit_company_name = $("#edit_company_name"+id).val();
    let edit_position = $("#edit_position"+id).val();
    let edit_keyword = $("#edit_keyword"+id).val();
    let edit_link = $("#edit_link"+id).val();
    let edit_description = $("#edit_description"+id).val();

    $.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
    });

    $.ajax({
        url: '/profile/exp'
        , method: 'POST'
        ,data:{'github_id':github_id,'work_exp_id':id,'start':edit_date_start,'end':edit_date_end, 'company':edit_company_name,
            'position':edit_position, 'tech':edit_keyword, 'link':edit_link, 'description':edit_description, 'action': 'update'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            if(data.status == 'fail'){
                if(edit_date_start == ''){
                    $("#edit_date_start"+id).attr('style','border:1px solid red !important');
                }if(edit_keyword == ''){
                    $("#edit_keyword"+id).attr('style','border:1px solid red !important');
                }if(edit_description == ''){
                    $("#edit_description"+id).attr('style','border:1px solid red !important');
                }
            }else{
                $("#work"+id).show();
                $("#work"+id).html(`
                <div class="grid xl:grid-cols-2-1 mb-3">
                  <div class="flex">
                    <span id="work_date_start${id}" class="text-gray-500">${edit_date_start}</span>
                    <span> ~ </span>
                    <span id="work_date_end${id}">${edit_date_end}</span>
                  </div>
                  <div class="flex flex-col">
                    <div class="flex justify-between">
                      <div>
                        <span id="work_company${id}" class="font-semibold text-xl">${edit_company_name}</span>
                        <span id="work_position${id}" class="my-auto text-sm ml-2 text-gray-500">(${edit_position})</span>
                      </div>
                      <div class="flex">
                        <svg class="my-auto mr-2" onclick="edit_work(${id})" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-pencil">
                          <path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                        </svg>
                        <svg class="my-auto" onclick="delete_work(${id})" fill="red" viewBox="0 0 24 24" width="1em" height="1em">
                          <path d="M18.707 5.293a1 1 0 0 0-1.414 0L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0 0-1.414z"></path>
                        </svg>
                      </div>
                    </div>
                    <span>
                      <a id="work_link${id}" href="${edit_link}">${edit_link}</a>
                    </span>
                    <span id="work_description${id}">${edit_description}</span>
                    <div class="flex-row mt-3">
                      <span id="work_tech${id}" style="width: min-content" class="md:space px-2 py-1 mr-2 font-semibold leading-tight bg-gray-100"
                            style="font-size: 1rem">
                        ${edit_keyword}
                      </span>
                    </div>
                  </div>
                </div>`);
                $("#edit_work"+id).remove();
            }
        },
    });
}
function delete_work(id){
    let github_id = $("#user_github_id").text();
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/profile/exp'
        , method: 'POST'
        ,data:{'github_id':github_id,'work_exp_id': id,'action': 'delete'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            $("#work"+id).empty();
        },
    });
}

//award
function award_create() {
    let title = $("#award_content").val();
    let date = $("#award_date").val();
    let description = $("#add_content").val();
    let github_id = $("#user_github_id").text();

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/profile/award'
        ,method: 'POST'
        ,data:
            {
                'github_id': github_id, 'action': 'create',
                'title': title, 'date': date, 'description': description
            }
        ,async: false
        ,success: function (data) {
            let award_id = data.new_award_id;
            if(data.status == 'fail'){
                if(title == ''){
                    $("#award_content").attr('style','border:1px solid red !important');
                } if(date == ''){
                    $("#award_date").attr('style','border:1px solid red !important');
                } if(description == ''){
                    $("#add_content").attr('style','border:1px solid red !important');
                }
            }else{
                const input_award = [
                  'award_content',
                  'award_date',
                  'add_content',
                ];
                input_award.forEach(input => {
                  $(`#${input}`).val('');
                  $(`#${input}`).attr('style','border:1px solid black');
                });

                $("#award").attr('style','display:none');
                $("#award_box").after(
                    `<div id="award${award_id}">
                      <div class="grid xl:grid-cols-2-1">
                      <span class="text-gray-500" id="award_date${award_id}">${date}</span>
                       <div class="flex flex-col">
                       <div class="flex justify-between">
                         <span class="font-semibold text-xl" id="award_content${award_id}">${title}</span>
                         <div class="flex">
                           <svg class="my-auto mr-2" onclick="edit_award(${award_id})" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-pencil">
                             <path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                           </svg>
                           <svg class="my-auto" onclick="award_delete(${award_id})" fill="red" viewBox="0 0 24 24" width="1em" height="1em">
                             <path d="M18.707 5.293a1 1 0 0 0-1.414 0L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0 0-1.414z"></path>
                           </svg>
                         </div>
                         </div>
                         <span id="award_description${award_id}">${description}</span>
                       </div>
                       </div>
                     </div>`);
            }
        },
    });
}
function edit_award(id){
    let award_date = $("#award_date"+id).text().replace('.','-');
    let award_content = $("#award_content"+id).text();
    let award_description = $("#award_description"+id).text();

    $("#award"+id).hide();
    $("#award"+id).after(`
    <div class="flex flex-col border pr-2 pb-2 mt-3 mb-3 w-full" id="edit_award${id}">
        <div class="flex flex-col px-2 py-2">
          <div class="flex flex-col">
            <div class="flex flex-col mr-3">
              <div class="flex">
                <span class="text-red-600 font-bold mr-2">*</span>
                <span class="mb-2">수상내용</span>
              </div>
              <input type="text" id="edit_award_content${id}" placeholder="입력" value="${award_content}"
                     class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
            </div>
            <div class="flex flex-col mb-3 mr-3">
              <div class="flex">
                <span class="text-red-600 font-bold mr-2">*</span>
                <span class="mb-2" style="width: auto">수상/취득 년 월</span>
              </div>
              <input type="month" id="edit_award_date${id}" value="${award_date}"
                     class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3"
                     placeholder="4.5">
            </div>
            <div class="flex flex-col mr-3">
              <div>
                <span class="text-red-600 font-bold mr-2">*</span>
                <span class="mb-2">추가내용</span>
              </div>
              <textarea type="text" id="edit_award_description${id}" placeholder="내용입력"
                        class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">${award_description}</textarea>
            </div>
          </div>
        </div>
        <footer class="flex justify-end">
          <button onclick="edit_add(${id})"
                  class="py-2 px-3 mr-1 text-sm font-medium transition-colors duration-150 border border-gray-300 rounded-lg sm:px-4 sm:py-2 sm:w-auto active:bg-transparent hover:border-gray-500 focus:border-gray-500 active:text-gray-500 focus:outline-none">
            취소
          </button>
          <button onclick="edit_save_award(${id})"
                  class="py-2 px-3 text-sm font-medium text-white transition-colors duration-150 bg-blue-500 border border-transparent rounded-lg sm:w-auto sm:px-4 sm:py-2 focus:outline-none">
            저장
          </button>
        </footer>
      </div>`);
}

function edit_save_award(id){
    let github_id = $("#user_github_id").text();
    let edit_award_content = $("#edit_award_content"+id).val();
    let edit_award_date = $("#edit_award_date"+id).val();
    let edit_award_description = $("#edit_award_description"+id).val();

    $.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
    });

    $.ajax({
        url: '/profile/award'
        , method: 'POST'
        ,data:{'github_id':github_id,'award_id':id,'date':edit_award_date,'title':edit_award_content,
            'description':edit_award_description,'action': 'update'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            if(data.status == 'fail'){
                if(edit_award_content == ''){
                    $("#edit_award_content"+id).attr('style','border:1px solid red !important');
                }if(edit_award_date == ''){
                    $("#edit_award_date"+id).attr('style','border:1px solid red !important');
                }if(edit_award_description == ''){
                    $("#edit_award_description"+id).attr('style','border:1px solid red !important');
                }
            }else{
                $("#award"+id).show();
                $("#award"+id).html(`
                <div class="grid xl:grid-cols-2-1" id="award${id}">
                   <span class="text-gray-500" id="award_date${id}">${edit_award_date}</span>
                   <div class="flex flex-col">
                   <div class="flex justify-between">
                     <span class="font-semibold text-xl" id="award_content${id}">${edit_award_content}</span>
                     <div class="flex">
                       <svg class="my-auto mr-2" onclick="edit_award(${id})" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-pencil">
                         <path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                       </svg>
                       <svg class="my-auto" onclick="award_delete(${id})" fill="red" viewBox="0 0 24 24" width="1em" height="1em">
                         <path d="M18.707 5.293a1 1 0 0 0-1.414 0L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0 0-1.414z"></path>
                       </svg>
                     </div>
                     </div>
                     <span id="award_description${id}">${edit_award_description}</span>
                   </div>
                 </div>`);
                $("#edit_award"+id).remove();
            }
        },
    });



}
function award_delete(award_id) {
    let github_id = $("#user_github_id").text();

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
    $.ajax({
        url: check_lang_code() + '/profile/award'
        ,method: 'POST'
        ,data:
            {
                'github_id': github_id, 'award_id': award_id, 'action': 'delete',
            }
        ,async: false
        ,success: function (data) {
            if (data.status == 'delete_success')
                $("#award"+award_id).empty();
            else
                alert('삭제 실패');
        },
    });
}

//education
function save_education(){
    let github_id = $("#user_github_id").text();
    let university = $("#university").val();
    let major = $("#major").val();
    let degree = $("#degree").val();
    let entrance = $("#entrance").val();
    let graduation = $("#graduation").val();
    let my_grade = $("#my_grade").val();
    let max_grade = $("#max_grade").val();

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/profile/education'
        , method: 'POST'
        ,data:{'github_id':github_id,'school':university,'major':major,'degree':degree,'start':entrance,'end':graduation,
            'grade':my_grade,'max_grade':max_grade,'action' :'create'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            let id = data.new_education_id;
            if(data.status == 'fail'){
                if(entrance == ''){
                    $("#entrance").attr('style','border:1px solid red !important');
                }if(university == ''){
                    $("#university").attr('style','border:1px solid red !important');
                }
            }else{
                $("#education").attr('style','display:none');
                const inputs_education = [
                  'university',
                  'major',
                  'degree',
                  'entrance',
                  'graduation',
                  'my_grade',
                  'max_grade'
                ];

                inputs_education.forEach(input => {
                  $(`#${input}`).val('');
                  $(`#${input}`).attr('style','border:1px solid black');
                });

                $("#user_education").append(
                    `<div id="education${id}">
                      <div class="grid xl:grid-cols-2-1 mb-3">
                        <div class="flex">
                            <span class="text-gray-500" id="education_start${id}">${entrance}</span>
                            <span class="text-gray-500" >~</span>
                            <span class="text-gray-500" id="education_end${id}">${graduation}</span>
                        </div>
                        <div class="flex flex-col">
                          <div class="flex justify-between">
                            <span id="education_school${id}" class="font-semibold text-xl">${university}</span>
                            <div class="flex">
                              <svg class="my-auto mr-2" onclick="edit_education(${id})" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-pencil">
                                <path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                              </svg>
                              <svg class="my-auto" onclick="delete_education(${id})" fill="red" viewBox="0 0 24 24" width="1em" height="1em">
                                <path d="M18.707 5.293a1 1 0 0 0-1.414 0L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0 0-1.414z"></path>
                              </svg>
                            </div>
                          </div>
                          <div class="flex">
                              <span id="education_major${id}">${major}</span>
                              <span>•</span>
                              <span id="education_degree${id}">${degree}</span>
                          </div>
                          <div class="flex">
                              <span id="education_grade${id}">${my_grade}</span>
                              <span>/</span>
                              <span id="education_max_grade${id}">${max_grade}</span>
                              <span>학점</span>
                          </div>
                        </div>
                     </div>
                    </div>`)}
            },
    });
}

function edit_education(id){
    let education_start = $("#education_start"+id).text().replace('.','-');
    let education_end = $("#education_end"+id).text().replace(/(\s*)/g,'').replace('.','-');
    let education_school = $("#education_school"+id).text();
    let education_major = $("#education_major"+id).text();
    let education_degree = $("#education_degree"+id).text();
    let education_grade = $("#education_grade"+id).text();
    let education_max_grade = $("#education_max_grade"+id).text();

    $("#education"+id).hide();
    $("#education"+id).after(
        `<div class="flex flex-col border pr-2 pb-2 mt-3 w-full" id="edit_education${id}">
            <div class="flex flex-col px-2 py-2">
              <div class="flex">
                <div class="flex flex-col mr-3 w-full">
                  <div class="flex">
                    <span class="text-red-600 font-bold mr-2">*</span>
                    <span class="mb-2">대학교</span>
                  </div>
                  <input type="text" id="edit_school${id}" value="${education_school}" placeholder="**대학교"
                         class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
                </div>
                <div class="flex flex-col mr-3 w-full">
                  <span class="mb-2">전공</span>
                  <input type="text" id="edit_major${id}" value="${education_major}" placeholder="컴퓨터공학"
                         class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
                </div>
                <div class="flex flex-col mr-3 w-full">
                  <span class="mb-2">학위</span>
                  <input type="text" id="edit_degree${id}" value="${education_degree}" placeholder="학사"
                         class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
                </div>
              </div>
              <div class="flex">
                <div class="flex flex-col mb-3 mr-3 w-full">
                  <div class="flex">
                    <span class="text-red-600 font-bold mr-2">*</span>
                    <span class="mb-2" style="width: auto">입학</span>
                  </div>
                  <input type="month" id="edit_education_start${id}" value="${education_start}"
                         class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3">
                </div>
                <div class="flex flex-col mb-3 mr-3 w-full">
                  <span class="mb-2" style="width: auto">졸업(예정)</span>
                  <input type="month" id="edit_education_end${id}" value="${education_end}"
                         class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3">
                </div>
                <div class="flex flex-col mb-3 mr-3 w-full">
                  <span class="mb-2" style="width: auto">내학점</span>
                  <input type="number" id="edit_grade${id}" step="0.1" value="${education_grade}"
                         class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3"
                         placeholder="4.0">
                </div>
                <div class="flex flex-col mb-3 mr-3 w-full">
                  <span class="mb-2" style="width: auto">최대학점</span>
                  <input type="number" id="edit_max_grade${id}" step="0.1" value="${education_max_grade}"
                         class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3"
                         placeholder="4.5">
                </div>
              </div>
            </div>
            <footer class="flex justify-end">
              <button onclick="edit_add(${id})"
                      class="py-2 px-3 mr-1 text-sm font-medium transition-colors duration-150 border border-gray-300 rounded-lg sm:px-4 sm:py-2 sm:w-auto active:bg-transparent hover:border-gray-500 focus:border-gray-500 active:text-gray-500 focus:outline-none">
                취소
              </button>
              <button onclick="edit_save_education(${id})"
                class="py-2 px-3 text-sm font-medium text-white transition-colors duration-150 bg-blue-500 border border-transparent rounded-lg sm:w-auto sm:px-4 sm:py-2 focus:outline-none">
                저장
              </button>
            </footer>
        </div>`
    )
}

function edit_save_education(id){
    let github_id = $("#user_github_id").text();
    let edit_education_start = $("#edit_education_start"+id).val();
    let edit_education_end = $("#edit_education_end"+id).val();
    let edit_school = $("#edit_school"+id).val();
    let edit_major = $("#edit_major"+id).val();
    let edit_degree = $("#edit_degree"+id).val();
    let edit_grade = $("#edit_grade"+id).val();
    let edit_max_grade = $("#edit_max_grade"+id).val();

    $.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
    });

    $.ajax({
        url: '/profile/education'
        , method: 'POST'
        ,data:{'github_id':github_id,'education_id':id,'start':edit_education_start,'end':edit_education_end,
            'major':edit_major, 'degree':edit_degree, 'grade':edit_grade, 'max_grade':edit_max_grade,
            'school':edit_school, 'action': 'update'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            if(data.status == 'fail'){
                if(edit_education_start == ''){
                    $("#edit_education_start"+id).attr('style','border:1px solid red !important');
                }if(edit_school == ''){
                    $("#edit_school"+id).attr('style','border:1px solid red !important');
                }
            }else{
                $("#education"+id).show();
                $("#education"+id).html(`
                <div class="grid xl:grid-cols-2-1 mb-3">
                  <div class="flex">
                    <span id="education_start${id}" class="text-gray-500">${edit_education_start}</span>
                    <span>~</span>
                    <span id="education_end${id}">${edit_education_end}</span>
                  </div>
                  <div class="flex flex-col">
                    <div class="flex justify-between">
                      <span id="education_school${id}" class="font-semibold text-xl">${edit_school}</span>
                        <div class="flex">
                          <svg class="my-auto mr-2" onclick="edit_education(${id})" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-pencil">
                            <path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                          </svg>
                          <svg class="my-auto" fill="red" onclick="delete_education(${id})" viewBox="0 0 24 24" width="1em" height="1em">
                            <path d="M18.707 5.293a1 1 0 0 0-1.414 0L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0 0-1.414z"></path>
                          </svg>
                        </div>
                    </div>
                    <div class="flex">
                      <span id="education_major${id}">${edit_major}</span>
                      <span> • </span>
                      <span id="education_degree${id}">${edit_degree}</span>
                    </div>
                    <div class="flex">
                      <span id="education_grade${id}">${edit_grade}</span>
                      <span> / </span>
                      <span id="education_max_grade${id}">${edit_max_grade}</span>
                      <span> 학점</span>
                    </div>
                  </div>
                </div>`);
                $("#edit_education"+id).remove();
            }
        },
    });
}

function delete_education(id){
    let github_id = $("#user_github_id").text();
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/profile/education'
        , method: 'POST'
        ,data:{'github_id':github_id,'education_id':id,'action':'delete'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            $("#education"+id).empty();
        },
    });
}

//Activity
function save_activity(){
    let github_id = $("#user_github_id").text();
    let activity_start = $("#activity_start").val();
    let activity_end = $("#activity_end").val();
    let activity_title = $("#activity_title").val();
    let activity_description = $("#activity_description").val();

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/profile/activity'
        , method: 'POST'
        ,data:{'github_id':github_id,'start':activity_start,'end':activity_end,'title':activity_title,
            'description':activity_description,'action' :'create'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            let id = data.new_activity_id;
            if(data.status == 'fail'){
                if(activity_start == ''){
                    $("#activity_start").attr('style','border:1px solid red !important');
                }if(activity_title == ''){
                    $("#activity_title").attr('style','border:1px solid red !important');
                }if(activity_description == ''){
                    $("#activity_description").attr('style','border:1px solid red !important');
                }
            }else{
                $("#activity").attr('style','display:none');
                const inputs = [
                  'activity_start',
                  'activity_end',
                  'activity_title',
                  'activity_description',
                ];

                inputs.forEach(input => {
                  $(`#${input}`).val('');
                  $(`#${input}`).attr('style','border:1px solid black');
                });

                $("#add_activity").append(`
                <div id="activity${id}">
                    <div class="grid xl:grid-cols-2-1">
                      <div class="flex">
                          <span id="activity_start${id}" class="text-gray-500">${activity_start}</span>
                          <span>~</span>
                          <span id="activity_end${id}" class="text-gray-500">${activity_end}</span>
                      </div>
                      <div class="flex flex-col">
                        <div class="flex justify-between">
                            <span id="activity_title${id}" class="font-semibold text-xl">${activity_title}</span>
                            <div class="flex">
                                <svg class="my-auto mr-2" onclick="edit_activity(${id})" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-pencil">
                                  <path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                                </svg>
                                <svg class="my-auto" onclick="delete_activity(${id})" fill="red" viewBox="0 0 24 24" width="1em" height="1em">
                                  <path d="M18.707 5.293a1 1 0 0 0-1.414 0L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0 0-1.414z"></path>
                                </svg>
                             </div>
                        </div>
                        <span id="activity_description${id}">${activity_description}</span>
                      </div>
                    </div>
                </div>`)
            }

        },
    });
}

function edit_activity(id){
    let activity_start = $("#activity_start"+id).text().replace('.','-');
    let activity_end = $("#activity_end"+id).text().replace(/(\s*)/g,'').replace('.','-');
    let activity_title = $("#activity_title"+id).text();
    let activity_description = $("#activity_description"+id).text();

    $("#activity"+id).hide();
    $("#activity"+id).after(`
    <div class="flex flex-col border pr-2 pb-2 mt-3 w-full mb-3" id="edit_activity${id}">
      <div class="flex flex-col px-2 py-2">
        <div>
          <div class="flex flex-col mr-3">
            <div class="flex">
              <span class="text-red-600 font-bold mr-2">*</span>
              <span class="mb-2">활동</span>
            </div>
            <input type="text" id="edit_title${id}" placeholder="입력" value="${activity_title}"
                   class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">
          </div>
        </div>
        <div class="flex">
          <div class="flex flex-col mb-3 mr-3">
            <div class="flex">
              <span class="text-red-600 font-bold mr-2">*</span>
              <span class="mb-2" style="width: auto">시작일</span>
            </div>
            <input type="month" id="edit_activity_start${id}" value="${activity_start}"
                   class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3">
          </div>
          <div class="flex flex-col mb-3 mr-3">
            <span class="mb-2" style="width: auto">종료일</span>
            <input type="month" id="edit_activity_end${id}" value="${activity_end}"
                   class="border focus:shadow-outline-blue rounded-1 py-1 px-1 focus:outline-none mb-3">
          </div>
        </div>
        <div class="flex flex-col mr-3">
        <div class="flex">
          <span class="text-red-600 font-bold mr-2">*</span>
          <span class="mb-2">추가내용</span>
        </div>
          <textarea type="text" id="edit_activity_description${id}" placeholder="내용입력"
                  class="border rounded-lg px-2 py-2 mb-3 w-full focus:shadow-outline-blue focus:outline-none">${activity_description}</textarea>
        </div>
      </div>
      <footer class="flex justify-end">
        <button onclick="edit_add(${id})"
                class="py-2 px-3 mr-1 text-sm font-medium transition-colors duration-150 border border-gray-300 rounded-lg sm:px-4 sm:py-2 sm:w-auto active:bg-transparent hover:border-gray-500 focus:border-gray-500 active:text-gray-500 focus:outline-none">
            취소
        </button>
        <button onclick="edit_save_activity(${id})"
                class="py-2 px-3 text-sm font-medium text-white transition-colors duration-150 bg-blue-500 border border-transparent rounded-lg sm:w-auto sm:px-4 sm:py-2 focus:outline-none">
            저장
        </button>
      </footer>
    </div>`)
}

function edit_save_activity(id){
    let github_id = $("#user_github_id").text();
    let edit_title = $("#edit_title"+id).val();
    let edit_activity_start = $("#edit_activity_start"+id).val();
    let edit_activity_end = $("#edit_activity_end"+id).val();
    let edit_activity_description = $("#edit_activity_description"+id).val();

    $.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
    });

    $.ajax({
        url: '/profile/activity'
        , method: 'POST'
        ,data:{'github_id':github_id,'activity_id':id,'start':edit_activity_start,'end':edit_activity_end,
            'title':edit_title, 'description':edit_activity_description, 'action': 'update'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            if(data.status == 'fail'){
                if(edit_title == ''){
                    $("#edit_title"+id).attr('style','border:1px solid red !important');
                }if(edit_activity_start == ''){
                    $("#edit_activity_start"+id).attr('style','border:1px solid red !important');
                }if(edit_activity_description == ''){
                    $("#edit_activity_description"+id).attr('style','border:1px solid red !important');
                }
            }else{
                $("#activity"+id).show();
                $("#activity"+id).html(`
                <div class="grid xl:grid-cols-2-1">
                  <div class="flex">
                      <span id="activity_start${id}" class="text-gray-500">${edit_activity_start}</span>
                      <span>~</span>
                      <span id="activity_end${id}" class="text-gray-500">${edit_activity_end}</span>
                  </div>
                  <div class="flex flex-col">
                    <div class="flex justify-between">
                        <span id="activity_title${id}" class="font-semibold text-xl">${edit_title}</span>
                        <div class="flex">
                            <svg class="my-auto mr-2" onclick="edit_activity(${id})" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-pencil">
                              <path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
                            </svg>
                            <svg class="my-auto" onclick="delete_activity(${id})" fill="red" viewBox="0 0 24 24" width="1em" height="1em">
                              <path d="M18.707 5.293a1 1 0 0 0-1.414 0L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293a1 1 0 0 0 0-1.414z"></path>
                            </svg>
                         </div>
                    </div>
                    <span id="activity_description${id}">${edit_activity_description}</span>
                  </div>
                </div>`);
                $("#edit_activity"+id).remove();
            }
        },
    });
}
function delete_activity(id){
    let github_id = $("#user_github_id").text();
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    $.ajax({
        url: '/profile/activity'
        , method: 'POST'
        ,data:{'github_id':github_id,'activity_id': id,'action': 'delete'}
        , async: false
        , dataType: "Json"
        , success: function (data) {
            $("#activity"+id).empty();
        },
    });
}

function profile_img_reset(){
    let default_img_root = '/static/img/profile.png'
    $("#img_reset").val('checked')
    $("#user_img").attr('src',default_img_root)
}

function search_position(position_list, user_position_list){
    if(!$("#position").data("isAppended")){
        for(let i of position_list){
            if (user_position_list.includes(i)){
                $("#position").append(`
                <div id="${i}" onclick="plus_position(replace_letter('${i}'))"
                    class="flex position_round rounded-full mt-2 text-blue-500 bg-gray-100 px-2 py-1 font-bold text-center mr-2"
                    style="width: min-content;height: min-content;cursor:pointer;">
                    <div class="mr-2 text-sm mx-auto">${i}</div>
                </div>`)
            } else {
                $("#position").append(`
                <div id="${i}" onclick="plus_position(replace_letter('${i}'))"
                    class="flex rounded-full mt-2 text-blue-500 bg-gray-100 px-2 py-1 font-bold text-center mr-2"
                    style="width: min-content;height: min-content;cursor:pointer;">
                    <div class="mr-2 text-sm mx-auto">${i}</div>
                </div>`)
            }
        }
        $("#position").data("isAppended", true);
    }
}

function replace_letter(position){
    if(position.includes('-')){
        position = position.replace('-',`\\-`);
    }
    return position;
}

function plus_position(position) {
    const positions = $("#" + position);

    if(positions.hasClass('position_round')){
        positions.removeClass('position_round');
    } else{
        positions.addClass('position_round');
    }
}
