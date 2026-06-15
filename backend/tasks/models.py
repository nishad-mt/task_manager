from django.db import models
from django.conf import settings


class Task(models.Model):

    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
    ]

    STATUS_CHOICES = [
        ("TODO", "To Do"),
        ("IN_PROGRESS", "In Progress"),
        ("DONE", "Done"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='tasks')
    title = models.CharField(max_length=100, null=False)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=False)
    priority = models.CharField(choices=PRIORITY_CHOICES,default="MEDIUM")
    status = models.CharField(choices=STATUS_CHOICES,default="TODO")
    create_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title




    