from fastapi import APIRouter, HTTPException
from models.customer import Customer
from database import db

router = APIRouter()


@router.post("/customers")
def create_customer(customer: Customer):

    existing_customer = db.customers.find_one({
        "account_id": customer.account_id,
        "name": customer.name
    })

    if existing_customer:
        raise HTTPException(
            status_code=409,
            detail="Customer already exists"
        )

    customer_data = customer.model_dump()

    result = db.customers.insert_one(customer_data)

    return {
        "message": "Customer created successfully!",
        "id": str(result.inserted_id)
    }


@router.get("/customers")
def get_customers(account_id: str):

    customers = list(
        db.customers.find({
            "account_id": account_id
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

    customer = db.customers.find_one({
        "account_id": account_id,
        "$or": [
            {"name": name},
            {"aliases": name}
        ]
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    customer["_id"] = str(customer["_id"])

    return customer


@router.put("/customers/{name}/aliases")
def update_aliases(
    name: str,
    aliases: list[str],
    account_id: str
):

    result = db.customers.update_one(
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
            detail="Customer not found"
        )

    return {
        "message": "Aliases updated successfully!"
    }