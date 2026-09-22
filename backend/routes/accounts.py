import hashlib
import hmac
import secrets
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status

from database import db
from models.account import (
    AccountCreate,
    AccountLogin,
    AccountResponse,
    AccountUpdate,
)

router = APIRouter(prefix="/accounts", tags=["accounts"])


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000
    )
    return f"{salt}${digest.hex()}"


def verify_password(password: str, encoded_password: str) -> bool:
    try:
        salt, expected_digest = encoded_password.split("$", 1)
    except ValueError:
        return False

    actual_digest = hash_password(password, salt).split("$", 1)[1]
    return hmac.compare_digest(actual_digest, expected_digest)


def serialize_account(account: dict) -> dict:
    return AccountResponse(
        id=str(account["_id"]),
        shopkeeperName=account["shopkeeper_name"],
        mobile=account["mobile"],
        shopName=account["shop_name"],
        shopType=account["shop_type"],
        language=account.get("language", "en"),
        address=account.get("address"),
    ).model_dump()


def find_account(account_id: str) -> dict | None:
    if not ObjectId.is_valid(account_id):
        return None
    return db.accounts.find_one({"_id": ObjectId(account_id)})


@router.post("/register", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def register(account: AccountCreate):
    if db.accounts.find_one({"mobile": account.mobile}):
        raise HTTPException(status_code=409, detail="An account with this mobile number already exists")

    account_data = account.model_dump(exclude={"password"})
    account_data["password_hash"] = hash_password(account.password)
    account_data["created_at"] = datetime.now(timezone.utc)

    result = db.accounts.insert_one(account_data)
    account_data["_id"] = result.inserted_id
    return serialize_account(account_data)


@router.post("/login", response_model=AccountResponse)
def login(credentials: AccountLogin):
    account = db.accounts.find_one({"mobile": credentials.mobile})
    if not account or not verify_password(credentials.password, account.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")

    return serialize_account(account)


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: str):
    account = find_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return serialize_account(account)


@router.patch("/{account_id}", response_model=AccountResponse)
def update_account(account_id: str, updates: AccountUpdate):
    if not find_account(account_id):
        raise HTTPException(status_code=404, detail="Account not found")

    changes = {
        key: value
        for key, value in updates.model_dump().items()
        if value is not None
    }
    if changes:
        db.accounts.update_one({"_id": ObjectId(account_id)}, {"$set": changes})

    return serialize_account(find_account(account_id))
