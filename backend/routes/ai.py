from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Literal
from google import genai
from google.genai import types
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import os
import re
import time

from database import db
from utils.resolver import find_customer, find_product


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

router = APIRouter()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

GEMINI_MODEL = "gemini-3.5-flash-lite"

DRAFT_TIMEOUT_MINUTES = 30

IST = ZoneInfo("Asia/Kolkata")


# ============================================================
# STRUCTURED AI OUTPUT
# ============================================================

class AIItem(BaseModel):
    product: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None


class AIUpdate(BaseModel):
    customer: Optional[str] = None
    items: Optional[List[AIItem]] = None
    total_amount: Optional[float] = None
    paid_amount: Optional[float] = None
    payment_method: Optional[str] = None
    stock_product: Optional[str] = None
    stock_quantity: Optional[float] = None
    stock_unit: Optional[str] = None
    stock_price: Optional[float] = None


class AIResult(BaseModel):
    intent: Literal[
        "sale",
        "payment",
        "query",
        "correction",
        "stock_addition",
        "unknown"
    ]

    updates: AIUpdate

    new_customer: bool = False
    new_product: bool = False

    needs_clarification: bool = False
    clarification_question: Optional[str] = None

    reply: str = ""


class AIRequest(BaseModel):
    text: str
    language: str
    account_id: str
    chat_id: Optional[str] = None


# ============================================================
# LANGUAGE HELPERS
# ============================================================

def normalize_language(language: str) -> str:
    value = (language or "en").lower()

    if value == "auto":
        return "auto"

    if value.startswith("hi"):
        return "hi"

    if value.startswith("mr"):
        return "mr"

    return "en"


def detect_language(text: str, selected_language: str) -> str:
    selected = normalize_language(selected_language)

    if selected != "auto":
        return selected

    lowered = text.lower()

    marathi_markers = (
        "आहे",
        "आहेत",
        "घेतला",
        "घेतले",
        "यांनी",
        "मला",
        "किती",
        "दिले",
        "देतो",
        "देत",
        "बाकी",
        "हिशोब",
        "महिन्यात",
        "आठवड्यात",
    )

    if any(marker in lowered for marker in marathi_markers):
        return "mr"

    if re.search(r"[\u0900-\u097f]", text):
        return "hi"

    return "en"


# ============================================================
# DATE / TIME HELPERS
# ============================================================

def ist_now() -> datetime:
    return datetime.now(IST)


def ist_midnight_to_utc(date_value: datetime) -> datetime:
    local_value = date_value.astimezone(IST).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    return local_value.astimezone(timezone.utc)


def query_period(text: str):
    """
    Return UTC boundaries representing the requested calendar period
    in the shop's Indian timezone.
    """

    lowered = text.lower()
    now_ist = ist_now()

    start_ist = None
    end_ist = now_ist

    if any(
        word in lowered
        for word in (
            "today",
            "आज",
            "आजचा",
            "आजची",
            "आजचे",
            "आज का",
        )
    ):
        start_ist = now_ist.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

    elif any(
        word in lowered
        for word in (
            "yesterday",
            "कल",
            "काल",
        )
    ):
        today_start = now_ist.replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

        start_ist = today_start - timedelta(days=1)
        end_ist = today_start

    elif any(
        word in lowered
        for word in (
            "this month",
            "इस महीने",
            "इस माह",
            "या महिन्यात",
            "या महिन्यातील",
        )
    ):
        start_ist = now_ist.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

    elif any(
        word in lowered
        for word in (
            "this week",
            "इस हफ्ते",
            "इस सप्ताह",
            "या आठवड्यात",
            "या आठवड्यातील",
        )
    ):
        start_ist = (
            now_ist
            - timedelta(days=now_ist.weekday())
        ).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

    if not start_ist:
        return None, None

    return (
        start_ist.astimezone(timezone.utc),
        end_ist.astimezone(timezone.utc)
    )


# ============================================================
# LANGUAGE TEXT
# ============================================================

def language_text(language: str, key: str) -> str:
    language = normalize_language(language)

    if language == "auto":
        language = "en"

    texts = {
        "hi": {
            "greeting": "नमस्ते! बताइए, आज दुकान का क्या हिसाब है?",
            "greeting_with_draft": "नमस्ते! हम अभी आपका पिछला हिसाब पूरा कर रहे थे।",
            "total": "कुल कितने रुपये हुए?",
            "paid": "कितने रुपये दिए गए?",
            "customer": "ग्राहक का नाम बताइए।",
            "items": "ग्राहक ने क्या लिया?",
            "quantity": "कितनी मात्रा ली?",
            "more": "थोड़ी और जानकारी बताइए।",
            "saved": "ठीक है, हिसाब दर्ज कर दिया है।",
            "new_customer": "नया ग्राहक मिला है।",
            "product_not_found": "यह उत्पाद आपकी सूची में नहीं मिला।",
            "product_added": "ठीक है, उत्पाद जोड़ दिया है।",
            "payment_recorded": "ठीक है, भुगतान हिसाब में दर्ज कर दिया है।",
            "payment_too_high": "भुगतान कुल राशि से अधिक नहीं हो सकता। कृपया सही राशि बताइए।",
        },
        "mr": {
            "greeting": "नमस्कार! सांगा, आज दुकानचा काय हिशोब आहे?",
            "greeting_with_draft": "नमस्कार! आपण आधीचा हिशोब पूर्ण करत होतो.",
            "total": "एकूण किती रुपये झाले?",
            "paid": "किती रुपये दिले?",
            "customer": "ग्राहकाचे नाव सांगा.",
            "items": "ग्राहकाने काय घेतले?",
            "quantity": "किती प्रमाणात घेतले?",
            "more": "थोडी अधिक माहिती सांगा.",
            "saved": "ठीक आहे, हिशोब नोंदवला आहे.",
            "new_customer": "नवीन ग्राहक सापडला आहे.",
            "product_not_found": "हे उत्पादन तुमच्या यादीत सापडले नाही.",
            "product_added": "ठीक आहे, उत्पादन जोडले आहे.",
            "payment_recorded": "ठीक आहे, पेमेंट हिशोबात नोंदवले आहे.",
            "payment_too_high": "पेमेंट एकूण रकमेपेक्षा जास्त असू शकत नाही. कृपया योग्य रक्कम सांगा.",
        },
        "en": {
            "greeting": "Namaste! Tell me, what happened at the shop today?",
            "greeting_with_draft": "Namaste! We were in the middle of finishing the previous record.",
            "total": "What was the total amount?",
            "paid": "How much was paid?",
            "customer": "What is the customer's name?",
            "items": "What did the customer buy?",
            "quantity": "What quantity was purchased?",
            "more": "Tell me a little more.",
            "saved": "Done, the transaction has been recorded.",
            "new_customer": "This is a new customer.",
            "product_not_found": "I couldn't find that product in your list.",
            "product_added": "Okay, I've added the product.",
            "payment_recorded": "Done, the payment has been recorded.",
            "payment_too_high": "The payment cannot be greater than the total. Please tell me the correct amount.",
        },
    }

    return texts[language].get(
        key,
        texts[language]["more"]
    )


def stock_product_question(language: str) -> str:
    language = normalize_language(language)
    if language == "mr":
        return "स्टॉकमध्ये कोणते उत्पादन जोडायचे?"
    if language == "hi":
        return "स्टॉक में कौन सा उत्पाद जोड़ना है?"
    return "Which product should I add to stock?"


def stock_quantity_question(language: str, product: str) -> str:
    language = normalize_language(language)
    if language == "mr":
        return f"{product} किती प्रमाणात स्टॉकमध्ये जोडायचे?"
    if language == "hi":
        return f"{product} कितनी मात्रा में स्टॉक में जोड़ना है?"
    return f"How many units of {product} should I add to stock?"


def stock_price_question(language: str, product: str, unit: str | None) -> str:
    language = normalize_language(language)
    unit_text = unit or "unit"
    if language == "mr":
        return f"{product} ची प्रति {unit_text} किंमत किती आहे?"
    if language == "hi":
        return f"{product} की प्रति {unit_text} कीमत कितनी है?"
    return f"What is the price per {unit_text} for {product}?"


def stock_added_reply(language: str, product: str, quantity: float, unit: str | None, price: float | None = None) -> str:
    q = f"{quantity:g}"
    u = f" {unit}" if unit else ""
    if language == "mr":
        extra = f" किंमत: ₹{price:g} प्रति {unit or 'unit'}." if price is not None else ""
        return f"ठीक आहे, {product} चे {q}{u} स्टॉकमध्ये जोडले आहे.{extra}"
    if language == "hi":
        extra = f" कीमत: ₹{price:g} प्रति {unit or 'यूनिट'}." if price is not None else ""
        return f"ठीक है, {product} के {q}{u} स्टॉक में जोड़ दिए हैं।{extra}"
    extra = f" Price: ₹{price:g} per {unit or 'unit'}." if price is not None else ""
    return f"Done, I added {q}{u} of {product} to your stock.{extra}"


def stock_new_product_question(language: str, product: str, quantity: float, unit: str | None) -> str:
    q = f"{quantity:g}"
    u = unit or "unit"
    language = normalize_language(language)
    if language == "mr":
        return f"{product} तुमच्या उत्पादन यादीत नाही. {q} {u} स्टॉकसह नवीन उत्पादन जोडू का?"
    if language == "hi":
        return f"{product} आपकी उत्पाद सूची में नहीं है। {q} {u} स्टॉक के साथ नया उत्पाद जोड़ दूँ?"
    return f"{product} is not in your product list. Should I add it with {q} {u} in stock?"


def stock_recheck_requested(text: str) -> bool:
    t = " ".join((text or "").lower().split())
    markers = (
        "check stock", "check the stock", "check inventory", "check again",
        "recheck", "re-check", "again check", "stock check",
        "stock me dikha", "stock mein dikha", "stock me dikh",
        "stock mein dikh", "नहीं दिख", "नहीं दिख रहा", "दिख नहीं",
        "फिर से चेक", "फिर चेक", "दोबारा चेक", "पुन्हा चेक",
        "स्टॉकमध्ये दिसत", "स्टॉकमध्ये दिसत नाही", "स्टॉक मध्ये दिसत नाही",
        "पुन्हा तपास", "तपासून पाह", "तपासा",
    )
    return any(marker in t for marker in markers)


def stock_unit_tokens() -> tuple[str, ...]:
    return (
        "packet", "packets", "pack", "packs", "piece", "pieces", "pc", "pcs",
        "kg", "kilo", "kilos", "kilogram", "kilograms", "unit", "units",
        "पैकेट", "पैकेट्स", "पॅकेट", "पॅकेट्स", "पीस", "नग",
        "किलो", "किलोग्राम", "युनिट", "युनिट्स",
    )


def clean_stock_product_name(name: Optional[str]) -> Optional[str]:
    """Remove quantity/unit scaffolding accidentally returned as the product name."""
    if not name:
        return None

    value = " ".join(str(name).strip().split())
    if not value:
        return None

    # Strip leading quantity, unit and filler words.
    unit_pattern = "|".join(re.escape(x) for x in stock_unit_tokens())
    value = re.sub(rf"^\s*\d+(?:\.\d+)?\s+(?:{unit_pattern})\s+(?:of|का|के|की|चे|च्या|चा|ची)?\s*", "", value, flags=re.I)
    value = re.sub(rf"^\s*(?:{unit_pattern})\s+(?:of|का|के|की|चे|च्या|चा|ची)?\s*", "", value, flags=re.I)

    # Gemini sometimes returns "Packets Handkerchiefs" for
    # "50 packets of handkerchiefs". Remove only a leading unit token.
    value = re.sub(rf"^\s*(?:{unit_pattern})\s+", "", value, flags=re.I)

    # Strip trailing unit tokens too, but do not remove a legitimate word in the middle.
    value = re.sub(rf"\s+(?:{unit_pattern})\s*$", "", value, flags=re.I)

    value = re.sub(r"^\s*(?:of|का|के|की|चे|च्या|चा|ची)\s+", "", value, flags=re.I)
    value = " ".join(value.split())
    return value or None


