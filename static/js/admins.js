function display_select_area(category){
    const parentElement = document.getElementById("display_data");
    const category_name_list = [];

    if (parentElement) {
        const childElements = parentElement.children;
        for (let i = 0; i < childElements.length; i++) {
            const childElement = childElements[i];
            category_name_list.push(childElement.id);
        }
    }

    category_name_list.forEach(name => {
        let hidden_area = document.getElementById(name);
        hidden_area.classList.add('hidden');
    });
    let area = document.getElementById(category);
    area.classList.remove('hidden');
}

function select_period () {
    const selectedPeriod = document.querySelector("#period").value;
    location.href = `/admins/visitors?period=${selectedPeriod}`;
}
