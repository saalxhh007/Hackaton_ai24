from django.shortcuts import render
from django.http import JsonResponse
from .models import Employee
from django.views.decorators.csrf import csrf_exempt
import json

def employee_list(request):
    employees = Employee.objects.all()
    data = [
    {
        "id": emp.id,
        "name": emp.name,
        "department": emp.department,
        "position": emp.position
    }
    for emp in employees
]

    return JsonResponse(data, safe=False)

@csrf_exempt
def employee_detail(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
        data = {
            "name": employee.name,
            "department": employee.department,
            "position": employee.position,
            "email": employee.email,
            "phone": employee.phone,
            "status": employee.status,
            "photo": employee.photo.url if employee.photo else None,
        }
        return JsonResponse(data)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

@csrf_exempt
def employee_create(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            Employee.objects.create(
                name=data['name'],
                department=data['department'],
                email=data['email'],
                position=data['position'],
                phone=data['phone'],
                status=data['status'],
                photo=data['photo']
            )
            return JsonResponse({'message': 'Employee created successfully.'})
        except KeyError as e:
            return JsonResponse({'error': f'Missing field: {str(e)}'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    return JsonResponse({'error': 'Invalid request method.'}, status=405)

@csrf_exempt
def employee_delete(request, employee_id):
    if request.method == 'POST':
        try:
            employee = Employee.objects.get(id=employee_id)
            
            # Delete the employee record
            employee.delete()
            
            return JsonResponse({'message': 'Employee deleted successfully.'})
        except Employee.DoesNotExist:
            return JsonResponse({'error': 'Employee not found.'}, status=404)
    return JsonResponse({'error': 'Invalid request method.'}, status=405)


@csrf_exempt
def update_employee(request, employee_id):
    if request.method == 'POST':
        try:
            employee = Employee.objects.get(id=employee_id)
            data = json.loads(request.body)

            employee.name = data.get('name', employee.name)
            employee.department = data.get('department', employee.department)
            employee.email = data.get('email', employee.email)
            employee.position = data.get('position', employee.position)
            employee.phone = data.get('phone', employee.phone)
            employee.status = data.get('status', employee.status)
            employee.photo = data.get('photo', employee.photo)

            employee.save()
            return JsonResponse({'message': 'Employee updated successfully.'})
        except Employee.DoesNotExist:
            return JsonResponse({'error': 'Employee not found.'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    return JsonResponse({'error': 'Invalid request method.'}, status=405)