def normalize_stock_ai_result(ai_result: AIResult) -> AIResult:
    if ai_result.intent != "stock_addition":
        return ai_result

    if ai_result.updates.stock_product:
        cleaned = clean_stock_product_name(ai_result.updates.stock_product)
        if cleaned:
            ai_result.updates.stock_product = cleaned

    if ai_result.updates.items:
        for item in ai_result.updates.items:
            if item.product:
                item.product = clean_stock_product_name(item.product) or item.product.strip()

    return ai_result


def get_last_stock_action(account_id: str, chat_id: Optional[str]) -> Optional[dict]:
    if not chat_id:
        return None
    session = db.chat_sessions.find_one(
        {"account_id": account_id, "chat_id": chat_id},
        {"last_stock_action": 1}
    )
    return session.get("last_stock_action") if session else None


def stock_recheck_reply(language: str, action: dict, product: Optional[dict]) -> dict:
    product_name = (product or {}).get("name") or action.get("product") or "this product"
    stock = float((product or {}).get("stock", 0))
    unit = (product or {}).get("unit") or action.get("unit") or "unit"
    price = (product or {}).get("price")

    if product:
        if language == "mr":
            reply = f"हो, {product_name} स्टॉकमध्ये सेव आहे. सध्याचा स्टॉक {stock:g} {unit} आहे."
        elif language == "hi":
            reply = f"हाँ, {product_name} स्टॉक में सेव है। अभी स्टॉक {stock:g} {unit} है।"
        else:
            reply = f"Yes, {product_name} is saved in stock. Current stock is {stock:g} {unit}."
    else:
        if language == "mr":
            reply = f"मला {product_name} स्टॉकमध्ये सापडले नाही."
        elif language == "hi":
            reply = f"मुझे {product_name} स्टॉक में नहीं मिला।"
        else:
            reply = f"I could not find {product_name} in your stock."

    result = {
        "intent": "stock_addition",
        "reply": reply,
        "stock_recheck": True,
        "stock": {
            "product": product_name,
            "quantity": stock,
            "unit": unit,
        },
    }
    if price is not None:
        result["stock"]["price"] = float(price)
    return result


def stock_acknowledgement_requested(text: str) -> bool:
    """Recognize short acknowledgements after a completed stock action.

    These messages should not accidentally fall into the sale/customer flow.
    """
    normalized = " ".join((text or "").lower().strip().split())
    acknowledgements = {
        "ok", "okay", "okay thanks", "thanks", "thank you",
        "बर", "बरं", "ठीक", "ठीक आहे", "ठीक आहे धन्यवाद",
        "हो ठीक", "हो ठीक आहे", "चालेल", "बरं मग",
        "ओके", "धन्यवाद", "थँक्स",
        "ठिक", "ठिक आहे",
    }
    return normalized in acknowledgements


def stock_context_requested(text: str) -> bool:
    t = " ".join((text or "").lower().split())
    markers = (
        "stock", "inventory", "add to stock", "in stock", "stock me",
        "stock mein", "add product", "new product", "product in stock",
        "product name", "product ka naam", "product ke naam",
        "productच्या", "प्रोडक्शन", "प्रॉडक्शन", "प्रॉडक्ट", "उत्पादन",
        "स्टॉक", "इन्वेंटरी", "साठा", "स्टॉकमध्ये", "स्टॉक में",
        "उत्पादन जोडा", "उत्पाद जोड़", "सामान स्टॉक", "सामान जोडा",
    )
    return any(marker in t for marker in markers)

def parse_stock_price(text: str) -> Optional[float]:
    t = (text or "").lower().replace(",", "")
    # Price-like expressions: ₹100, rs 100, price 100, at 100, per packet 100.
    patterns = (
        r"(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)",
        r"(?:price|cost|at|per\s+(?:packet|packets|piece|pieces|kg|kilo|unit|units))\s*(?:is|of|:)?\s*(\d+(?:\.\d+)?)",
        r"(?:कीमत|किंमत|भाव|दर)\s*(?:है|:)?\s*(\d+(?:\.\d+)?)",
    )
    for pattern in patterns:
        m = re.search(pattern, t)
        if m:
            return float(m.group(1))
    # A pending price answer like "100" or "100 रुपये".
    if re.fullmatch(r"(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?\s*(?:रुपये|रुपए|रुपया|rupees|rs\.?|)?", t):
        return parse_number(t)
    return None


def extract_stock_unit(text: str) -> Optional[str]:
    t = (text or "").lower()
    if re.search(r"\bpackets?\b|पैकेट|पॅकेट", t):
        return "packet"
    if re.search(r"\bpieces?\b|\bpcs?\b|पीस|नग", t):
        return "piece"
    if re.search(r"\b(?:kg|kilo|kilogram)s?\b|किलो|किलोग्राम", t):
        return "kg"
    return None


def stock_number_from_message(text: str, expect_price: bool = False) -> Optional[float]:
    if expect_price:
        return parse_stock_price(text)
    return parse_number(text)


def save_last_stock_action(account_id: str, chat_id: Optional[str], action: dict) -> None:
    if not chat_id:
        return
    db.chat_sessions.update_one(
        {"account_id": account_id, "chat_id": chat_id},
        {"$set": {"last_stock_action": action, "updated_at": datetime.now(timezone.utc)}}
    )


def clear_last_stock_action(account_id: str, chat_id: Optional[str]) -> None:
    if not chat_id:
        return
    db.chat_sessions.update_one(
        {"account_id": account_id, "chat_id": chat_id},
        {"$unset": {"last_stock_action": ""}}
    )


def merge_stock_updates(draft: dict, updates: AIUpdate) -> dict:
    if updates.stock_product:
        draft["stock_product"] = updates.stock_product.strip()
    if updates.stock_quantity is not None:
        draft["stock_quantity"] = float(updates.stock_quantity)
    if updates.stock_unit:
        draft["stock_unit"] = updates.stock_unit.strip().lower()
    if updates.stock_price is not None:
        draft["stock_price"] = float(updates.stock_price)
    return draft


def normalize_stock_unit(unit: Optional[str]) -> Optional[str]:
    if not unit:
        return None
    t = unit.lower().strip()
    mapping = {
        "packets": "packet", "packet": "packet", "पैकेट": "packet", "पॅकेट": "packet",
        "pieces": "piece", "piece": "piece", "pcs": "piece", "pc": "piece", "पीस": "piece", "नग": "piece",
        "kg": "kg", "kilo": "kg", "kilogram": "kg", "किलो": "kg", "किलोग्राम": "kg",
    }
    return mapping.get(t, t)


def complete_stock_addition(request: AIRequest, language: str, draft: dict, product: dict, price: Optional[float] = None) -> dict:
    quantity = float(draft.get("stock_quantity") or 0)
    unit = normalize_stock_unit(draft.get("stock_unit") or product.get("unit"))
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Stock quantity must be greater than zero")
    if price is not None and price < 0:
        raise HTTPException(status_code=400, detail="Product price cannot be negative")

    update_fields = {}
    if unit and not product.get("unit"):
        update_fields["unit"] = unit
    if price is not None and not product.get("price"):
        update_fields["price"] = float(price)
    if update_fields:
        db.products.update_one({"_id": product["_id"], "account_id": request.account_id}, {"$set": update_fields})

    db.products.update_one(
        {"_id": product["_id"], "account_id": request.account_id},
        {"$inc": {"stock": quantity}}
    )

    action = {
        "type": "stock_addition",
        "product": product["name"],
        "product_id": product["_id"],
        "quantity": quantity,
        "unit": unit,
        "price": price,
        "created_at": datetime.now(timezone.utc),
    }
    save_last_stock_action(request.account_id, request.chat_id, action)
    clear_draft(request.account_id, request.chat_id)
    return {
        "intent": "stock_addition",
        "reply": stock_added_reply(language, product["name"], quantity, unit, price),
        "stock": {"product": product["name"], "quantity": quantity, "unit": unit, "price": price},
    }


def handle_stock_flow(request: AIRequest, language: str, existing_draft: dict, ai_result: Optional[AIResult] = None) -> Optional[dict]:
    stock_draft = existing_draft if existing_draft.get("intent") == "stock_addition" else {}
    stock_requested = bool(stock_draft) or stock_context_requested(request.text) or (ai_result is not None and ai_result.intent == "stock_addition")
    if not stock_requested:
        return None

    draft = dict(stock_draft)
    draft["intent"] = "stock_addition"

    # Confirmation for a genuinely new product happens before creation.
    pending_new = draft.get("pending_new_stock_product")
    if pending_new:
        if is_rejection(request.text):
            draft.pop("pending_new_stock_product", None)
            draft.pop("pending_stock_price", None)
            draft["intent"] = "stock_addition"
            draft["stock_product"] = None
            save_draft(request.account_id, request.chat_id, draft)
            return {"intent":"stock_addition","reply":stock_product_question(language),"draft":draft,"needs_clarification":True}

        if is_confirmation(request.text):
            pending = pending_new
            draft.pop("pending_new_stock_product", None)
            draft["stock_product_confirmed"] = True
            if draft.get("stock_price") is None:
                draft["pending_stock_price"] = True
                save_draft(request.account_id, request.chat_id, draft)
                return {"intent":"stock_addition","reply":stock_price_question(language, pending["product"], pending.get("unit")),"draft":draft,"needs_clarification":True,"missing_fields":["stock_price"]}
        else:
            # A correction or a complete restatement should be interpreted, not treated as a yes.
            if ai_result is None:
                return {"intent":"stock_addition","reply":stock_new_product_question(language, pending_new["product"], pending_new["quantity"], pending_new.get("unit")),"draft":draft,"needs_clarification":True,"new_stock_product_confirmation":True}

    if draft.get("pending_stock_price"):
        price = parse_stock_price(request.text)
        if price is None and ai_result is not None:
            price = ai_result.updates.stock_price
        if price is None:
            save_draft(request.account_id, request.chat_id, draft)
            return {"intent":"stock_addition","reply":stock_price_question(language, draft.get("stock_product") or "this product", draft.get("stock_unit")),"draft":draft,"needs_clarification":True,"missing_fields":["stock_price"]}
        draft["stock_price"] = float(price)
        draft.pop("pending_stock_price", None)

    if ai_result is not None and ai_result.intent == "stock_addition":
        draft = merge_stock_updates(draft, ai_result.updates)

    # Numeric follow-ups should fill the missing quantity, not become a product name.
    if draft.get("stock_product") and draft.get("stock_quantity") is None:
        qty = stock_number_from_message(request.text)
        if qty is not None and qty > 0:
            draft["stock_quantity"] = qty
        unit = extract_stock_unit(request.text)
        if unit:
            draft["stock_unit"] = unit

    if draft.get("stock_quantity") is not None and not draft.get("stock_unit"):
        unit = extract_stock_unit(request.text)
        if unit:
            draft["stock_unit"] = unit

    cleaned_product_name = clean_stock_product_name(draft.get("stock_product"))
    if cleaned_product_name:
        draft["stock_product"] = cleaned_product_name

    product_name = (draft.get("stock_product") or "").strip()
    quantity = draft.get("stock_quantity")
    unit = normalize_stock_unit(draft.get("stock_unit"))
    price = draft.get("stock_price")

    if not product_name:
        save_draft(request.account_id, request.chat_id, draft)
        return {"intent":"stock_addition","reply":stock_product_question(language),"draft":draft,"needs_clarification":True,"missing_fields":["stock_product"]}

    product = find_product(request.account_id, product_name)
    if product:
        draft["stock_product"] = product["name"]
        if quantity is None:
            save_draft(request.account_id, request.chat_id, draft)
            return {"intent":"stock_addition","reply":stock_quantity_question(language, product["name"]),"draft":draft,"needs_clarification":True,"missing_fields":["stock_quantity"]}
        draft["stock_quantity"] = float(quantity)
        draft["stock_unit"] = unit or product.get("unit")
        # Existing products do not need a new price.
        return complete_stock_addition(request, language, draft, product, None)

    # Unknown product: require quantity first, then confirmation, then price for creation.
    if quantity is None:
        save_draft(request.account_id, request.chat_id, draft)
        return {"intent":"stock_addition","reply":stock_quantity_question(language, product_name),"draft":draft,"needs_clarification":True,"missing_fields":["stock_quantity"]}

    draft["stock_unit"] = unit
    draft["stock_quantity"] = float(quantity)

    if not draft.get("stock_product_confirmed"):
        draft["pending_new_stock_product"] = {"product": product_name, "quantity": float(quantity), "unit": unit}
        save_draft(request.account_id, request.chat_id, draft)
        return {"intent":"stock_addition","reply":stock_new_product_question(language, product_name, float(quantity), unit),"draft":draft,"needs_clarification":True,"new_stock_product_confirmation":True}

    if price is None:
        draft["pending_stock_price"] = True
        save_draft(request.account_id, request.chat_id, draft)
        return {"intent":"stock_addition","reply":stock_price_question(language, product_name, unit),"draft":draft,"needs_clarification":True,"missing_fields":["stock_price"]}

    data = {
        "account_id": request.account_id,
        "name": product_name,
        "price": float(price),
        "stock": float(quantity),
        "unit": unit,
    }
    result = db.products.insert_one(data)
    data["_id"] = result.inserted_id
    action = {"type":"stock_addition","product":data["name"],"product_id":data["_id"],"quantity":float(quantity),"unit":unit,"price":float(price),"created_at":datetime.now(timezone.utc)}
    save_last_stock_action(request.account_id, request.chat_id, action)
    clear_draft(request.account_id, request.chat_id)
    return {"intent":"stock_addition","reply":stock_added_reply(language, data["name"], float(quantity), unit, float(price)),"stock":{"product":data["name"],"quantity":float(quantity),"unit":unit,"price":float(price)}}


