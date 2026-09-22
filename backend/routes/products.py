from fastapi import APIRouter, HTTPException
from models.product import Product
from database import db

router = APIRouter()


@router.post("/products")
def create_product(product: Product):

    existing_product = db.products.find_one({
        "account_id": product.account_id,
        "name": product.name
    })

    if existing_product:
        raise HTTPException(
            status_code=409,
            detail="Product already exists"
        )

    product_data = product.model_dump()

    result = db.products.insert_one(product_data)

    return {
        "message": "Product created successfully!",
        "id": str(result.inserted_id)
    }


@router.get("/products")
def get_products(account_id: str):

    products = list(
        db.products.find({
            "account_id": account_id
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

    product = db.products.find_one({
        "account_id": account_id,
        "$or": [
            {"name": name},
            {"aliases": name}
        ]
    })

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product["_id"] = str(product["_id"])

    return product


@router.put("/products/{name}/aliases")
def update_aliases(
    name: str,
    aliases: list[str],
    account_id: str
):

    result = db.products.update_one(
        {
            "account_id": account_id,
            "name": name
        },
        {
            "$set": {
                "aliases": aliases
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": "Aliases updated successfully!"
    }