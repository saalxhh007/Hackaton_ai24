from django.urls import path
from . import views

urlpatterns = [
    path('employees/', views.employee_list, name='employee_list'),
    path('employees/<int:employee_id>/', views.employee_detail, name='employee_detail'),
    path("employees/create/", views.employee_create, name="employee_create"),
    path('employees/update/<int:employee_id>/', views.update_employee, name="update_employee")
]