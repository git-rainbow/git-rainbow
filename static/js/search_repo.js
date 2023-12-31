let currentPage = 1;

function toggleLoading(is_loading=true) {
    let loadingSpans = document.querySelectorAll(".loading-span");
    let loadingImges = document.querySelectorAll(".loading-img");
    if (is_loading) {
        loadingSpans.forEach(loadingSpan => {
            loadingSpan.classList.add('hidden');
        })
        loadingImges.forEach(loadingImage => {
            loadingImage.classList.remove('hidden');
        })
    } else {
        loadingSpans.forEach(loadingSpan => {
            loadingSpan.classList.remove('hidden');
        })
        loadingImges.forEach(loadingImage => {
            loadingImage.classList.add('hidden');
        })
    }
}

function check_search_api(ghoToken=null) {
    let headers = ghoToken ? {"Authorization": `token ${ghoToken}`} : null;
    let diffSeconds;
    let remaining;
    $.ajax({
        url: 'https://api.github.com/rate_limit'
        ,method: 'GET'
        ,headers: headers
        ,async: false
        ,success: function (data) {
            const apiReset = data.resources.search.reset;
            let now = Math.floor(Date.now() / 1000);
            diffSeconds = apiReset - now;
            remaining = data.resources.search.remaining;
        }
    });
    return {diffSeconds, remaining}
}

function alert_search_reset_time(noTokenResetTime, tokenResetTime) {
    let resetTime = noTokenResetTime < tokenResetTime ? noTokenResetTime : tokenResetTime;
    alert (`Maximum number of searches exceeded limit.\nPlease retry after ${resetTime} secondes later`);
}

function search_repo(isNewSearch, isFirstLoad) {
    const searchTag =  document.querySelector('input[name="tags"]');
    const searchTagValue = JSON.parse(searchTag.value);
    const perPage = isFirstLoad ? 10 : 100;
    const ghoToken = getCookie('gho_token');
    const noTokenResult = check_search_api();
    const noTokenResetTime = noTokenResult.diffSeconds;
    const noTokenRemaining = noTokenResult.remaining;
    let headers = null;

    if (noTokenRemaining == 0) {
        if (!ghoToken){
            alert("Please retry after login");
            return;
        }
        const tokenResult = check_search_api(ghoToken);
        const tokenResetTime = tokenResult.diffSeconds;
        const tokenRemaining = tokenResult.remaining;
        if (tokenRemaining > 0) {
            headers = {"Authorization": `token ${ghoToken}`};
        } else {
            alert_search_reset_time(noTokenResetTime, tokenResetTime);
            return;
        }
    }

    let apiQuery = `?page=${currentPage}&per_page=${perPage}&q=`;
    for (let i of searchTagValue) {
        apiQuery += `topic:${i.value}+`;
    }
    toggleLoading();

    $.ajax({
        url: 'https://api.github.com/search/repositories' + apiQuery
        ,method: 'GET'
        ,headers: headers
        ,async: true
        ,success: function (data) {
            let totalCountSpan = document.querySelector("#total-count-span")
            const totalCount = data.total_count;
            totalCountSpan.innerText = `Here are ${totalCount} public repositories matching this topic...`;
            const results = data.items;
            let searchMoreBtn = document.querySelector("#search-more-btn");
            let searchedRepoBox = document.querySelector(".searched-repo-box");
            if (isNewSearch) {
                searchedRepoBox.innerHTML = '';
                currentPage = 1;
            } else{
                currentPage ++;
            }
            for (let item of results) {
                const topics = item.topics;
                let insertTopicHtml = ``;
                for (let topic of topics) {
                    insertTopicHtml += `<span class="topic-span">${topic}</span>`;
                }
                let item_language_part
                if (item.language){
                    item_language_part = `
                    <div class="flex align-center">
                      <div style="background-color: ${item.language ? github_calendar_colors(item.language, 1): 'white'}; width: 10px; height: 10px; border-radius: 50%;"></div>
                      <div>${item.language}</div>
                    </div>
                    <div class="flex align-center">
                      ·
                    </div>
                    `;
                } else {
                    item_language_part = '';
                }
                const repoHtml = `
                <div class="repo-box mb-2" style="margin:auto">
                  <div>
                    <div class="flex align-center">
                      <img src="${item.owner.avatar_url}" style="border-radius: 50%; width: 20px; height: 20px;"/>
                      <span class="ml-2 font-semibold" style="width: 550px;font-size:1.2rem"><a href="${item.html_url}" target="_blank">${item.full_name}</a></span>
                    </div>
                  </div>
                  <div>
                    ${item.description}
                  </div>
                  <div>
                    ${insertTopicHtml}
                  </div>
                  <div class="flex">
                    ${item_language_part}
                    <div class="flex align-center">
                      <svg aria-hidden="true" focusable="false" role="img" class="octicon octicon-star" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="display: inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path></svg>
                      <span>&nbsp${item.stargazers_count}</span>
                    </div>
                    <div class="flex align-center">
                      ·
                    </div>
                    <div class="flex align-center">
                      <span>${item.updated_at}</span>
                    </div>
                  </div>
                </div>
                `;
                searchedRepoBox.innerHTML += repoHtml;
            }
            if (results.length < perPage) {
                searchMoreBtn.classList.add('hidden');
            } else {
              searchMoreBtn.classList.remove('hidden');
            }
            toggleLoading(false);
        }
        , error: function (data) {
            toggleLoading(false);
        }
    });
}

const randomTechTypes = ['Frontend', 'Backend', 'Mobile'];
const techNameList = Array.from(document.querySelectorAll('.tech_list')).filter(
    each => randomTechTypes.includes(each.getAttribute('tech_type'))
).map(each => {
    return each.getAttribute("tech_name");
});
const techNameListRandomIndex = Math.floor(Math.random() * techNameList.length);
const commonKeywordsRandomIndex = Math.floor(Math.random() * commonKeywords.length);
const searchInput = document.querySelector('input[name="tags"]');
let parsedSearchInput = searchInput.value ? JSON.parse(searchInput.value) : [];
parsedSearchInput.push({"value": techNameList[techNameListRandomIndex]});
parsedSearchInput.push({"value": commonKeywords[commonKeywordsRandomIndex]});
searchInput.value = JSON.stringify(parsedSearchInput);
search_repo(true, true);
