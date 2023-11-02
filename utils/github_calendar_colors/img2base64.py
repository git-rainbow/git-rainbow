import sys
sys.path.append('/usr/src/app/utils/github_calendar_colors')
from github_calendar_colors import github_calendar_colors
import base64

def img2base64():
    tech_img_base64 = dict()
    for tech_info_dict in github_calendar_colors.values():
        logo_path = tech_info_dict['logo_path'][1:]
        tech_logo_name = logo_path.split('/')[-1].split('.png')[0]
        base64_file_path = 'apps/tech_stack/tech_img_base64.py'
        with open (logo_path, "rb") as f:
            encoded_string = base64.b64encode(f.read())
            decoded_string = encoded_string.decode()
        tech_img_base64[tech_logo_name] = decoded_string
    with open(base64_file_path, "w") as f:
        f.write(f'tech_img_base64={tech_img_base64}')

if __name__ == '__main__':
    img2base64()
