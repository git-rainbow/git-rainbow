from django.db import models


class PageRequest(models.Model):
    date = models.DateField()
    request_type = models.CharField(max_length=80)
    count = models.IntegerField()
    access_client = models.ManyToManyField('ClientInfo')


class ClientInfo(models.Model):
    client_ip = models.CharField(max_length=80)
    user = models.ForeignKey('users.User', null=True, on_delete=models.CASCADE)
