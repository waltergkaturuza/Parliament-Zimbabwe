# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class UserNotifications(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract URL parameters if provided
        role = self.scope.get('url_route', {}).get('kwargs', {}).get('role', 'unknown')
        user_id = self.scope.get('url_route', {}).get('kwargs', {}).get('user_id')

        # Fallback to authenticated user id if not provided
        if not user_id and self.scope.get('user') and getattr(self.scope['user'], 'is_authenticated', False):
            user_id = str(self.scope['user'].id)

        self.group_name = f"notifications_{role}_{user_id}" if user_id else "notifications_public"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave group on disconnect
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Optionally echo or handle pings
        if text_data:
            try:
                data = json.loads(text_data)
            except json.JSONDecodeError:
                data = {"message": text_data}
            await self.send(text_data=json.dumps({"type": "echo", "data": data}))

    # Example handler for server-sent events to this group
    async def coupon_allocated(self, event):
        await self.send(text_data=json.dumps(event))