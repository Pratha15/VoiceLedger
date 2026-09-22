from fastapi import APIRouter
from database import db
from datetime import datetime


router = APIRouter()


# =========================================================
# GET CURRENT CONVERSATION DRAFT
# =========================================================

@router.get("/conversation/{conversation_id}")
def get_conversation(
    conversation_id: str,
    account_id: str
):

    conversation = db.conversations.find_one({
        "conversation_id": conversation_id,
        "account_id": account_id
    })

    if not conversation:
        return {
            "conversation_id": conversation_id,
            "account_id": account_id,
            "draft": None
        }

    conversation["_id"] = str(
        conversation["_id"]
    )

    return conversation


# =========================================================
# CREATE / UPDATE CONVERSATION DRAFT
# =========================================================

@router.put("/conversation/{conversation_id}")
def update_conversation(
    conversation_id: str,
    account_id: str,
    draft: dict
):

    db.conversations.update_one(
        {
            "conversation_id": conversation_id,
            "account_id": account_id
        },
        {
            "$set": {
                "conversation_id": conversation_id,
                "account_id": account_id,
                "draft": draft,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    return {
        "message": "Conversation draft updated",
        "conversation_id": conversation_id,
        "draft": draft
    }


# =========================================================
# CLEAR CONVERSATION
# =========================================================

@router.delete("/conversation/{conversation_id}")
def clear_conversation(
    conversation_id: str,
    account_id: str
):

    db.conversations.delete_one({
        "conversation_id": conversation_id,
        "account_id": account_id
    })

    return {
        "message": "Conversation cleared"
    }