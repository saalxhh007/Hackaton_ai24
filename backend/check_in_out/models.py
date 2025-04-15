from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.contrib.auth.models import User

class Attendance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=10, choices=[('check-in', 'Check-In'), ('check-out', 'Check-Out')])

    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamps}"