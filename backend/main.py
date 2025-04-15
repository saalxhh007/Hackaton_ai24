from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct

app = FastAPI()

qdrant = QdrantClient(host="localhost", port=6333)
collection_name = "face_embeddings"

if not qdrant.collection_exists(collection_name=collection_name):
    qdrant.recreate_collection(
        collection_name=collection_name,
        vectors_config={"size": 4, "distance": "Cosine"}
    )
    qdrant.create_payload_index(
        collection_name=collection_name,
        field_name="user_id",
        field_schema="keyword"
    )

class EmbeddingInput(BaseModel):
    user_id: int
    name: str
    embedding: List[float]

@app.post("/add-embedding")
async def add_embedding(data: EmbeddingInput):
    point = PointStruct(
        id=data.user_id,
        vector=data.embedding,
        payload={"name": data.name, "user_id": data.user_id}
    )
    qdrant.upsert(collection_name=collection_name, points=[point])
    return {"message": "Embedding added successfully", "user_id": data.user_id, "name": data.name}
