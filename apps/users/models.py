from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    github_id = models.CharField(max_length=100, unique=True)
    username = models.CharField(max_length=100, null=True)
    USERNAME_FIELD = 'github_id'
