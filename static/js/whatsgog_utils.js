function encode_letter(tech_name){
    if(tech_name.includes('++')){
        return tech_name.replace('++','plusplus');
    }else if(tech_name.includes('#')){
        return tech_name.replace('#','sharp');
    }else{
        return tech_name
    }
}

function decode_letter(tech_name){
    if(tech_name == 'Cplusplus'){
        return tech_name.replace('Cplusplus', 'C++');
    } else if(tech_name == 'Csharp'){
        return tech_name.replace('Csharp', 'C#');
    } else{
        return tech_name
    }
}
