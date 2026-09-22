from fastapi import APIRouter, HTTPException
from models.product import Product
from database import db
from datetime import datetime, timezone
import re

router = APIRouter()


def clean_text(value: str) -> str:
    return " ".join((value or "").strip().split())


@router.post("/products")
def create_product(product: Product):

    name = clean_text(product.name)

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Product name is required"
        )

    existing_product = db.products.find_one({
        "account_id": product.account_id,
        "name": {
            "$regex": f"^{re.escape(name)}$",
            "$options": "i"
        },
        "is_active": {"$ne": False},
    })

    if existing_product:
        raise HTTPException(
            status_code=409,
            detail="Product already exists"
        )

    product_data = product.model_dump()
    product_data["name"] = name
    product_data["is_active"] = True

    result = db.products.insert_one(product_data)

    return {
        "message": "Product created successfully!",
        "id": str(result.inserted_id)
    }


@router.get("/products")
def get_products(account_id: str):

    products = list(
        db.products.find({
            "account_id": account_id,
            "is_active": {"$ne": False},
        })
    )

    for product in products:
        product["_id"] = str(product["_id"])

    return products


@router.get("/products/search")
def search_product(
    name: str,
    account_id: str
):
    cleaned_name = clean_text(name)

    if not cleaned_name:
        raise HTTPException(
            status_code=400,
            detail="Product name is required"
        )

    product = db.products.find_one({
        "account_id": account_id,
        "is_active": {"$ne": False},
        "name": {
            "$regex": f"^{re.escape(cleaned_name)}$",
            "$options": "i"
        }
    })

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product["_id"] = str(product["_id"])

    return product


@router.delete("/products/{name}")
def delete_product(
    name: str,
    account_id: str
):
    """
    Soft-delete a product.

    The product disappears from the active stock list,
    but existing transaction history remains untouched.
    """

    cleaned_name = clean_text(name)

    if not cleaned_name:
        raise HTTPException(
            status_code=400,
            detail="Product name is required"
        )

    result = db.products.update_one(
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
            detail="Active product not found"
        )

    return {
        "message": "Product removed from active stock"
    }