def handle_completed_stock_correction(request: AIRequest, language: str, existing_draft: dict) -> Optional[dict]:
    action = existing_draft.get("last_stock_action")
    if not action or action.get("type") != "stock_addition":
        return None
    text = request.text.strip()
    if not is_correction_message(text):
        return None
    product = db.products.find_one({"_id": action.get("product_id"), "account_id": request.account_id})
    if not product:
        return None
    # Use Gemini result for corrected quantity/price/product when available. This function only handles an explicit recent correction.
    return {"_correction_action": action, "_product": product}


def new_customer_question(language: str, name: str) -> str:
    language = normalize_language(language)

    if language == "mr":
        return (
            f"{name} नवीन ग्राहक आहेत. "
            "त्यांना तुमच्या ग्राहक यादीत जोडू का?"
        )

    if language == "en":
        return (
            f"{name} is a new customer. "
            "Should I add them to your customer list?"
        )

    return (
        f"{name} नए ग्राहक हैं। "
        "क्या मैं उन्हें आपकी ग्राहक सूची में जोड़ दूँ?"
    )


def new_product_question(language: str, name: str) -> str:
    language = normalize_language(language)

    if language == "mr":
        return (
            f"{name} तुमच्या उत्पादन यादीत नाही. "
            "ते जोडू का?"
        )

    if language == "en":
        return (
            f"{name} is not in your product list. "
            "Would you like me to add it?"
        )

    return (
        f"{name} आपकी उत्पाद सूची में नहीं है। "
        "क्या मैं इसे जोड़ दूँ?"
    )


# ============================================================
# BASIC MESSAGE DETECTION
# ============================================================

def is_greeting(text: str) -> bool:
    cleaned = re.sub(
        r"[^a-zA-Z\u0900-\u097F\s]",
        " ",
        text.lower()
    )

    cleaned = " ".join(cleaned.split())

    greetings = {
        "hi",
        "hello",
        "hey",
        "namaste",
        "namaskar",
        "नमस्ते",
        "नमस्कार",
        "हाय",
        "हैलो",
        "हेलो",
        "नमस्कार जी",
        "नमस्ते जी",
    }

    return cleaned in greetings


def parse_number(text: str) -> Optional[float]:
    value = " ".join((text or "").lower().strip().split())
    if not value:
        return None

    match = re.search(r"(?<!\d)(\d+(?:\.\d+)?)(?!\d)", value.replace(",", ""))
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass

    # Speech-to-text often turns 50 into "five zero", "फाईव्ह झिरो", etc.
    # Handle common spoken digit sequences without requiring Gemini.
    digit_words = {
        "zero": "0", "oh": "0", "o": "0", "one": "1", "two": "2",
        "three": "3", "four": "4", "five": "5", "six": "6",
        "seven": "7", "eight": "8", "nine": "9",
        "शून्य": "0", "जीरो": "0", "झिरो": "0", "एक": "1",
        "दो": "2", "तीन": "3", "चार": "4", "पांच": "5", "पाँच": "5",
        "सहा": "6", "सात": "7", "आठ": "8", "नऊ": "9",
        "फाईव्ह": "5", "फाइव": "5", "फाइव्ह": "5",
        "वन": "1", "टू": "2", "थ्री": "3", "फोर": "4",
        "सिक्स": "6", "सेव्हन": "7", "एट": "8", "नाईन": "9",
        "नाइन": "9",
    }

    tokens = value.replace("-", " ").split()
    if tokens and all(token in digit_words for token in tokens):
        digits = "".join(digit_words[token] for token in tokens)
        try:
            return float(digits)
        except ValueError:
            return None

    number_words = {
        "शून्य": 0, "सौ": 100, "सो": 100, "एक सौ": 100,
        "दो सौ": 200, "तीन सौ": 300, "चार सौ": 400,
        "पांच सौ": 500, "पाँच सौ": 500, "एक": 1, "दो": 2,
        "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5,
    }
    for phrase, number in sorted(number_words.items(), key=lambda item: len(item[0]), reverse=True):
        if phrase in value:
            return float(number)

    return None

def is_amount_answer(text: str) -> bool:
    cleaned = text.lower().strip()

    if not cleaned:
        return False

    if len(
        re.findall(
            r"\d+(?:\.\d+)?",
            cleaned
        )
    ) != 1:
        return False

    return bool(
        re.fullmatch(
            r"[\d\s₹,.rsरुपयेऱुपयपैसेरुपया]+",
            cleaned
        )
    )


def says_full_payment(text: str) -> bool:
    t = text.lower()

    phrases = [
        "पूरे पैसे",
        "पूरे रुपए",
        "पूरे रुपये",
        "पूरा पैसा",
        "सारे पैसे",
        "सारे रुपए",
        "सारे रुपये",
        "पूर्ण पैसे",
        "पूर्ण रक्कम",
        "full payment",
        "fully paid",
        "paid in full",
        "पूरा भुगतान",
        "poore paise",
        "poore rupaye",
        "poore rupay",
        "saare paise",
        "saare rupaye",
        "सारे पैसे दे दिए",
        "पूरे पैसे दिए",
        "पूरे रुपए दिए गए",
        "पूरे रुपये दिए गए",
        "पूर्ण पैसे दिले",
        "सगळे पैसे दिले",
        "सगळे पैसे दिले आहेत",
    ]

    return any(
        phrase in t
        for phrase in phrases
    )


def mentions_payment(text: str) -> bool:
    lowered = text.lower()

    return any(
        word in lowered
        for word in (
            "दिए",
            "दिया",
            "रुपए",
            "रुपये",
            "पैसे",
            "rs",
            "₹",
            "diye",
            "diya",
            "rupaye",
            "rupay",
            "paise",
            "paid",
            "payment",
            "दिलेत",
            "दिले",
            "पैसे दिले",
            "पेमेंट",
            "भुगतान",
        )
    )


def is_unrelated_short_message(text: str) -> bool:
    t = text.strip().lower()

    return (
        len(t) <= 3
        and t in {
            "ok",
            "okay",
            "thanks",
            "thank you",
            "धन्यवाद",
            "ठीक है",
            "ठीक",
            "बरं",
            "बर",
        }
    )


# ============================================================
# CONFIRMATION / CORRECTION DETECTION
# ============================================================

def is_rejection(text: str) -> bool:
    normalized = " ".join(
        text.lower().strip().split()
    )

    rejection_phrases = {
        "no",
        "n",
        "नहीं",
        "नाही",
        "मत जोड़ो",
        "मत जोड़ो",
        "रहने दो",
        "छोड़ दीजिए",
        "छोड़ दो",
        "छोड़ दीजिये",
        "नहीं जोड़ना",
        "नहीं जोड़ना",
        "नको",
        "नको जोडू",
        "नको जोड़ू",
        "नको जोडायचं",
        "नको जोडायला",
        "don't add",
        "do not add",
        "dont add",
    }

    if normalized in rejection_phrases:
        return True

    negative_patterns = (
        "मत जोड़",
        "मत जोड़",
        "नहीं जोड़",
        "नहीं जोड़",
        "नको जोड",
        "नको जोड",
        "don't add",
        "do not add",
    )

    return any(
        pattern in normalized
        for pattern in negative_patterns
    )


def is_confirmation(text: str) -> bool:
    normalized = " ".join(
        text.lower().strip().split()
    )

    if is_rejection(normalized):
        return False

    exact_confirmations = {
        "yes",
        "y",
        "ok",
        "okay",
        "haan",
        "हाँ",
        "हां",
        "हो",
        "होय",
        "yes add",
        "add him",
        "add her",
        "add customer",
        "add it",
        "add this",
        "उन्हें जोड़ दो",
        "उन्हें जोड़ दे",
        "उसे जोड़ दो",
        "जोड़ दो",
        "जोड़ा",
        "जोड़ा",
        "जोडा",
        "जोडू",
        "जोड़ दीजिए",
        "जोडा जाए",
        "जोडा द्या",
        "जोडा करा",
        "हो जोडा",
        "हो जोड़ा",
        "हो जोडा",
        "होय जोडा",
        "होय जोड़ा",
    }

    if normalized in exact_confirmations:
        return True

    positive_patterns = (
        "yes add",
        "add it",
        "add this",
        "please add",
        "i want to add",
        "i would like to add",
        "हां जोड़",
        "हाँ जोड़",
        "हो जोड",
        "हो जोडा",
        "हो जोड़ा",
        "जोड़ दीजिए",
        "जोडा द्या",
        "जोडा करा",
    )

    return any(
        pattern in normalized
        for pattern in positive_patterns
    )




