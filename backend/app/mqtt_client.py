import asyncio
import json
import structlog
import aiomqtt
from app.config import get_settings
from app.websocket_manager import manager

logger = structlog.get_logger(__name__)
settings = get_settings()

client: aiomqtt.Client | None = None

async def start_mqtt_listener() -> None:
    global client
    client = aiomqtt.Client(
        hostname=settings.mqtt_broker_host,
        port=settings.mqtt_broker_port,
        username=settings.mqtt_username,
        password=settings.mqtt_password,
        identifier=settings.mqtt_client_id
    )
    
    asyncio.create_task(_listen())

async def _listen() -> None:
    global client
    while True:
        try:
            if client is None:
                break
            async with client:
                await client.subscribe("btwin/wells/+/telemetry")
                await client.subscribe("btwin/wells/+/srp")
                await client.subscribe("btwin/wells/+/cmd_response")
                
                logger.info("Connected to MQTT broker and subscribed to topics")
                
                async for message in client.messages:
                    topic = str(message.topic)
                    payload = message.payload.decode()
                    
                    try:
                        data = json.loads(payload)
                        # Process message (write to DB, logic, etc.)
                        
                        # Broadcast via WebSockets
                        well_id = topic.split("/")[2]
                        await manager.broadcast_to_channel(f"telemetry/{well_id}", data)
                    except json.JSONDecodeError:
                        logger.error("Failed to decode MQTT payload", topic=topic, payload=payload)
                    except Exception as e:
                        logger.error("Error processing MQTT message", error=str(e))
                        
        except aiomqtt.MqttError as error:
            logger.error(f"MQTT error: {error}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Unexpected error in MQTT listener: {e}")
            await asyncio.sleep(5)

async def stop_mqtt_listener() -> None:
    # Optional cleanup if needed
    logger.info("Stopping MQTT listener")

async def publish_command(well_id: str, command: dict) -> None:
    global client
    if client:
        try:
            payload = json.dumps(command)
            await client.publish(f"btwin/wells/{well_id}/cmd", payload)
            logger.info("Published command to MQTT", well_id=well_id, command=command)
        except Exception as e:
            logger.error("Failed to publish command", error=str(e))
    else:
        logger.error("MQTT client not initialized")
