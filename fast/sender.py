# sender.py
import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCDataChannel
import json
from websockets import connect

async def send_photos():
    pc = RTCPeerConnection()
    channel = pc.createDataChannel("photos")

    @channel.on("open")
    def on_open():
        print("Data channel is open")
        # Send multiple photos
        for photo_path in ["photo1.jpg", "photo2.jpg", "photo3.jpg"]:
            with open(photo_path, "rb") as f:
                data = f.read()
                channel.send(data)

    async with connect("ws://localhost:8000/ws/2") as websocket:
        # Create offer
        offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await websocket.send(json.dumps({
            "type": "offer",
            "sdp": pc.localDescription.sdp
        }))

        # Process answers and ICE candidates
        async for message in websocket:
            data = json.loads(message)
            if data.get("type") == "answer":
                await pc.setRemoteDescription(
                    RTCSessionDescription(sdp=data["sdp"], type="answer")
                )
            elif data.get("type") == "ice-candidate":
                await pc.addIceCandidate(data["candidate"])

asyncio.run(send_photos())