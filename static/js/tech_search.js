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
