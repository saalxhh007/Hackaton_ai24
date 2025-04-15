from django.db import models

class Attendance(models.Model):
    ACTION_CHOICES = [
        ('check_in', 'Check In'),
        ('check_out', 'Check Out'),
    ]

    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.name} - {self.action} at {self.timestamp}"
