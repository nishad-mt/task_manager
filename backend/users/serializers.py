from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True,min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']
    
    def validate_email(self,value):

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already in use")
        
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password":"Password do not match"})
        return attrs
    
    def create(self,validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")
        
        user = authenticate(username=user.username, password=password)

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )
        
        refresh = RefreshToken.for_user(user) #creates a new JWT refresh token for that user
        data['user'] = user
        data['access_token'] = str(refresh.access_token) #creates an access token from the refresh token.
        data['refresh_token'] = str(refresh)
        return data

