from fastapi import APIRouter, HTTPException
from models.customer import Customer
from database import db
from datetime import datetime, timezone
import re

router = APIRouter()


def clean_text(value: str) -> str:
    return " ".join((value or "").strip().split())


@router.post("/customers")
def create_customer(customer: Customer):
    name = clean_text(customer.name)

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required"
        )

    existing_customer = db.customers.find_one({
        "account_id": customer.account_id,
        "name": {
            "$regex": f"^{re.escape(name)}$",
            "$options": "i"
        },
        "is_active": {"$ne": False},
    })

    if existing_customer:
        raise HTTPException(
            status_code=409,
            detail="Customer already exists"
        )

    customer_data = customer.model_dump()
    customer_data["name"] = name
    customer_data["is_active"] = True

    result = db.customers.insert_one(customer_data)

    return {
        "message": "Customer created successfully!",
        "id": str(result.inserted_id)
    }


@router.get("/customers")
def get_customers(account_id: str):

    customers = list(
        db.customers.find({
            "account_id": account_id,
            "is_active": {"$ne": False},
        })
    )

    for customer in customers:
        customer["_id"] = str(customer["_id"])

    return customers


@router.get("/customers/search")
def search_customer(
    name: str,
    account_id: str
):
    cleaned_name = clean_text(name)

    if not cleaned_name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required"
        )

    customer = db.customers.find_one({
        "account_id": account_id,
        "is_active": {"$ne": False},
        "name": {
            "$regex": f"^{re.escape(cleaned_name)}$",
            "$options": "i"
        }
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    customer["_id"] = str(customer["_id"])

    return customer


@router.delete("/customers/{name}")
def delete_customer(
    name: str,
    account_id: str
):
    """
    Soft-delete a customer.

    The customer disappears from the active customer list,
    but existing transaction/ledger history remains untouched.
    """

    cleaned_name = clean_text(name)

    if not cleaned_name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required"
        )

    result = db.customers.update_one(
        {
            "account_id": account_id,
            "name": {
                "$regex": f"^{re.escape(cleaned_name)}$",
                "$options": "i"
            },
            "is_active": {"$ne": False},
        },
        {
            "$set": {
                "is_active": False,
                "deleted_at": datetime.now(timezone.utc),
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Active customer not found"
        )

    return {
        "message": "Customer removed from active list"
    }