def extract_customer_correction_name(text: str, current_name: str = "") -> Optional[str]:
    """Extract an explicitly corrected customer name from a short follow-up.

    This is intentionally conservative: it handles common natural phrases such as
    'मी अमित वर्मा', 'कस्टमरचं नाव अमित वर्मा आहे', and 'customer name is Amit Verma'.
    A single surname can replace the surname of the currently proposed customer.
    """
    raw = " ".join((text or "").strip().split())
    if not raw:
        return None

    # Strip common punctuation without destroying Devanagari text.
    cleaned = re.sub(r"[,:;.!?।]+", " ", raw)
    cleaned = " ".join(cleaned.split())

    patterns = (
        r"(?:कस्टमर|ग्राहक|customer)(?:[^\n]{0,30})?(?:नाव|नाम)\s*(?:है|आहे|is|=)?\s*(.+)$",
        r"(?:कस्टमर(?:चे|चं|चा|का)?\s*)?(?:नाव|नाम)\s+(?:है|आहे)?\s*(.+)$",
        r"(?:customer|customer name|name)\s*(?:is|=)?\s*(.+)$",
        r"^(?:मी|मेरा नाम|माझं नाव|माझे नाव|my name is|i am)\s+(.+)$",
        r"^(?:customer is|customer name is)\s+(.+)$",
    )

    for pattern in patterns:
        match = re.search(pattern, cleaned, flags=re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            candidate = re.sub(r"^(?:है|आहे)\s+", "", candidate, flags=re.IGNORECASE).strip()
            if candidate and len(candidate) >= 2:
                return candidate

    # If the current proposed name has a surname and the user only says the
    # surname, treat it as a surname correction instead of repeating the old name.
    current_parts = current_name.split()
    candidate_parts = cleaned.split()
    if len(current_parts) >= 2 and len(candidate_parts) == 1:
        surname = candidate_parts[0]
        if len(surname) >= 2:
            return f"{current_parts[0]} {surname}"

    # A short two-word name is itself a strong explicit replacement.
    if len(candidate_parts) == 2 and all(len(part) >= 2 for part in candidate_parts):
        return cleaned

    return None


def is_product_correction(text: str) -> bool:
    """
    Only detect actual product/name correction signals.

    Do NOT treat generic words such as:
    customer, came, आया, आले, सामान
    as product corrections.
    """

    normalized = " ".join(
        text.lower().strip().split()
    )

    correction_markers = (
        "not lace",
        "actually lays",
        "actually lay's",
        "lays",
        "lay's",
        "lays packet",
        "लैज़",
        "लेज़",
        "लैस",
        "लेस नहीं",
        "product is",
        "product should be",
        "the product is",
        "उत्पाद है",
        "सामान है",
        "गलत सामान",
        "गलत प्रोडक्ट",
        "गलत उत्पाद",
        "नहीं यह",
        "नहीं, यह",
        "नहीं ये",
        "नहीं, ये",
        "instead",
        "rather",
        "actually",
        "गलत है",
        "चुकी",
        "चुका",
    )

    return any(
        marker in normalized
        for marker in correction_markers
    )


def is_correction_message(text: str) -> bool:
    normalized = " ".join(
        text.lower().strip().split()
    )

    markers = (
        "actually",
        "instead",
        "not ",
        "no,",
        "नहीं",
        "गलत",
        "बल्कि",
        "मतलब",
        "सही नाम",
        "सही उत्पाद",
        "नहीं था",
        "नहीं है",
        "नहीं दिए",
        "कम दिए",
        "ज्यादा दिए",
        "दुरुस्त",
        "चूक",
    )

    return any(
        marker in normalized
        for marker in markers
    )


# ============================================================
# DRAFT HELPERS
# ============================================================

def next_missing_question(language: str, draft: dict) -> str:
    missing = validate_draft(draft)

    if "customer" in missing:
        return language_text(language, "customer")

    if "items" in missing:
        return language_text(language, "items")

    if "total_amount" in missing:
        return language_text(language, "total")

    if "paid_amount" in missing:
        return language_text(language, "paid")

    return language_text(language, "more")


def get_active_conversation(
    account_id: str,
    chat_id: Optional[str]
) -> Optional[dict]:

    if not chat_id:
        return None

    conversation = db.chat_sessions.find_one({
        "chat_id": chat_id,
        "account_id": account_id
    })

    if not conversation:
        return None

    updated_at = conversation.get("updated_at")

    if updated_at:
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(
                tzinfo=timezone.utc
            )

        age_minutes = (
            datetime.now(timezone.utc) - updated_at
        ).total_seconds() / 60

        if age_minutes > DRAFT_TIMEOUT_MINUTES:
            db.chat_sessions.update_one(
                {"_id": conversation["_id"]},
                {
                    "$set": {
                        "draft": {},
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )

            return None

    return conversation


def save_draft(
    account_id: str,
    chat_id: Optional[str],
    draft: dict
) -> None:

    if not chat_id:
        return

    db.chat_sessions.update_one(
        {
            "chat_id": chat_id,
            "account_id": account_id
        },
        {
            "$set": {
                "draft": draft,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )


def clear_draft(
    account_id: str,
    chat_id: Optional[str]
) -> None:

    if not chat_id:
        return

    db.chat_sessions.update_one(
        {
            "chat_id": chat_id,
            "account_id": account_id
        },
        {
            "$set": {
                "draft": {},
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )


def set_confirmation(
    draft: dict,
    confirmation_type: str
) -> None:

    draft["pending_confirmation"] = {
        "type": confirmation_type
    }


def clear_confirmation(
    draft: dict,
    confirmation_type: Optional[str] = None
) -> None:

    pending = draft.get("pending_confirmation")

    if (
        confirmation_type is None
        or not pending
        or pending.get("type") == confirmation_type
    ):
        draft.pop(
            "pending_confirmation",
            None
        )


def get_recent_chat_context(
    account_id: str,
    chat_id: Optional[str],
    limit: int = 16
) -> list[dict]:

    if not chat_id:
        return []

    messages = list(
        db.chat_messages.find(
            {
                "account_id": account_id,
                "chat_id": chat_id
            },
            {
                "_id": 0,
                "sender": 1,
                "text": 1
            }
        )
        .sort("created_at", -1)
        .limit(limit)
    )

    messages.reverse()

    return messages


def merge_update(
    draft: dict,
    updates: AIUpdate
) -> dict:

    data = updates.model_dump(
        exclude_none=True
    )

    for key, value in data.items():

        if key == "items":

            if value:
                draft["items"] = value

        else:
            draft[key] = value

    return draft


def validate_draft(draft: dict) -> list[str]:
    missing = []

    if not draft.get("customer"):
        missing.append("customer")

    if not draft.get("items"):
        missing.append("items")

    if draft.get("total_amount") is None:
        missing.append("total_amount")

    if draft.get("paid_amount") is None:
        missing.append("paid_amount")

    return missing


def has_complete_items(draft: dict) -> bool:
    return bool(
        draft.get("items")
    ) and all(
        item.get("product")
        and item.get("quantity") is not None
        for item in draft["items"]
    )


def incomplete_items_response(
    language: str,
    draft: dict
) -> dict:

    return {
        "reply": language_text(
            language,
            "items"
        ),
        "draft": draft,
        "needs_clarification": True,
        "missing_fields": ["items"],
    }


# ============================================================
# ENTITY HELPERS
# ============================================================

def get_shop_entities(account_id: str):
    customers = list(
        db.customers.find(
            {"account_id": account_id},
            {"name": 1}
        )
    )

    products = list(
        db.products.find(
            {"account_id": account_id},
            {
                "name": 1,
                "unit": 1
            }
        )
    )

    return (
        [
            x["name"]
            for x in customers
            if x.get("name")
        ],
        [
            x["name"]
            for x in products
            if x.get("name")
        ]
    )


def ensure_customer(
    account_id: str,
    name: str,
    explicitly_new: bool
):

    customer = find_customer(
        account_id,
        name
    )

    if customer:
        return customer

    if not explicitly_new:
        return None

    data = {
        "account_id": account_id,
        "name": name,
        "phone": None,
    }

    result = db.customers.insert_one(data)

    data["_id"] = result.inserted_id

    return data


def ensure_product(
    account_id: str,
    item: dict,
    total_amount: float,
    item_count: int
):

    product_name = item.get("product")

    if not product_name:
        return None

    return find_product(
        account_id,
        product_name
    )


def create_product_from_draft(
    account_id: str,
    item: dict,
    draft: dict
) -> dict:

    quantity = float(
        item.get("quantity") or 0
    )

    total_amount = float(
        draft.get("total_amount") or 0
    )

    price = (
        total_amount / quantity
        if quantity
        and len(draft.get("items", [])) == 1
        else 0
    )

    data = {
        "account_id": account_id,
        "name": item["product"],
        "price": price,
        "stock": 0,
        "unit": item.get("unit"),
    }

    result = db.products.insert_one(data)

    data["_id"] = result.inserted_id

    return data


# ============================================================
# SAVE TRANSACTION
# ============================================================

def save_transaction(
    account_id: str,
    draft: dict,
    new_customer: bool
):

    customer_name = draft.get(
        "customer"
    )

    customer = ensure_customer(
        account_id,
        customer_name,
        new_customer
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Customer not found: "
                f"{customer_name}"
            )
        )

    total_amount = float(
        draft["total_amount"]
    )

    paid_amount = float(
        draft["paid_amount"]
    )

    if total_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Total amount cannot be negative"
        )

    if paid_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Paid amount cannot be negative"
        )

    if paid_amount > total_amount:
        raise HTTPException(
            status_code=400,
            detail=(
                "Paid amount cannot be greater "
                "than total amount"
            )
        )

    raw_items = draft["items"]

    resolved_items = []

    for item in raw_items:

        if (
            not item.get("product")
            or item.get("quantity") is None
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Please tell me the product "
                    "and quantity before saving "
                    "the transaction."
                )
            )

        product = ensure_product(
            account_id,
            item,
            total_amount,
            len(raw_items)
        )

        if not product:
            raise HTTPException(
                status_code=400,
                detail="Product information is incomplete"
            )

        resolved_items.append({
            "product": product["name"],
            "quantity": float(
                item["quantity"]
            ),
            "unit": item.get("unit")
        })

    pending_amount = (
        total_amount - paid_amount
    )

    if pending_amount == 0:
        payment_status = "paid"

    elif paid_amount == 0:
        payment_status = "credit"

    else:
        payment_status = "partial"

    transaction_data = {
        "account_id": account_id,
        "customer": customer["name"],
        "items": resolved_items,
        "total_amount": total_amount,
        "paid_amount": paid_amount,
        "payment_method": draft.get(
            "payment_method"
        ),
        "pending_amount": pending_amount,
        "payment_status": payment_status,
        "created_at": datetime.now(
            timezone.utc
        )
    }

    result = db.transactions.insert_one(
        transaction_data
    )

    transaction_data["_id"] = str(
        result.inserted_id
    )

    return transaction_data


# ============================================================
# FAST LOCAL FOLLOW-UP HANDLING
# ============================================================

def handle_fast_followup(
    request: AIRequest,
    draft: dict
) -> Optional[dict]:

    language = normalize_language(
        request.language
    )

    text = request.text.strip()

    if not draft:
        return None

    # --------------------------------------------------------
    # TOTAL AMOUNT
    # --------------------------------------------------------

    if (
        draft.get("total_amount") is None
        and is_amount_answer(text)
        and not says_full_payment(text)
    ):

        amount = parse_number(text)

        if amount is not None:
            draft["total_amount"] = amount

            save_draft(
                request.account_id,
                request.chat_id,
                draft
            )

            if draft.get("paid_amount") is None:
                return {
                    "reply": language_text(
                        language,
                        "paid"
                    ),
                    "draft": draft,
                    "needs_clarification": True,
                    "missing_fields": [
                        "paid_amount"
                    ]
                }

    # --------------------------------------------------------
    # FULL PAYMENT
    # --------------------------------------------------------

    if (
        draft.get("total_amount") is not None
        and draft.get("paid_amount") is None
        and says_full_payment(text)
    ):

        draft["paid_amount"] = float(
            draft["total_amount"]
        )

        missing = validate_draft(draft)

        if missing:
            save_draft(
                request.account_id,
                request.chat_id,
                draft
            )

            return {
                "reply": next_missing_question(
                    language,
                    draft
                ),
                "draft": draft,
                "needs_clarification": True,
                "missing_fields": missing
            }

        return None

    # --------------------------------------------------------
    # NUMERIC PAYMENT
    # --------------------------------------------------------

    if (
        draft.get("total_amount") is not None
        and draft.get("paid_amount") is None
    ):

        amount = parse_number(text)

        if amount is not None:

            if amount > float(
                draft["total_amount"]
            ):
                return {
                    "reply": language_text(
                        language,
                        "payment_too_high"
                    ),
                    "draft": draft,
                    "needs_clarification": True,
                    "missing_fields": [
                        "paid_amount"
                    ]
                }

            draft["paid_amount"] = amount

            missing = validate_draft(
                draft
            )

            if missing:
                save_draft(
                    request.account_id,
                    request.chat_id,
                    draft
                )

                return {
                    "reply": next_missing_question(
                        language,
                        draft
                    ),
                    "draft": draft,
                    "needs_clarification": True,
                    "missing_fields": missing
                }

            return None

        if mentions_payment(text):
            return {
                "reply": language_text(
                    language,
                    "paid"
                ),
                "draft": draft,
                "needs_clarification": True,
                "missing_fields": [
                    "paid_amount"
                ]
            }

    return None


# ============================================================
# GEMINI — CONVERSATIONAL BRAIN
# ============================================================

def call_gemini(
    request: AIRequest,
    existing_draft: dict,
    customer_names: list[str],
    product_names: list[str],
    recent_messages: list[dict]
) -> AIResult:

    language = normalize_language(
        request.language
    )

    language_name = {
        "hi": (
            "Hindi. Reply naturally in Devanagari Hindi."
        ),
        "mr": (
            "Marathi. Reply naturally in Devanagari Marathi."
        ),
        "en": (
            "English. Reply naturally in English."
        )
    }[language]

    prompt = f"""
You are DukaanSaathi.

You are NOT a form-filling bot.

You are a conversational AI shop assistant for a small Indian
shopkeeper. The shopkeeper should be able to talk to you naturally,
the way they would talk to a helpful human assistant.

Your job is to understand what the shopkeeper MEANS, remember the
conversation, keep track of the current situation, and convert the
meaning into safe structured business updates.

RESPONSE LANGUAGE:
{language_name}

SUPPORTED COMMUNICATION:
- Hindi
- Marathi
- English
- Hinglish
- Hindi-English code switching
- Marathi-English code switching
- Devanagari
- Roman Hindi
- Roman Marathi
- imperfect speech-to-text
- incomplete sentences
- informal shopkeeper language

============================================================
CONVERSATIONAL BEHAVIOUR
============================================================

Think conversationally before extracting fields.

The shopkeeper may say:

"अमित आया था"

then:

"उसने दो किलो चावल लिया"

then:

"दो सौ का"

then:

"पूरे दे दिए"

You must understand that all four messages can describe ONE
continuous transaction.

Do NOT require the shopkeeper to repeat the customer or product
name in every message.

Pronouns and contextual references may refer to the active
conversation:

- he
- she
- him
- her
- they
- usne
- usko
- unhone
- unko
- उसने
- उसे
- उन्होंने
- उन्हें
- त्याने
- त्यांनी
- त्याला
- त्यांना
- वही वाला
- वही सामान
- that one
- the same customer
- the same product

Resolve these from the current conversation and current draft when
the reference is unambiguous.

============================================================
CURRENT DRAFT
============================================================

{existing_draft}

The CURRENT DRAFT represents the transaction currently being
discussed.

If the current message clearly continues it, update that draft.

If the message clearly starts a completely different transaction,
do not force it into the old transaction.

============================================================
RECENT CONVERSATION
============================================================

{recent_messages}

Use recent conversation to understand references, corrections,
pronouns, customer names, products, and unfinished information.

Do not treat every message as an independent command.

============================================================
CURRENT MESSAGE
============================================================

{request.text}

============================================================
SHOP DATA
============================================================

EXISTING CUSTOMERS:
{customer_names}

EXISTING PRODUCTS:
{product_names}

These are canonical MongoDB entities belonging to THIS shop.

============================================================
CUSTOMER UNDERSTANDING
============================================================

If the shopkeeper says:

"Amit came"

and there is one clear Amit in the customer list, use that
canonical customer.

If the shopkeeper says:

"Amit bhai"

"Verma ji"

"अमित भाई"

"वर्मा जी"

and there is one obvious matching customer, resolve it naturally.

If multiple customers could match and the difference matters,
DO NOT guess. Ask a clarification question.

If the shopkeeper explicitly introduces a customer who is not in
the customer list, set:

new_customer = true

and extract the customer's name exactly as the shopkeeper stated it.

IMPORTANT NAME-PRESERVATION RULE:
For a NEW customer, NEVER translate, transliterate, romanize,
anglicize, normalize, or replace the customer's name with an
English/Hindi/Marathi equivalent. Preserve the actual name/script
from CURRENT MESSAGE. For example, if the shopkeeper says
"अमित वर्मा", the customer field must be "अमित वर्मा", not
"Amit Verma" and not another inferred name. If the shopkeeper says
"Amit Verma", keep "Amit Verma".

Preserve explicitly stated names accurately.

If the shopkeeper corrects a customer:

"अमित कुमार नहीं, अमित वर्मा"

"not Amit Kumar, Amit Verma"

then replace the old customer with the corrected one.

Do not keep both names in the same draft.

============================================================
PRODUCT UNDERSTANDING
============================================================

Understand products semantically across languages.

Examples:

rice / chawal / चावल / tandul / तांदूळ
sugar / chini / चीनी / sakhar / साखर

If one canonical product in EXISTING PRODUCTS clearly matches
the user's expression, use that canonical product name.

If the user says:

"वही चावल"

and the current conversation clearly refers to Rice, continue
with Rice.

If the product reference is ambiguous, ask instead of guessing.

If a product is genuinely not in EXISTING PRODUCTS, set:

new_product = true

IMPORTANT NEW-PRODUCT NAME RULE:
For a NEW product, preserve the product name exactly as the
shopkeeper stated it in CURRENT MESSAGE. NEVER translate or
transliterate it merely because the response language is Hindi,
Marathi, or English. For example, "ऑल आऊट" must remain "ऑल आऊट"
when it is a new product; "All Out" must remain "All Out" when that
is what the shopkeeper said.

Do NOT silently invent a product.

Speech recognition may confuse:

Lays / Lay's / लेज़ / लैज़

with:

lace / लेस

If the shopkeeper clearly means Lays, preserve it as Lays.

============================================================
AMOUNTS
============================================================

Never invent prices.

If the shopkeeper gives:

"200"
"200 रुपये"
"₹200"
"दो सौ"

and the active draft is waiting for the total, set:

total_amount = 200

If total_amount is already known and the shopkeeper says:

"150 दिए"
"150 रुपये दिए"
"150 paid"

then set:

paid_amount = 150

for the CURRENT SALE.

If the shopkeeper says:

"पूरे पैसे दे दिए"
"full payment"
"सारे पैसे मिल गए"

set:

paid_amount = total_amount

Only do this when total_amount is known.

============================================================
CORRECTIONS
============================================================

Corrections modify the current draft.

Examples:

"नहीं, 200 नहीं 150 था"

"Actually it was 150"

"चावल नहीं, चीनी"

"अमित नहीं, राहुल"

"दो किलो नहीं, तीन किलो"

Do NOT create a second transaction.

Return only the corrected fields.

============================================================
PAYMENT VS CURRENT SALE
============================================================

There are two different situations.

CURRENT SALE:

"अमित ने 150 दिए"

means paid_amount for the current draft.

OLD DEBT PAYMENT:

"अमित ने अपना पुराना 500 का उधार दे दिया"

means intent = payment.

Use intent = payment only when the message clearly refers to
settling an existing old balance.

============================================================
QUERIES
============================================================

Questions are not transactions.

Examples:

"अमित का कितना बाकी है?"

"आज कितनी बिक्री हुई?"

"इस महीने कितना कमाया?"

"सबसे ज्यादा किसका उधार है?"

"अमित ने क्या खरीदा था?"

Use intent = query.

Use the current draft/customer context when it helps identify
who the shopkeeper is referring to.

============================================================
MISSING INFORMATION
============================================================

Do not ask for information that is already known.

Ask ONLY for the next genuinely required piece of information.

For example:

Customer known.
Product known.
Quantity known.
Total missing.

Ask for the total.

Do NOT ask the customer name again.

If multiple pieces are missing, ask the most natural next question,
not a list of five questions.

============================================================
NATURAL REPLIES
============================================================

The reply should sound like a helpful human shop assistant.

Bad:

"Intent detected: sale."

Bad:

"Please provide total_amount."

Bad:

"Customer field missing."

Good:

"अच्छा, अमित ने दो किलो चावल लिया। कुल कितने रुपये हुए?"

Good:

"ठीक है, 150 रुपये मिले। बाकी 50 रुपये रह गए।"

Do not calculate pending_amount in the AI output.

The backend calculates financial values.

============================================================
IMPORTANT SAFETY RULE
============================================================

You understand and propose structured updates.

You NEVER save anything to MongoDB.

You NEVER claim that a database operation happened.

The backend validates your proposed customer/product against MongoDB
and performs the actual database operation.

============================================================
STOCK ADDITION — IMPORTANT
============================================================

Stock addition is a separate business action from a customer sale.
Never ask for a customer name when the shopkeeper is adding stock.

If the shopkeeper says:

"add a new product handkerchiefs in stock"
"50 packets of handkerchiefs"
"स्टॉक में 20 पैकेट चाय पत्ती डालो"

use:
intent = stock_addition

and put the meaning into these update fields:
stock_product
stock_quantity
stock_unit
stock_price

The product field MUST contain only the actual product name.
Do NOT include instruction words such as:
- add
- product name
- in stock
- stock
- packets
- pieces
- price
- we have to

For example:

"add product name tea leaves, 12 packets"

means:
stock_product = "Tea Leaves"
stock_quantity = 12
stock_unit = "packet"

NOT:
"We Have A Product Name Tea Leaves"

"packets of handkerchiefs" means:
stock_product = "Handkerchiefs"
stock_unit = "packet"

If the current stock draft already knows the product, then:
"50 packets"
should fill quantity = 50 and unit = packet without changing the
product to "Packets".

A unit is NEVER a product name.

A one-shot message such as:
"add 50 packets of handkerchiefs at 100 each"
should extract all four values.

If the price is not stated for a genuinely new product, do not invent
it. The backend will ask for the price before creating the product.

Existing products can receive additional stock without asking for
customer information.

Corrections to a stock draft modify the stock draft. Do not switch to
a sale merely because the word "customer" appears in a noisy speech
transcript.

============================================================
============================================================
OUTPUT RULES
============================================================

Return ONLY the structured response matching the provided schema.

Only include fields that the CURRENT MESSAGE supplies, changes,
or clearly resolves from conversation context.

Do not invent prices.

Do not invent quantities.

Do not invent customers.

Do not invent products.

Do not duplicate transactions.

Do not turn casual conversation into a sale.

If the message is unrelated to the shop and no useful business
action exists, use intent = unknown and give a natural short reply.
"""

    last_error = None
    models_to_try = [GEMINI_MODEL, "gemini-3.8-flash", "gemini-3.7-flash"]

    for model_name in models_to_try:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AIResult
                    )
                )
                return AIResult.model_validate_json(response.text)
            except Exception as e:
                last_error = e
                error_text = str(e)
                if "503" not in error_text and "UNAVAILABLE" not in error_text:
                    raise
                if attempt == 0:
                    time.sleep(1.5)

    e = last_error
    print(f"Gemini error: {e}")
    raise HTTPException(
        status_code=503,
        detail="AI service is temporarily unavailable. Please try again."
    )


# ============================================================
# PRODUCT NORMALIZATION
# ============================================================

def normalize_product_from_text(
    text: str,
    ai_result: AIResult
) -> AIResult:

    lowered = text.lower()

    lays_mentioned = bool(
        re.search(
            r"\blay['’]?s\b|\blays\b|lays packet",
            lowered
        )
        or any(
            word in text
            for word in (
                "लेज़",
                "लैज़",
                "लैस",
            )
        )
    )

    if ai_result.intent == "stock_addition":
        return normalize_stock_ai_result(ai_result)

    if not lays_mentioned:
        return ai_result

    if ai_result.updates.items:

        for item in ai_result.updates.items:

            if item.product:
                product_lower = (
                    item.product
                    .strip()
                    .lower()
                )

                if product_lower in {
                    "lace",
                    "lays",
                    "lay's",
                    "लेस",
                    "लेज़",
                    "लैज़",
                }:
                    item.product = "Lays"

    return ai_result


# ============================================================
# MAIN ENDPOINT
# ============================================================

@router.post("/ai/process")
def process_ai(request: AIRequest):

    text = request.text.strip()

    language = detect_language(
        text,
        request.language
    )

    request.language = language

    if not text:
        return {
            "reply": language_text(
                language,
                "more"
            ),
            "needs_clarification": True
        }

    # --------------------------------------------------------
    # GET ACTIVE CONVERSATION FIRST
    # --------------------------------------------------------

    conversation = get_active_conversation(
        request.account_id,
        request.chat_id
    )

    existing_draft = (
        conversation.get("draft", {})
        if conversation
        else {}
    )

    # --------------------------------------------------------
    # FULL PAYMENT WITHOUT ACTIVE SALE
    # --------------------------------------------------------

    if (
        not existing_draft
        and says_full_payment(text)
    ):
        return {
            "intent": "unknown",
            "reply": language_text(
                language,
                "more"
            ),
            "needs_clarification": False,
        }

    # --------------------------------------------------------
    # GREETING
        # IMPORTANT:
        # Preserve current draft.
        # --------------------------------------------------------

    if is_greeting(text):

        if existing_draft and existing_draft.get("intent") == "stock_addition":
            return {
                "intent": "greeting",
                "reply": language_text(language, "greeting"),
                "draft": existing_draft,
                "needs_clarification": True
            }

        if existing_draft:

            missing = validate_draft(
                existing_draft
            )

            if missing:

                return {
                    "intent": "greeting",
                    "reply": (
                        language_text(
                            language,
                            "greeting_with_draft"
                        )
                        + " "
                        + next_missing_question(
                            language,
                            existing_draft
                        )
                    ),
                    "draft": existing_draft,
                    "needs_clarification": True,
                    "missing_fields": missing
                }

        return {
            "intent": "greeting",
            "reply": language_text(
                language,
                "greeting"
            ),
            "needs_clarification": False
        }

    # --------------------------------------------------------
    # STOCK RECHECK — NEVER FALL THROUGH TO CUSTOMER/SALE
    # --------------------------------------------------------
    if stock_recheck_requested(text):
        last_action = get_last_stock_action(
            request.account_id,
            request.chat_id
        )
        if last_action and last_action.get("product"):
            canonical_name = clean_stock_product_name(last_action.get("product")) or last_action.get("product")
            product = find_product(request.account_id, canonical_name)
            if product:
                return stock_recheck_reply(language, last_action, product)

            # If the last action contains a stale/wrong AI-generated name,
            # do not invent a customer or sale. Check the exact stored name once.
            product = db.products.find_one({
                "account_id": request.account_id,
                "name": last_action.get("product")
            })
            return stock_recheck_reply(language, last_action, product)

        # No recent stock action: keep the conversation in stock context.
        return {
            "intent": "stock_addition",
            "reply": (
                "मला अलीकडील स्टॉक अॅक्शन सापडली नाही." if language == "mr"
                else "मुझे हाल की स्टॉक कार्रवाई नहीं मिली।" if language == "hi"
                else "I couldn't find a recent stock action to re-check."
            ),
            "needs_clarification": True,
            "stock_recheck": True
        }

    # --------------------------------------------------------
    # STOCK ACKNOWLEDGEMENT — DO NOT FALL THROUGH TO SALE
    # --------------------------------------------------------
    # After a stock action is completed, a short acknowledgement such as
    # "बर" / "ठीक आहे" is just conversational. It must not be interpreted
    # as the start of a sale and trigger "ग्राहकाचे नाव सांगा".
    if (
        not existing_draft
        and stock_acknowledgement_requested(text)
        and get_last_stock_action(request.account_id, request.chat_id)
    ):
        if language == "mr":
            reply = "ठीक आहे 👍 पुढे काय करायचे आहे?"
        elif language == "hi":
            reply = "ठीक है 👍 अब आगे क्या करना है?"
        else:
            reply = "Okay 👍 What would you like to do next?"
        return {
            "intent": "stock_addition",
            "reply": reply,
            "needs_clarification": False,
        }

    # --------------------------------------------------------
    # STOCK ADDITION — HARD ISOLATION FROM SALES
    # --------------------------------------------------------
    # Once a chat is inside a stock draft, NEVER allow a Gemini
    # misclassification (e.g. a number as "sale") to fall through
    # into customer/sale logic. Local stock state owns this branch.
    if existing_draft.get("intent") == "stock_addition":
        customer_names, product_names = get_shop_entities(
            request.account_id
        )
        recent_messages = get_recent_chat_context(
            request.account_id,
            request.chat_id
        )

        # Handle confirmations, price replies and simple numeric/unit
        # follow-ups locally first. This is especially important for
        # voice transcripts such as "five zero" / "फाईव्ह झिरो".
        if (
            existing_draft.get("pending_new_stock_product")
            or existing_draft.get("pending_stock_price")
            or existing_draft.get("stock_product")
        ):
            local_result = handle_stock_flow(
                request,
                language,
                existing_draft
            )
            if local_result and (
                not local_result.get("missing_fields")
                or local_result.get("intent") == "stock_addition"
            ):
                # If local parsing actually consumed the message, stop.
                # For a missing product name, Gemini gets one chance below.
                if (
                    existing_draft.get("stock_product")
                    or existing_draft.get("pending_new_stock_product")
                    or existing_draft.get("pending_stock_price")
                    or "stock_quantity" in local_result.get("draft", {})
                ):
                    return local_result

        # Let Gemini interpret natural-language product names/details, but
        # keep the result inside stock flow regardless of its intent label.
        stock_ai_result = call_gemini(
            request,
            existing_draft,
            customer_names,
            product_names,
            recent_messages
        )
        stock_ai_result = normalize_product_from_text(
            request.text,
            stock_ai_result
        )
        stock_ai_result = normalize_stock_ai_result(stock_ai_result)

        stock_result = handle_stock_flow(
            request,
            language,
            existing_draft,
            stock_ai_result
        )
        if stock_result:
            return stock_result

        # Absolute guard: an active stock draft must never reach the sale
        # branch, even if Gemini returned an unrelated intent.
        return {
            "intent": "stock_addition",
            "reply": stock_product_question(language),
            "draft": existing_draft,
            "needs_clarification": True,
            "missing_fields": ["stock_product"],
        }

    # No active stock draft: an explicit stock request starts stock flow.
    if stock_context_requested(text):
        customer_names, product_names = get_shop_entities(
            request.account_id
        )
        recent_messages = get_recent_chat_context(
            request.account_id,
            request.chat_id
        )
        stock_ai_result = call_gemini(
            request,
            existing_draft,
            customer_names,
            product_names,
            recent_messages
        )
        stock_ai_result = normalize_product_from_text(
            request.text,
            stock_ai_result
        )
        stock_ai_result = normalize_stock_ai_result(stock_ai_result)
        if stock_ai_result.intent == "stock_addition":
            result = handle_stock_flow(
                request,
                language,
                existing_draft,
                stock_ai_result
            )
            if result:
                return result

    # --------------------------------------------------------
    # RESTORE CONFIRMATION STATE
    # --------------------------------------------------------

    if "pending_confirmation" not in existing_draft:

        if existing_draft.get(
            "pending_new_customer"
        ):
            set_confirmation(
                existing_draft,
                "customer"
            )

        elif existing_draft.get(
            "pending_new_product"
        ):
            set_confirmation(
                existing_draft,
                "product"
            )

    # ========================================================
    # PRODUCT CONFIRMATION
    # ========================================================

    if (
        existing_draft.get(
            "pending_new_product"
        )
        and existing_draft.get(
            "pending_confirmation",
            {}
        ).get("type") == "product"
    ):

        # IMPORTANT:
        # Rejection BEFORE confirmation.
        if is_rejection(text):

            existing_draft.pop(
                "pending_new_product",
                None
            )

            clear_confirmation(
                existing_draft,
                "product"
            )

            existing_draft[
                "product_rejected"
            ] = True

            save_draft(
                request.account_id,
                request.chat_id,
                existing_draft
            )

            if language == "hi":
                reply = (
                    "ठीक है, मैं वह उत्पाद नहीं जोड़ूँगा। "
                    "आप सही उत्पाद का नाम बताइए।"
                )

            elif language == "mr":
                reply = (
                    "ठीक आहे, मी ते उत्पादन जोडणार नाही. "
                    "योग्य उत्पादनाचे नाव सांगा."
                )

            else:
                reply = (
                    "Okay, I won't add that product. "
                    "Tell me the correct product."
                )

            return {
                "reply": reply,
                "draft": existing_draft,
                "needs_clarification": True,
                "missing_fields": ["items"],
            }

        # Actual correction gets sent to Gemini.
        if is_product_correction(text):

            existing_draft.pop(
                "pending_new_product",
                None
            )

            existing_draft.pop(
                "product_rejected",
                None
            )

            clear_confirmation(
                existing_draft,
                "product"
            )

            save_draft(
                request.account_id,
                request.chat_id,
                existing_draft
            )

        elif is_confirmation(text):

            pending_item = existing_draft.pop(
                "pending_new_product"
            )

            clear_confirmation(
                existing_draft,
                "product"
            )

            existing_draft.pop(
                "product_rejected",
                None
            )

            product = find_product(
                request.account_id,
                pending_item.get(
                    "product",
                    ""
                )
            )

            if not product:

                product = create_product_from_draft(
                    request.account_id,
                    pending_item,
                    existing_draft
                )

            # IMPORTANT:
            # Rewrite the current draft item to the
            # actual canonical MongoDB product name.
            canonical_product_name = product[
                "name"
            ]

            for index, item in enumerate(
                existing_draft.get(
                    "items",
                    []
                )
            ):

                if (
                    item.get("product")
                    == pending_item.get("product")
                ):

                    existing_draft[
                        "items"
                    ][index]["product"] = (
                        canonical_product_name
                    )

            # Check customer confirmation next.
            if (
                existing_draft.get(
                    "new_customer"
                )
                and not existing_draft.get(
                    "new_customer_confirmed"
                )
            ):

                existing_draft[
                    "pending_new_customer"
                ] = True

                set_confirmation(
                    existing_draft,
                    "customer"
                )

                save_draft(
                    request.account_id,
                    request.chat_id,
                    existing_draft
                )

                return {
                    "reply": new_customer_question(
                        language,
                        existing_draft.get(
                            "customer",
                            ""
                        )
                    ),
                    "draft": existing_draft,
                    "needs_clarification": True,
                    "new_customer_confirmation": True,
                }

            save_draft(
                request.account_id,
                request.chat_id,
                existing_draft
            )

            missing = validate_draft(
                existing_draft
            )

            if not missing:

                transaction = save_transaction(
                    request.account_id,
                    existing_draft,
                    bool(
                        existing_draft.get(
                            "new_customer_confirmed"
                        )
                    )
                )

                clear_draft(
                    request.account_id,
                    request.chat_id
                )

                return {
                    "message": (
                        "Transaction saved successfully!"
                    ),
                    "reply": language_text(
                        language,
                        "saved"
                    ),
                    "transaction_id": transaction[
                        "_id"
                    ],
                    "transaction": transaction,
                }

            return {
                "reply": next_missing_question(
                    language,
                    existing_draft
                ),
                "draft": existing_draft,
                "needs_clarification": True,
                "missing_fields": missing,
            }

        else:

            pending_name = (
                existing_draft[
                    "pending_new_product"
                ].get("product", "")
            )

            save_draft(
                request.account_id,
                request.chat_id,
                existing_draft
            )

            return {
                "reply": new_product_question(
                    language,
                    pending_name
                ),
                "draft": existing_draft,
                "needs_clarification": True,
                "new_product_confirmation": True,
            }

    # ========================================================
    # CUSTOMER CONFIRMATION
    # ========================================================

    if (
        existing_draft.get(
            "pending_new_customer"
        )
        and existing_draft.get(
            "pending_confirmation",
            {}
        ).get("type") == "customer"
    ):

        # A customer-name correction must update the active draft immediately.
        # Do not keep asking the old confirmation question when the shopkeeper
        # says things such as "मी अमित वर्मा" or simply "वर्मा".
        corrected_customer = extract_customer_correction_name(
            text,
            existing_draft.get("customer", "")
        )
        if corrected_customer and not is_confirmation(text) and not is_rejection(text):
            existing_draft["customer"] = corrected_customer
            existing_draft.pop("customer_rejected", None)
            existing_draft["new_customer_confirmed"] = False
            existing_draft["new_customer"] = not bool(
                find_customer(request.account_id, corrected_customer)
            )
            existing_draft["pending_new_customer"] = True
            set_confirmation(existing_draft, "customer")
            save_draft(
                request.account_id,
                request.chat_id,
                existing_draft
            )
            return {
                "reply": new_customer_question(
                    language,
                    corrected_customer
                ),
                "draft": existing_draft,
                "needs_clarification": True,
                "new_customer_confirmation": True,
            }

        # Rejection BEFORE confirmation.
        if is_rejection(text):

            existing_draft.pop(
                "pending_new_customer",
                None
            )

            clear_confirmation(
                existing_draft,
                "customer"
            )

            existing_draft[
                "customer_rejected"
            ] = True

            save_draft(
                request.account_id,
                request.chat_id,
                existing_draft
            )

            if language == "hi":
                reply = (
                    "ठीक है, मैं नया ग्राहक नहीं जोड़ूँगा। "
                    "अगर नाम या ग्राहक बदलना है तो बताइए।"
                )

            elif language == "mr":
                reply = (
                    "ठीक आहे, मी नवीन ग्राहक जोडणार नाही. "
                    "ग्राहकाचे नाव बदलायचे असल्यास सांगा."
                )

            else:
                reply = (
                    "Okay, I won't add the new customer. "
                    "Tell me if the customer name needs to be changed."
                )

            return {
                "reply": reply,
                "draft": existing_draft,
                "needs_clarification": True,
                "missing_fields": ["customer"],
            }

        if is_confirmation(text):

            existing_draft.pop(
                "pending_new_customer",
                None
            )

            clear_confirmation(
                existing_draft,
                "customer"
            )

            existing_draft[
                "new_customer"
            ] = True

            existing_draft[
                "new_customer_confirmed"
            ] = True

            # Check for unknown products.
            unknown_item = next(
                (
                    item
                    for item in existing_draft.get(
                        "items",
                        []
                    )
                    if (
                        item.get("product")
                        and not find_product(
                            request.account_id,
                            item["product"]
                        )
                    )
                ),
                None
            )

            if unknown_item:

                existing_draft[
                    "pending_new_product"
                ] = unknown_item

                set_confirmation(
                    existing_draft,
                    "product"
                )

                save_draft(
                    request.account_id,
                    request.chat_id,
                    existing_draft
                )

                return {
                    "reply": new_product_question(
                        language,
                        unknown_item["product"]
                    ),
                    "draft": existing_draft,
                    "needs_clarification": True,
                    "new_product_confirmation": True,
                }

            save_draft(
                request.account_id,
                request.chat_id,
                existing_draft
            )

            missing = validate_draft(
                existing_draft
            )

            if not missing:

                transaction = save_transaction(
                    request.account_id,
                    existing_draft,
                    True
                )

                clear_draft(
                    request.account_id,
                    request.chat_id
                )

                return {
                    "message": (
                        "Transaction saved successfully!"
                    ),
                    "reply": language_text(
                        language,
                        "saved"
                    ),
                    "transaction_id": transaction[
                        "_id"
                    ],
                    "transaction": transaction,
                }

            return {
                "reply": next_missing_question(
                    language,
                    existing_draft
                ),
                "draft": existing_draft,
                "needs_clarification": True,
                "missing_fields": missing,
            }

        # A correction such as:
        # "No, actually customer is Rahul"
        # should go to Gemini rather than repeating confirmation.
        if is_correction_message(text):

            existing_draft.pop(
                "pending_new_customer",
                None
            )

            clear_confirmation(
                existing_draft,
                "customer"
            )

            save_draft(
                request.account_id,
                request.chat_id,
                existing_draft
            )

        else:

            return {
                "reply": new_customer_question(
                    language,
                    existing_draft.get(
                        "customer",
                        ""
                    )
                ),
                "draft": existing_draft,
                "needs_clarification": True,
                "new_customer_confirmation": True,
            }

    # ========================================================
    # FAST FOLLOW-UP
    # ========================================================

    fast_result = handle_fast_followup(
        request,
        existing_draft
    )

    if fast_result is not None:

        if not fast_result.get(
            "needs_clarification"
        ):

            if not has_complete_items(
                existing_draft
            ):

                save_draft(
                    request.account_id,
                    request.chat_id,
                    existing_draft
                )

                return incomplete_items_response(
                    language,
                    existing_draft
                )

            if (
                existing_draft.get(
                    "customer"
                )
                and not find_customer(
                    request.account_id,
                    existing_draft["customer"]
                )
                and not existing_draft.get(
                    "new_customer_confirmed"
                )
            ):

                existing_draft[
                    "pending_new_customer"
                ] = True

                set_confirmation(
                    existing_draft,
                    "customer"
                )

                save_draft(
                    request.account_id,
                    request.chat_id,
                    existing_draft
                )

                return {
                    "reply": new_customer_question(
                        language,
                        existing_draft["customer"]
                    ),
                    "draft": existing_draft,
                    "needs_clarification": True,
                    "new_customer_confirmation": True,
                }

            transaction = save_transaction(
                request.account_id,
                existing_draft,
                bool(
                    existing_draft.get(
                        "new_customer_confirmed"
                    )
                )
            )

            clear_draft(
                request.account_id,
                request.chat_id
            )

            return {
                "message": (
                    "Transaction saved successfully!"
                ),
                "reply": language_text(
                    language,
                    "saved"
                ),
                "transaction_id": transaction[
                    "_id"
                ],
                "transaction": {
                    "customer": transaction[
                        "customer"
                    ],
                    "items": transaction[
                        "items"
                    ],
                    "total_amount": transaction[
                        "total_amount"
                    ],
                    "paid_amount": transaction[
                        "paid_amount"
                    ],
                    "pending_amount": transaction[
                        "pending_amount"
                    ],
                    "payment_status": transaction[
                        "payment_status"
                    ]
                }
            }

        return fast_result

    # ========================================================
    # SHOP ENTITIES
    # ========================================================

    customer_names, product_names = get_shop_entities(
        request.account_id
    )

    # ========================================================
    # RECENT CONVERSATION
    # ========================================================

    recent_messages = get_recent_chat_context(
        request.account_id,
        request.chat_id,
        limit=16
    )

    # ========================================================
    # GEMINI
    # ========================================================

    ai_result = call_gemini(
        request,
        existing_draft,
        customer_names,
        product_names,
        recent_messages,
    )

    ai_result = normalize_product_from_text(
        text,
        ai_result
    )

    # ========================================================
    # UNKNOWN / CASUAL
    # ========================================================

    if ai_result.intent == "unknown":

        return {
            "intent": "unknown",
            "reply": (
                ai_result.reply
                or language_text(
                    language,
                    "more"
                )
            ),
            "needs_clarification": False
        }

    # ========================================================
    # QUERY
    # ========================================================

    if ai_result.intent == "query":

        query_text = text.lower()

        period_start, period_end = query_period(
            text
        )

        is_sales_query = any(
            word in query_text
            for word in (
                "sales",
                "sold",
                "बिक्री",
                "विक्री",
                "बेचा",
                "विकले",
                "विक्री किती",
            )
        )

        is_collected_query = any(
            word in query_text
            for word in (
                "collected",
                "received",
                "मिले",
                "मिला",
                "प्राप्त",
                "मिळाले",
                "मिळालेले",
                "वसूल",
            )
        )

        is_pending_query = any(
            word in query_text
            for word in (
                "pending",
                "owe",
                "उधार",
                "बाकी",
                "बकाया",
                "देणे",
            )
        )

        is_top_debt_query = any(
            word in query_text
            for word in (
                "who owes",
                "most",
                "सबसे ज्यादा",
                "सर्वात जास्त",
                "किसका सबसे ज्यादा",
            )
        )

        if (
            (
                is_sales_query
                or is_collected_query
                or is_pending_query
            )
            and period_start
        ):

            period_transactions = list(
                db.transactions.find({
                    "account_id": request.account_id,
                    "created_at": {
                        "$gte": period_start,
                        "$lt": period_end
                    },
                })
            )

            total_sales = sum(
                float(
                    item.get(
                        "total_amount",
                        0
                    )
                )
                for item in period_transactions
            )

            total_collected = sum(
                float(
                    item.get(
                        "paid_amount",
                        0
                    )
                )
                for item in period_transactions
            )

            total_pending = sum(
                float(
                    item.get(
                        "pending_amount",
                        0
                    )
                )
                for item in period_transactions
            )

            if is_collected_query:

                amount = total_collected
                key = "collected"

            elif is_pending_query:

                amount = total_pending
                key = "pending"

            else:

                amount = total_sales
                key = "sales"

            if language == "hi":

                labels = {
                    "sales": "कुल बिक्री",
                    "collected": "कुल प्राप्त",
                    "pending": "कुल बकाया"
                }

                reply = (
                    f"इस अवधि की "
                    f"{labels[key]} "
                    f"₹{amount:.0f} है।"
                )

            elif language == "mr":

                labels = {
                    "sales": "एकूण विक्री",
                    "collected": "एकूण प्राप्त",
                    "pending": "एकूण बाकी"
                }

                reply = (
                    f"या कालावधीतील "
                    f"{labels[key]} "
                    f"₹{amount:.0f} आहे."
                )

            else:

                labels = {
                    "sales": "sales",
                    "collected": "collected",
                    "pending": "pending"
                }

                reply = (
                    f"Total {labels[key]} "
                    f"for this period are "
                    f"₹{amount:.0f}."
                )

            return {
                "intent": "query",
                "reply": reply,
                "total_sales": total_sales,
                "total_collected": total_collected,
                "total_pending": total_pending,
            }

        # ----------------------------------------------------
        # TOP DEBT
        # ----------------------------------------------------

        if is_top_debt_query:

            totals = {}

            for item in db.transactions.find({
                "account_id": request.account_id
            }):

                customer_name = item.get(
                    "customer"
                )

                if not customer_name:
                    continue

                totals[customer_name] = (
                    totals.get(
                        customer_name,
                        0
                    )
                    + float(
                        item.get(
                            "pending_amount",
                            0
                        )
                    )
                )

            customer_name, total_pending = max(
                totals.items(),
                key=lambda pair: pair[1],
                default=(None, 0)
            )

            if customer_name:

                if language == "hi":
                    reply = (
                        f"सबसे ज्यादा बकाया "
                        f"{customer_name} का है: "
                        f"₹{total_pending:.0f}।"
                    )

                elif language == "mr":
                    reply = (
                        f"सर्वात जास्त बाकी "
                        f"{customer_name} यांची आहे: "
                        f"₹{total_pending:.0f}."
                    )

                else:
                    reply = (
                        f"{customer_name} owes the most: "
                        f"₹{total_pending:.0f}."
                    )

                return {
                    "intent": "query",
                    "reply": reply,
                    "pending_amount": total_pending
                }

        # ----------------------------------------------------
        # CUSTOMER QUERY
        # ----------------------------------------------------

        customer_name = (
            ai_result.updates.customer
            or existing_draft.get("customer")
        )

        if customer_name:

            customer = find_customer(
                request.account_id,
                customer_name
            )

            if customer:

                transactions = list(
                    db.transactions.find({
                        "account_id": request.account_id,
                        "customer": customer["name"]
                    })
                )

                total_pending = sum(
                    float(
                        transaction.get(
                            "pending_amount",
                            0
                        )
                    )
                    for transaction in transactions
                )

                purchased_items = [
                    item
                    for transaction in transactions
                    for item in transaction.get(
                        "items",
                        []
                    )
                ]

                asks_purchase_history = any(
                    word in query_text
                    for word in (
                        "bought",
                        "purchased",
                        "क्या खरीदा",
                        "खरेदी",
                        "काय घेतले",
                        "क्या लिया",
                        "क्या लिया था",
                    )
                )

                if asks_purchase_history:

                    products = ", ".join(
                        f"{item.get('quantity', '')} "
                        f"{item.get('unit') or ''} "
                        f"{item.get('product', '')}"
                        .strip()
                        for item in purchased_items
                    )

                    if language == "hi":

                        reply = (
                            f"{customer['name']} ने खरीदा: "
                            f"{products or 'अभी कुछ नहीं'}।"
                        )

                    elif language == "mr":

                        reply = (
                            f"{customer['name']} यांनी घेतले: "
                            f"{products or 'अजून काही नाही'}."
                        )

                    else:

                        reply = (
                            f"{customer['name']} bought: "
                            f"{products or 'nothing yet'}."
                        )

                    return {
                        "intent": "query",
                        "reply": reply,
                        "items": purchased_items
                    }

                if language == "hi":

                    reply = (
                        f"{customer['name']} का कुल "
                        f"बकाया ₹{total_pending:.0f} है।"
                    )

                elif language == "mr":

                    reply = (
                        f"{customer['name']} यांच्याकडून "
                        f"एकूण ₹{total_pending:.0f} बाकी आहेत."
                    )

                else:

                    reply = (
                        f"{customer['name']} has "
                        f"₹{total_pending:.0f} pending."
                    )

                return {
                    "intent": "query",
                    "reply": reply,
                    "pending_amount": total_pending
                }

        return {
            "intent": "query",
            "reply": (
                ai_result.reply
                or language_text(
                    language,
                    "more"
                )
            )
        }

    # ========================================================
    # EXISTING-DEBT PAYMENT
    # ========================================================

    if ai_result.intent == "payment":

        customer_name = (
            ai_result.updates.customer
            or existing_draft.get("customer")
        )

        payment_amount = (
            ai_result.updates.paid_amount
        )

        if (
            not customer_name
            or payment_amount is None
        ):

            draft = merge_update(
                existing_draft.copy(),
                ai_result.updates
            )

            save_draft(
                request.account_id,
                request.chat_id,
                draft
            )

            return {
                "reply": (
                    ai_result.clarification_question
                    or (
                        language_text(
                            language,
                            "customer"
                        )
                        if not customer_name
                        else language_text(
                            language,
                            "paid"
                        )
                    )
                ),
                "draft": draft,
                "needs_clarification": True,
                "missing_fields": (
                    ["customer"]
                    if not customer_name
                    else ["paid_amount"]
                )
            }

        customer = find_customer(
            request.account_id,
            customer_name
        )

        if not customer:

            if language == "hi":

                reply = (
                    "यह ग्राहक अभी आपके रिकॉर्ड में नहीं है।"
                )

            elif language == "mr":

                reply = (
                    "हा ग्राहक अजून तुमच्या नोंदीत नाही."
                )

            else:

                reply = (
                    "This customer is not in your records yet."
                )

            return {
                "reply": reply,
                "needs_clarification": True
            }

        pending_transactions = list(
            db.transactions.find({
                "account_id": request.account_id,
                "customer": customer["name"],
                "pending_amount": {
                    "$gt": 0
                }
            }).sort(
                "created_at",
                1
            )
        )

        remaining_payment = float(
            payment_amount
        )

        for transaction in pending_transactions:

            if remaining_payment <= 0:
                break

            old_pending = float(
                transaction["pending_amount"]
            )

            amount_used = min(
                remaining_payment,
                old_pending
            )

            new_paid = (
                float(
                    transaction["paid_amount"]
                )
                + amount_used
            )

            new_pending = (
                float(
                    transaction["total_amount"]
                )
                - new_paid
            )

            new_status = (
                "paid"
                if new_pending == 0
                else "credit"
                if new_paid == 0
                else "partial"
            )

            db.transactions.update_one(
                {
                    "_id": transaction["_id"],
                    "account_id": request.account_id
                },
                {
                    "$set": {
                        "paid_amount": new_paid,
                        "pending_amount": new_pending,
                        "payment_status": new_status
                    }
                }
            )

            remaining_payment -= amount_used

        clear_draft(
            request.account_id,
            request.chat_id
        )

        return {
            "message": (
                "Payment updated successfully!"
            ),
            "reply": language_text(
                language,
                "payment_recorded"
            )
        }

    # ========================================================
    # SALE / CORRECTION
    # ========================================================

    draft = merge_update(
        existing_draft.copy(),
        ai_result.updates
    )

    # --------------------------------------------------------
    # NEW CUSTOMER
    # --------------------------------------------------------

    new_customer = bool(
        draft.get("new_customer")
        or ai_result.new_customer
    )

    if (
        draft.get("customer")
        and not find_customer(
            request.account_id,
            draft["customer"]
        )
        and not draft.get(
            "new_customer_confirmed"
        )
    ):
        new_customer = True

    draft["new_customer"] = new_customer

    # --------------------------------------------------------
    # CUSTOMER WAS REJECTED
    # --------------------------------------------------------

    if draft.get(
        "customer_rejected"
    ):

        if (
            draft.get("customer")
            and find_customer(
                request.account_id,
                draft["customer"]
            )
        ):
            draft.pop(
                "customer_rejected",
                None
            )

        else:

            save_draft(
                request.account_id,
                request.chat_id,
                draft
            )

            return {
                "reply": (
                    ai_result.clarification_question
                    or language_text(
                        language,
                        "customer"
                    )
                ),
                "draft": draft,
                "needs_clarification": True,
                "missing_fields": [
                    "customer"
                ]
            }

    # --------------------------------------------------------
    # CUSTOMER WAS REJECTED — NAME CORRECTION
    # --------------------------------------------------------

    if draft.get("customer_rejected"):
        corrected_customer = extract_customer_correction_name(
            text,
            draft.get("customer", "")
        )
        if corrected_customer:
            draft["customer"] = corrected_customer
            draft.pop("customer_rejected", None)
            draft["new_customer_confirmed"] = False
            draft["new_customer"] = not bool(
                find_customer(request.account_id, corrected_customer)
            )
            draft["pending_new_customer"] = True
            set_confirmation(draft, "customer")
            save_draft(
                request.account_id,
                request.chat_id,
                draft
            )
            return {
                "reply": new_customer_question(
                    language,
                    corrected_customer
                ),
                "draft": draft,
                "needs_clarification": True,
                "new_customer_confirmation": True,
            }

    # --------------------------------------------------------
    # PRODUCT WAS REJECTED
    # --------------------------------------------------------

    if draft.get(
        "product_rejected"
    ):

        unknown_item = next(
            (
                item
                for item in draft.get(
                    "items",
                    []
                )
                if (
                    item.get("product")
                    and not find_product(
                        request.account_id,
                        item["product"]
                    )
                )
            ),
            None
        )

        if unknown_item:

            return {
                "reply": (
                    "कृपया अपनी उत्पाद सूची में मौजूद "
                    "सामान चुनें या नया उत्पाद जोड़ने "
                    "की पुष्टि करें।"
                    if language == "hi"
                    else
                    "कृपया तुमच्या उत्पादन यादीतील "
                    "सामान निवडा किंवा नवीन उत्पादन "
                    "जोडण्याची पुष्टी करा."
                    if language == "mr"
                    else
                    "Please choose an existing product "
                    "or confirm that I should add "
                    "the new product."
                ),
                "draft": draft,
                "needs_clarification": True,
                "missing_fields": ["items"],
            }

    # --------------------------------------------------------
    # NEW CUSTOMER CONFIRMATION
    # --------------------------------------------------------

    if (
        new_customer
        and draft.get("customer")
        and not existing_draft.get(
            "new_customer_confirmed"
        )
        and not existing_draft.get(
            "pending_new_customer"
        )
    ):

        draft[
            "pending_new_customer"
        ] = True

        set_confirmation(
            draft,
            "customer"
        )

        save_draft(
            request.account_id,
            request.chat_id,
            draft
        )

        return {
            "intent": ai_result.intent,
            "reply": new_customer_question(
                language,
                draft["customer"]
            ),
            "draft": draft,
            "needs_clarification": True,
            "missing_fields": validate_draft(
                draft
            ),
            "new_customer_confirmation": True,
        }

    # --------------------------------------------------------
    # UNKNOWN PRODUCT
    # --------------------------------------------------------

    unknown_item = next(
        (
            item
            for item in draft.get(
                "items",
                []
            )
            if (
                item.get("product")
                and not find_product(
                    request.account_id,
                    item["product"]
                )
            )
        ),
        None
    )

    if (
        unknown_item
        and not existing_draft.get(
            "pending_new_product"
        )
        and not draft.get(
            "product_rejected"
        )
    ):

        draft[
            "pending_new_product"
        ] = unknown_item

        set_confirmation(
            draft,
            "product"
        )

        save_draft(
            request.account_id,
            request.chat_id,
            draft
        )

        return {
            "intent": ai_result.intent,
            "reply": new_product_question(
                language,
                unknown_item["product"]
            ),
            "draft": draft,
            "needs_clarification": True,
            "missing_fields": validate_draft(
                draft
            ),
            "new_product_confirmation": True,
        }

    # --------------------------------------------------------
    # MISSING INFORMATION
    # --------------------------------------------------------

    missing_fields = validate_draft(
        draft
    )

    if missing_fields:

        save_draft(
            request.account_id,
            request.chat_id,
            draft
        )

        if "customer" in missing_fields:

            question = (
                ai_result.clarification_question
                or language_text(
                    language,
                    "customer"
                )
            )

        elif "items" in missing_fields:

            question = (
                ai_result.clarification_question
                or language_text(
                    language,
                    "items"
                )
            )

        elif "total_amount" in missing_fields:

            question = (
                ai_result.clarification_question
                or language_text(
                    language,
                    "total"
                )
            )

        elif "paid_amount" in missing_fields:

            question = (
                ai_result.clarification_question
                or language_text(
                    language,
                    "paid"
                )
            )

        else:

            question = (
                ai_result.clarification_question
                or language_text(
                    language,
                    "more"
                )
            )

        return {
            "intent": ai_result.intent,
            "reply": question,
            "draft": draft,
            "needs_clarification": True,
            "missing_fields": missing_fields
        }

    # ========================================================
    # COMPLETE ITEM VALIDATION
    # ========================================================

    if not has_complete_items(
        draft
    ):

        save_draft(
            request.account_id,
            request.chat_id,
            draft
        )

        return incomplete_items_response(
            language,
            draft
        )

    # ========================================================
    # FINAL CUSTOMER SAFETY CHECK
    # ========================================================

    if (
        draft.get("customer")
        and not find_customer(
            request.account_id,
            draft["customer"]
        )
        and not draft.get(
            "new_customer_confirmed"
        )
    ):

        draft[
            "pending_new_customer"
        ] = True

        set_confirmation(
            draft,
            "customer"
        )

        save_draft(
            request.account_id,
            request.chat_id,
            draft
        )

        return {
            "reply": new_customer_question(
                language,
                draft["customer"]
            ),
            "draft": draft,
            "needs_clarification": True,
            "new_customer_confirmation": True,
        }

    # ========================================================
    # SAVE COMPLETE TRANSACTION
    # ========================================================

    transaction = save_transaction(
        request.account_id,
        draft,
        bool(
            draft.get(
                "new_customer_confirmed"
            )
        )
    )

    clear_draft(
        request.account_id,
        request.chat_id
    )

    return {
        "message": (
            "Transaction saved successfully!"
        ),
        "reply": language_text(
            language,
            "saved"
        ),
        "transaction_id": transaction[
            "_id"
        ],
        "transaction": {
            "customer": transaction[
                "customer"
            ],
            "items": transaction[
                "items"
            ],
            "total_amount": transaction[
                "total_amount"
            ],
            "paid_amount": transaction[
                "paid_amount"
            ],
            "pending_amount": transaction[
                "pending_amount"
            ],
            "payment_status": transaction[
                "payment_status"
            ]
        }
    }