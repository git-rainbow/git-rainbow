function file_stat(file_stat_data) {
    var major_lang = file_stat_data.major_lang
    var major_percent = file_stat_data.major_percent
    var total_addtions = file_stat_data.total_addtions
    var circle_data = file_stat_data.circle_data
    var programming_lang = file_stat_data.programming_languages_list
    var addtions_data = file_stat_data.addtions_data
    var deletions_data = file_stat_data.deletions_data

    if(total_addtions>= 1000){
        $("#total_line").text((Math.round(total_addtions/1000)).toLocaleString('en')+gettext('k'));
    }
    else{
        $("#total_line").text(total_addtions.toLocaleString('en')+gettext(' lines'));
    }

    switch (major_lang) {
        case 'Python':
            $("#p_img").attr('src', 'https://img.icons8.com/fluency/96/000000/python.png');
            break
        case 'Dart':
            $("#p_img").attr('src', 'https://img.icons8.com/color/96/000000/dart.png');
            break
        case 'C':
            $("#p_img").attr('src', 'https://img.icons8.com/color/96/000000/c-programming.png');
            break
        case 'Kotlin':
            $("#p_img").attr('src', 'https://img.icons8.com/color/96/000000/kotlin.png');
            break
        case 'JavaScript':
            $("#p_img").attr('src', 'https://img.icons8.com/color/96/000000/javascript--v1.png');
            break
        case 'Java':
            $("#p_img").attr('src', 'https://img.icons8.com/color/96/000000/java-coffee-cup-logo--v1.png');
            break
        case 'Matlab':
            $("#p_img").attr('src', 'https://img.icons8.com/fluency/96/228BE6/matlab.png');
            break
        case 'Go':
            $("#p_img").attr('src', 'https://img.icons8.com/cute-clipart/96/000000/go-logo.png');
            break
        case 'C++':
            $("#p_img").attr('src', 'https://img.icons8.com/color/96/000000/c-plus-plus-logo.png');
            break
        case 'Swift':
            $("#p_img").attr('src', 'https://img.icons8.com/color/96/000000/swift.png');
            break
        case 'TypeScript':
            $("#p_img").attr('src', 'https://img.icons8.com/fluency/96/000000/typescript--v1.png');
            break
        case 'PHP':
            $("#p_img").attr('src', 'https://img.icons8.com/ios-filled/100/000000/php-server.png');
            break
        case 'Ruby':
            $("#p_img").attr('src', 'https://img.icons8.com/fluency/96/000000/ruby-programming-language.png');
            break
        case 'C#':
            $("#p_img").attr('src', 'https://img.icons8.com/color/96/000000/c-sharp-logo.png');
            break
        default:
            $("#p_img").attr('src', 'https://img.icons8.com/external-xnimrodx-lineal-color-xnimrodx/64/000000/external-code-website-development-xnimrodx-lineal-color-xnimrodx.png');
    }
    $("#p_lang").text(major_lang+' '+major_percent +"%");
    const pieConfig = {
        plugins: [ChartDataLabels],
        type: 'doughnut',
        data: {
            datasets: [{
                data: [circle_data['code'],circle_data['data'],circle_data['document'],circle_data['etc'],circle_data['test']],
                backgroundColor: ['#0694a2', '#1c64f2', '#7e3af2','#005666','#87CEFA'],
                label: 'Dataset 1',
            },
            ],
            labels: [gettext('Code'), gettext('Data'), gettext('Document'), gettext('Etc'), gettext('Test')],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        usePointStyle : true,
                    },
                    position: 'bottom',
                    maxBarThickness: "50%",
                },
                datalabels:{
                    color:'#fff',
                     formatter: function (value, context) {
                        let percentage = Math.round(value / context.chart.getDatasetMeta(0).total * 100)
                        if(percentage<10){
                            return '';
                        }
                        return percentage + "%";
                     },
                },
            },
        },
    }
    const pieCtx = document.getElementById('pie')
    const Donut_chart = new Chart(pieCtx, pieConfig)
    
// --------------bar graph----------------

    const bar_config = {
        type: 'bar',
        data: {
            labels: programming_lang,
            datasets: [
                {
                    label: gettext('Addition'),
                    backgroundColor: '#0694a2',
                    borderWidth: 1,
                    data: addtions_data,
                },
                {
                    label: gettext('Delete'),
                    backgroundColor: '#7e3af2',
                    borderWidth: 1,
                    data: deletions_data
                },
            ],
        },
        options: {
            indexAxis: 'y',
            elements: {
                bar: {
                    borderWidth: 2,
                }},
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
            }
            },
    }
    const barsCtx = document.getElementById('bars').getContext('2d');
    const mybar = new Chart(barsCtx, bar_config)
}
