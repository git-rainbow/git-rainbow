function display_select_area(category){
    let category_name_list = ['total_member', 'github_user', 'new_member']
    category_name_list.forEach(name => {
        let hidden_area = document.getElementById(name);
        hidden_area.classList.add('hidden');
    });
    let area = document.getElementById(category);
    area.classList.remove('hidden');
}
