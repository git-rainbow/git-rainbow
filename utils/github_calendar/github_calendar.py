import json
from subprocess import check_output, CalledProcessError, STDOUT


def generate_github_calendar(calendar_data):
    env = {'TECH_CALENDAR_DATA': json.dumps(calendar_data)}
    cwd = "utils/github_calendar/"
    nodejs_cmdline = ["node", "github_calendar.js"]

    try:
        result = check_output(nodejs_cmdline, env=env, cwd=cwd, stderr=STDOUT).decode().split("\n")
    except CalledProcessError as e:
        return False, ":NodeJS Error: " + str(e.stdout)
    return True, result
