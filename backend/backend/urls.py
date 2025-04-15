from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('embeddings.urls')),
    path('api2/', include('check_in_out.urls')),
    path('api3/', include('employee.urls')),
]
