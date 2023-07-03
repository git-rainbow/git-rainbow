from django.db import models


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


class GithubRepo(models.Model):
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)
    updated_date = models.DateTimeField(auto_now=True)
    repo_url = models.CharField(max_length=260)
    branch = models.CharField(max_length=260, null=True)
    description = models.TextField(null=True)


class AuthorEmail(models.Model):
    author_email = models.CharField(max_length=260)
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)


class GithubToken(models.Model):
    TYPE_CHOICES = (('gho', 'gho'), ('ghp', 'ghp'))
    STATUS_CHOICES = (('ready', 'ready'), ('restricted', 'restricted'), ('invalid', 'invalid'), ('expired', 'expired'))
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)
    token = models.CharField(max_length=100)
    type = models.CharField(max_length=100, choices=TYPE_CHOICES)
    status = models.CharField(max_length=60, choices=STATUS_CHOICES, default='ready', db_index=True)
    reset_time = models.DateTimeField(null=True)
    created = models.DateTimeField(auto_now_add=True)


class TechStackFile(models.Model):
    file_name = models.TextField()
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)
    updated_date = models.DateTimeField(auto_now=True)
    tech_type = models.CharField(max_length=100)
    tech_name = models.CharField(max_length=100)
    origin_tech_name = models.CharField(max_length=100)
    file_lang = models.CharField(max_length=50, null=True)
    name_with_owner = models.CharField(max_length=150)
    commit_hash = models.CharField(max_length=200, null=True)
    author_date = models.DateTimeField(null=True)
    lines = models.PositiveIntegerField(null=True)
    branch = models.CharField(max_length=260, null=True)
    repo_url = models.CharField(max_length=260, null=True, db_index=True)


class Commit(models.Model):
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)
    name_with_owner = models.CharField(max_length=150)
    commit_hash = models.CharField(max_length=50)
    commit_message = models.TextField()
    repo_url = models.CharField(max_length=250, null=True)


class AnalysisData(models.Model):
    github_id = models.OneToOneField('GithubUser', on_delete=models.CASCADE)
    tech_card_data = models.TextField(null=True)
    git_calendar_data = models.TextField(null=True)
