from django.urls import path
from .views import check_in, check_out

urlpatterns = [
    path("checkIn/", check_in, name='check_in'),
    path("checkOut/", check_out, name='check_out'),
]
