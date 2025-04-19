import asyncio
import json
import embeddings.npfaceembedding as npface
import embeddings.qdrant_client as qdrant
import numpy as np
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
from insightface.app import cv2
from PIL import Image
from .models import Employee


def employee_list(request):
    employees = Employee.objects.all()

    # Get pagination query params
    page = int(request.GET.get("page", 1))
    limit = int(request.GET.get("limit", 10))

    # Paginate
    paginator = Paginator(employees, limit)
    current_page = paginator.get_page(page)

    data = [
        {
            "id": emp.id,
            "name": emp.name,
            "department": emp.department,
            "position": emp.position,
            "email": emp.email,
            "phone": emp.phone,
            "status": emp.status,
            "photo": emp.photo.url if emp.photo else "/media/employee_photos/avatar.jpg"
        }
        for emp in current_page
    ]

    return JsonResponse({
        "results": data,
        "total": paginator.count,
        "page": current_page.number,
        "num_pages": paginator.num_pages,
    })


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


async def save_embedding(__array, name, id):

    embedding = npface.get_image_embedding(
        cv2.resize(__array, (640, 640)), npface.model
    )
    if embedding is None:
        return
    qdrant.qdrant.upsert(
        collection_name=qdrant.collection_name,
        points=[
            qdrant.models.PointStruct(
                id=qdrant.generate_session(),
                payload={
                    "id": id,
                    "name": name,
                },
                vector=embedding,
            ),
        ],
    )


@csrf_exempt
def employee_create(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method."}, status=405)
    print(request.POST)
    required_fields = ["name", "department", "email", "position", "phone", "status"]

    # Check missing fields
    for field in required_fields:
        if field not in request.POST:
            return JsonResponse({"error": f"Missing field: {field}"}, status=400)

    if "photo" not in request.FILES:
        return JsonResponse({"error": "Missing field: photo"}, status=400)

    try:
        employee = Employee.objects.create(
            name=request.POST["name"],
            department=request.POST["department"],
            email=request.POST["email"],
            position=request.POST["position"],
            phone=request.POST["phone"],
            status=request.POST["status"],
            photo=request.FILES["photo"],
        )

        image = Image.open(request.FILES["photo"]).convert("RGB")
        image_array = np.array(image)

        asyncio.run(save_embedding(image_array, employee.name, employee.id))

        return JsonResponse(
            {
                "message": "Employee created successfully.",
                "employee": {
                    "id": employee.id,
                    "name": employee.name,
                    "email": employee.email,
                    "department": employee.department,
                    "position": employee.position,
                    "phone": employee.phone,
                    "status": employee.status,
                    "photo": employee.photo.url if employee.photo else None,
                },
            }
        )

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def employee_delete(request, employee_id):
    if request.method == "POST":
        try:
            employee = Employee.objects.get(id=employee_id)

            # Delete the employee record
            employee.delete()

            return JsonResponse({"message": "Employee deleted successfully."})
        except Employee.DoesNotExist:
            return JsonResponse({"error": "Employee not found."}, status=404)
    return JsonResponse({"error": "Invalid request method."}, status=405)


@csrf_exempt
def update_employee(request, employee_id):
    if request.method == "POST":
        try:
            employee = Employee.objects.get(id=employee_id)
            data = json.loads(request.body)

            employee.name = data.get("name", employee.name)
            employee.department = data.get("department", employee.department)
            employee.email = data.get("email", employee.email)
            employee.position = data.get("position", employee.position)
            employee.phone = data.get("phone", employee.phone)
            employee.status = data.get("status", employee.status)
            employee.photo = data.get("photo", employee.photo)

            employee.save()
            return JsonResponse({"message": "Employee updated successfully."})
        except Employee.DoesNotExist:
            return JsonResponse({"error": "Employee not found."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON."}, status=400)
    return JsonResponse({"error": "Invalid request method."}, status=405)
