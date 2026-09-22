from datetime import datetime, timezone
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import db

router = APIRouter(prefix="/chats", tags=["chats"])


class ChatCreate(BaseModel):
    title: str = "New chat"


class ChatMessageCreate(BaseModel):
    sender: str = Field(pattern="^(user|assistant)$")
    text: str = Field(min_length=1)


def now():
    return datetime.now(timezone.utc)


def serialize_chat(chat: dict) -> dict:
    return {
        "id": chat["chat_id"],
        "title": chat.get("title") or "New chat",
        "draft": chat.get("draft", {}),
        "created_at": chat.get("created_at"),
        "updated_at": chat.get("updated_at", chat.get("created_at")),
    }


def get_chat(account_id: str, chat_id: str) -> dict:
    chat = db.chat_sessions.find_one({"account_id": account_id, "chat_id": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.get("")
def list_chats(account_id: str, search: str = ""):
    query = {"account_id": account_id}
    if search.strip():
        query["title"] = {"$regex": search.strip(), "$options": "i"}

    chats = db.chat_sessions.find(query).sort("updated_at", -1)
    return [serialize_chat(chat) for chat in chats]


@router.post("")
def create_chat(account_id: str, chat: ChatCreate | None = None):
    timestamp = now()
    chat_data = {
        "chat_id": uuid4().hex,
        "account_id": account_id,
        "title": (chat.title.strip() if chat and chat.title else "New chat"),
        "draft": {},
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    db.chat_sessions.insert_one(chat_data)
    return serialize_chat(chat_data)


@router.get("/{chat_id}")
def get_chat_details(chat_id: str, account_id: str, message_limit: int = 20):
    chat = get_chat(account_id, chat_id)
    messages = list(
        db.chat_messages.find(
            {"account_id": account_id, "chat_id": chat_id},
            {"_id": 0, "sender": 1, "text": 1, "created_at": 1},
        ).sort("created_at", -1).limit(max(1, min(message_limit, 50)))
    )
    messages.reverse()
    return {**serialize_chat(chat), "messages": messages}


@router.post("/{chat_id}/messages")
def add_message(chat_id: str, account_id: str, message: ChatMessageCreate):
    get_chat(account_id, chat_id)
    timestamp = now()
    db.chat_messages.insert_one({
        "account_id": account_id,
        "chat_id": chat_id,
        "sender": message.sender,
        "text": message.text,
        "created_at": timestamp,
    })
    db.chat_sessions.update_one(
        {"account_id": account_id, "chat_id": chat_id},
        {"$set": {"updated_at": timestamp}},
    )
    return {"sender": message.sender, "text": message.text, "created_at": timestamp}


@router.patch("/{chat_id}")
def update_chat(chat_id: str, account_id: str, payload: dict):
    get_chat(account_id, chat_id)
    changes = {key: payload[key] for key in ("title", "draft") if key in payload}
    if changes:
        changes["updated_at"] = now()
        db.chat_sessions.update_one(
            {"account_id": account_id, "chat_id": chat_id},
            {"$set": changes},
        )
    return serialize_chat(get_chat(account_id, chat_id))


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, account_id: str):
    get_chat(account_id, chat_id)
    db.chat_messages.delete_many({"account_id": account_id, "chat_id": chat_id})
    db.chat_sessions.delete_one({"account_id": account_id, "chat_id": chat_id})
    return {"message": "Chat deleted"}
