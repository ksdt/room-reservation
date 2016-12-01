from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Reservation(models.Model):
    start = models.DateTimeField()
    end = models.DateTimeField()
    user = models.ForeignKey(User)
    def __str__(self):
        st = self.start.strftime('%c')
        en = self.end.strftime('%c')
        return ("{}---{}---{}").format(self.user.username, st, en)
