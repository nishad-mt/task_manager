from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import SignupSerializer,LoginSerializer

class SignupView(APIView):
    def post(self,request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message":"Account Created Successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                }
            },status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    def post(self, request):
        serialzer = LoginSerializer(data=request.data)
        if serialzer.is_valid():
            data = serialzer.validated_data
            return Response({
                "message":"Login Successful",
                "access_token": data['access_token'],
                "refresh_token": data['refresh_token'],
                "user":{
                    "id": data['user'].id,
                    "username": data['user'].username,
                    "email": data['user'].email     
                }
            })
        return Response(serialzer.errors, status=status.HTTP_400_BAD_REQUEST)
