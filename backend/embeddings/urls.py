from django.urls import path
from . import views

urlpatterns = [
    path('get-embeddings/', views.get_embeddings, name='get_embeddings'),
    path('get-embedding/', views.get_embedding, name='get_embedding'),
    path('add-embedding/', views.add_embedding, name='add_embedding'),
    path('get-embedding-from-image/', views.get_embedding_from_image, name='get_embedding_from_image'),
]
