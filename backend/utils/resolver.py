from database import db
import re


def clean_text(value: str) -> str:
    """
    Clean user/AI-provided text without changing its meaning.
    """
    return " ".join((value or "").strip().split())


def find_customer(account_id: str, name: str):
    """
    Find an existing customer by canonical name.

    Customer aliases are intentionally NOT used.
    Natural-language/contextual understanding is handled by the AI.
    MongoDB remains the source of truth.
    """
    cleaned_name = clean_text(name)

    if not cleaned_name:
        return None

    pattern = f"^{re.escape(cleaned_name)}$"

    return db.customers.find_one({
        "account_id": account_id,
        "is_active": {"$ne": False},
        "name": {
            "$regex": pattern,
            "$options": "i"
        }
    })


def find_product(account_id: str, name: str):
    """
    Find an existing product by canonical name.

    Multilingual understanding is handled by the AI.
    This function only verifies the canonical product against MongoDB.
    """
    cleaned_name = clean_text(name)

    if not cleaned_name:
        return None

    pattern = f"^{re.escape(cleaned_name)}$"

    return db.products.find_one({
        "account_id": account_id,
        "name": {
            "$regex": pattern,
            "$options": "i"
        }
    })
