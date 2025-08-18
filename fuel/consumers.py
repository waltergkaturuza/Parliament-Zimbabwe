# consumers.py
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class UserNotifications(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Extract URL parameters if provided
            role = self.scope.get('url_route', {}).get('kwargs', {}).get('role', 'unknown')
            user_id = self.scope.get('url_route', {}).get('kwargs', {}).get('user_id')
            
            logger.info(f"WebSocket connection attempt - Role: {role}, User ID: {user_id}")

            # Fallback to authenticated user id if not provided
            if not user_id and self.scope.get('user') and getattr(self.scope['user'], 'is_authenticated', False):
                user_id = str(self.scope['user'].id)
                logger.info(f"Using authenticated user ID: {user_id}")

            # Handle case where role or user_id might be None/undefined
            if role in ['undefined', 'null', None] or user_id in ['undefined', 'null', None]:
                logger.warning(f"Invalid WebSocket connection parameters - Role: {role}, User ID: {user_id}")
                # Accept connection but use a default group
                self.group_name = "notifications_general"
            else:
                self.group_name = f"notifications_{role}_{user_id}" if user_id else "notifications_public"

            logger.info(f"WebSocket group: {self.group_name}")
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            logger.info(f"WebSocket connection accepted for group: {self.group_name}")
            
        except Exception as e:
            logger.error(f"WebSocket connection error: {str(e)}")
            await self.close(code=4000)

    async def disconnect(self, close_code):
        try:
            # Leave group on disconnect
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
                logger.info(f"WebSocket disconnected from group: {self.group_name}")
        except Exception as e:
            logger.error(f"WebSocket disconnect error: {str(e)}")

    async def receive(self, text_data=None, bytes_data=None):
        try:
            # Optionally echo or handle pings
            if text_data:
                try:
                    data = json.loads(text_data)
                except json.JSONDecodeError:
                    data = {"message": text_data}
                await self.send(text_data=json.dumps({"type": "echo", "data": data}))
        except Exception as e:
            logger.error(f"WebSocket receive error: {str(e)}")

    # Example handler for server-sent events to this group
    async def coupon_allocated(self, event):
        try:
            await self.send(text_data=json.dumps(event))
        except Exception as e:
            logger.error(f"WebSocket send error: {str(e)}")