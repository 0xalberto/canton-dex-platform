"""
WebSocket Notification Service
Real-time event streaming via WebSocket and other notification channels
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import asyncio
from datetime import datetime

app = FastAPI(title="Canton DEX Notification Service")

class ConnectionManager:
    """Manage WebSocket connections"""
    
    def __init__(self):
        # {user_id: {connection, subscribed_topics}}
        self.active_connections: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, topics: List[str]):
        """Accept and register new connection"""
        await websocket.accept()
        self.active_connections[user_id] = {
            "websocket": websocket,
            "topics": set(topics),
        }
    
    async def disconnect(self, user_id: str):
        """Remove connection"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def broadcast_to_user(self, user_id: str, message: dict):
        """Send message to specific user"""
        if user_id in self.active_connections:
            connection = self.active_connections[user_id]
            try:
                await connection["websocket"].send_json(message)
            except Exception as e:
                print(f"Failed to send message: {e}")
    
    async def broadcast_to_topic(self, topic: str, message: dict):
        """Broadcast message to all subscribers of topic"""
        for user_id, connection in self.active_connections.items():
            if topic in connection["topics"]:
                try:
                    await connection["websocket"].send_json(message)
                except Exception as e:
                    print(f"Failed to send message: {e}")
    
    def get_subscribed_users(self, topic: str) -> Set[str]:
        """Get all users subscribed to topic"""
        return {
            user_id for user_id, conn in self.active_connections.items()
            if topic in conn["topics"]
        }

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time notifications"""
    topics = []
    await manager.connect(websocket, user_id, topics)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe":
                topic = message.get("topic")
                manager.active_connections[user_id]["topics"].add(topic)
                await websocket.send_json({
                    "type": "subscribed",
                    "topic": topic,
                })
            
            elif message.get("type") == "unsubscribe":
                topic = message.get("topic")
                manager.active_connections[user_id]["topics"].discard(topic)
                await websocket.send_json({
                    "type": "unsubscribed",
                    "topic": topic,
                })
    
    except WebSocketDisconnect:
        await manager.disconnect(user_id)

@app.post("/api/v1/events")
async def publish_event(event: dict):
    """Publish event to subscribers"""
    topic = event.get("topic")
    payload = {
        "type": "event",
        "topic": topic,
        "data": event,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    await manager.broadcast_to_topic(topic, payload)
    return {"status": "published"}

@app.get("/api/v1/subscriptions/{user_id}")
async def get_subscriptions(user_id: str):
    """Get active subscriptions for user"""
    if user_id in manager.active_connections:
        topics = manager.active_connections[user_id]["topics"]
        return {"user_id": user_id, "subscriptions": list(topics)}
    return {"user_id": user_id, "subscriptions": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
