from django.db import models


class PageRequest(models.Model):
    date = models.DateField()
    request_type = models.CharField(max_length=80)
    count = models.IntegerField()
    access_client = models.ManyToManyField('ClientInfo')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['date', 'request_type'],
                name='unique dete request_type'
            )
        ]


class ClientInfo(models.Model):
    client_ip = models.CharField(max_length=80)
    user = models.ForeignKey('users.User', null=True, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['client_ip', 'user'],
                name='unique user client_ip'
            )
        ]
