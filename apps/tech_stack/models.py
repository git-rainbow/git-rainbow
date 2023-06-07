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


class TechName(models.Model):
    tech_name = models.CharField(max_length=100, unique=True)
    tech_type = models.CharField(max_length=100, null=True)
    ext_lists = models.CharField(max_length=200, null=True, blank=True)
    include_filter = models.CharField(max_length=200, null=True, blank=True)
    keyword_lists = models.TextField(null=True, blank=True)
    package_list = models.TextField(null=True, blank=True)
    tech_files_lists = models.TextField(null=True, blank=True)
    tech_files_keywords_lists = models.TextField(null=True, blank=True)
    is_special_tech_files = models.BooleanField(default=False)


class TechDetection(models.Model):
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)
    total_file_count = models.PositiveIntegerField()
    tech_name = models.CharField(max_length=100)
    tech_file_count = models.PositiveIntegerField()
    language = models.CharField(max_length=100)
    lang_file_count = models.PositiveIntegerField()
    miss_file_count = models.PositiveIntegerField()
    updated_date = models.DateTimeField(auto_now=True)


class Commit(models.Model):
    github_id = models.ForeignKey("GithubUser", on_delete=models.CASCADE)
    name_with_owner = models.CharField(max_length=150)
    commit_hash = models.CharField(max_length=50)
    commit_message = models.TextField()
    repo_url = models.CharField(max_length=250, null=True)


class AnalysisData(models.Model):
    github_user = models.OneToOneField('GithubUser', on_delete=models.CASCADE)
    tech_card_data = models.TextField(null=True)
    git_calendar_data = models.TextField(null=True)
