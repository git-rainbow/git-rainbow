from django.db import models

from apps.tech_stack.create_table import create_github_calendar_table


class GithubUser(models.Model):
    """
    status types
      requested: Backend sets status to 'requested' before requesting core API
      progress: Core sets status to 'progress' when received analyzing api request
      ready: Core sets status to 'ready' when analyzing devloper finished
      completed: Backend sets status to 'completed' when saved analysis data in tech_stack_analysis_data table
      fail: Core sets status to 'fail' when analyzing devloper failed
    """
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    github_id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=260, null=True)
    email = models.EmailField(null=True)
    avatar_url = models.CharField(max_length=100, null=True, blank=True)
    bio = models.TextField(null=True)
    status = models.CharField(max_length=30, null=True)
    updated_date = models.DateTimeField(auto_now=True)
    is_valid = models.BooleanField(default=False, null=True)
    session_key = models.CharField(max_length=200, null=True)


class GithubRepo(models.Model):
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)
    updated_date = models.DateTimeField(auto_now=True)
    repo_url = models.CharField(max_length=260)
    branch = models.CharField(max_length=260, null=True)
    description = models.TextField(null=True)
    added_type = models.CharField(max_length=50, default='Auto', null=True)
    status = models.CharField(max_length=50, null=True)
    is_reachable = models.BooleanField(default=True, null=True)
    is_private = models.BooleanField(default=False, null=True)


class AnalysisData(models.Model):
    github_id = models.OneToOneField('GithubUser', on_delete=models.CASCADE)
    tech_card_data = models.TextField(null=True)
    git_calendar_data = models.TextField(null=True)


class GithubCalendar(models.Model):
    author_date = models.DateTimeField()
    tech_name = models.CharField(max_length=50)
    lines = models.IntegerField()
    repo_url = models.CharField(max_length=150, null=True)
    commit_hash = models.CharField(max_length=150, null=True)
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)


def get_calendar_model(github_id):
    lower_github_id = github_id.lower().replace('-', '_')

    class GithubCalendar(models.Model):
        author_date = models.DateTimeField()
        tech_name = models.CharField(max_length=50)
        lines = models.IntegerField()
        repo_url = models.CharField(max_length=150, null=True)
        commit_hash = models.CharField(max_length=150, null=True)
        github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)

    create_github_calendar_table(lower_github_id)
    db_table_name = f'{GithubCalendar._meta.app_label}_{GithubCalendar.__name__.lower()}_{lower_github_id}'
    GithubCalendar._meta.db_table = db_table_name

    return GithubCalendar


class Ranking(models.Model):
    github_id = models.ForeignKey('GithubUser', on_delete=models.CASCADE)
    tech_name = models.CharField(max_length=50)
    midnight_rank = models.IntegerField()
    updated_date = models.DateTimeField(auto_now=True)


class TechStack(models.Model):
    tech_name = models.CharField(max_length=50, primary_key=True)
    tech_type = models.CharField(max_length=50)
    tech_color = models.CharField(max_length=50)
    developer_count = models.IntegerField()
    logo_path = models.FilePathField()


class TopTech(models.Model):
    github_id = models.OneToOneField("GithubUser", on_delete=models.CASCADE)
    tech_name = models.CharField(max_length=50, null=True)


class CodeCrazy(models.Model):
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)
    tech_name = models.CharField(max_length=50, null=True)
    code_crazy = models.FloatField()
    total_lines = models.IntegerField()
    old_code_crazy = models.FloatField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
