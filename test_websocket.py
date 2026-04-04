#!/usr/bin/env python3
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8004/ws/11111111-1111-1111-1111-111111111111"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket")
        try:
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                print(f"Received: {data}")
        except:
            pass

if __name__ == "__main__":
    asyncio.run(test_websocket())
