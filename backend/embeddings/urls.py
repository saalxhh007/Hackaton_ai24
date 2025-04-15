from django.urls import path
from . import views

urlpatterns = [
    path('get-embeddings/', views.get_embeddings, name='get_embeddings'),
]
