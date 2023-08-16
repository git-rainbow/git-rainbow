from django.db import models


class Group(models.Model):
    owner = models.ForeignKey("users.User", on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=300, null=True)
    img = models.ImageField(null=True)
    is_private = models.BooleanField(default=False)
    password = models.CharField(max_length=8, null=True)
    github_users = models.ManyToManyField('tech_stack.GithubUser')


class GroupRepo(models.Model):
    group = models.ForeignKey("Group", on_delete=models.CASCADE)
    repo_url = models.CharField(max_length=260)
    branch = models.CharField(max_length=260, null=True)
    status = models.CharField(max_length=50, default='reachable', null=True)
    is_private = models.BooleanField(default=False)


class Topic(models.Model):
    groups = models.ManyToManyField('Group')
    name = models.CharField(max_length=30, unique=True)