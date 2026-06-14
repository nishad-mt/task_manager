from rest_framework import serializers
from .models import Task
from datetime import date

class TaskSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'user', 'title', 'description','due_date', 'priority', 'status','create_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'create_at', 'updated_at']

    def validate_due_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value