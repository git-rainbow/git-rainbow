from django.db import models


class GithubUser(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    github_id = models.CharField(max_length=100)
    name = models.CharField(max_length=260, null=True)
    email = models.EmailField(null=True)
    avatar_url = models.CharField(max_length=100, null=True, blank=True)
    bio = models.TextField(null=True)
    status = models.CharField(max_length=30, null=True)
    updated_date = models.DateTimeField(auto_now=True)
