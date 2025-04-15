from django.shortcuts import render
from .models import Attendance
import json
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import Attendance
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

@csrf_exempt
def check_in(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            name = data.get('name')
            if not user_id or not name:
                    return JsonResponse({'error': 'Missing user_id or name.'}, status=400)
            
            today = timezone.now().date()
            attendance = Attendance.objects.filter(user_id=user_id, check_in_time__date=today).first()
            if attendance:
                return JsonResponse({'message': 'User already checked in today.'}, status=400)
            
            Attendance.objects.create(user_id=user_id, name=name, check_in_time=timezone.now())
            return JsonResponse({'message': 'Check-in successful.'})
        
        except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    else:
        return JsonResponse({'error': 'Invalid Method.'}, status=400)

@csrf_exempt
def check_out(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        user = get_object_or_404(User, id=user_id)
        Attendance.objects.create(user=user, action='check_out')

        return JsonResponse({'message': 'Check-out recorded successfully.'})
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)