from enum import Enum

import requests
from dotenv import load_dotenv
from npfaceembedding import *
from ultralytics import os

load_dotenv()


class ENV(Enum):
    EMMBEDING_MODEL_URL = os.getenv("EMMBEDING_MODEL_URL") or ""
    IDENTIFICATION_SYSTEM_URL = os.getenv("IDENTIFICATION_SYSTEM_URL") or ""


def req_id(frame):
    embedding = get_image_embedding(cv2.resize(frame, (640, 640)), model)

    if embedding is None:
        return embedding

    vector_str = ",".join(map(str, embedding))
    response = requests.get(
        ENV.IDENTIFICATION_SYSTEM_URL.value, params={"vector": vector_str}
    )
    if response.status_code != 200:
        return embedding
    print(response.json())
    exit(20)
    return embedding
