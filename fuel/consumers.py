# consumers.py
class UserNotifications(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.channel_layer.group_add(
            f"user_{self.scope['user'].id}",
            self.channel_name
        )

    async def coupon_allocated(self, event):
        await self.send(text_data=json.dumps(event))