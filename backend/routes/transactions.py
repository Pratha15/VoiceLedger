from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from models.transaction import Transaction
from database import db
from utils.resolver import find_customer, find_product
from bson import ObjectId


router = APIRouter()


# =========================================================
# CREATE TRANSACTION
# =========================================================

@router.post("/transactions")
def create_transaction(transaction: Transaction):

    customer = find_customer(
        transaction.account_id,
        transaction.customer
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail=f"Customer not found: {transaction.customer}"
        )

    transaction.customer = customer["name"]

    for item in transaction.items:

        product = find_product(
            transaction.account_id,
            item.product
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product not found: {item.product}"
            )

        item.product = product["name"]

    # -----------------------------------------------------
    # Amount validation
    # -----------------------------------------------------

    if transaction.total_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Total amount cannot be negative"
        )

    if transaction.paid_amount < 0:
        raise HTTPException(
            status_code=400,
            detail="Paid amount cannot be negative"
        )

    if transaction.paid_amount > transaction.total_amount:
        raise HTTPException(
            status_code=400,
            detail="Paid amount cannot be greater than total amount"
        )

    # -----------------------------------------------------
    # Payment status
    # -----------------------------------------------------

    pending_amount = (
        transaction.total_amount -
        transaction.paid_amount
    )

    if pending_amount == 0:
        payment_status = "paid"

    elif transaction.paid_amount == 0:
        payment_status = "credit"

    else:
        payment_status = "partial"

    # -----------------------------------------------------
    # Prepare database document
    # -----------------------------------------------------

    transaction_data = transaction.model_dump()

    transaction_data["pending_amount"] = pending_amount
    transaction_data["payment_status"] = payment_status

    result = db.transactions.insert_one(
        transaction_data
    )

    return {
        "message": "Transaction saved successfully!",
        "id": str(result.inserted_id),
        "transaction": {
            **transaction_data,
            "_id": str(result.inserted_id)
        }
    }


# =========================================================
# GET TRANSACTIONS
# =========================================================

def india_day_bounds(date_value: str | None):
    india = timezone(timedelta(hours=5, minutes=30))
    if date_value:
        start_local = datetime.strptime(date_value, "%Y-%m-%d").replace(tzinfo=india)
    else:
        start_local = datetime.now(india).replace(hour=0, minute=0, second=0, microsecond=0)
    end_local = start_local + timedelta(days=1)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


@router.get("/transactions")
def get_transactions(account_id: str, date: str | None = None, start_date: str | None = None, end_date: str | None = None):
    query = {"account_id": account_id}
    if date:
        start, end = india_day_bounds(date)
        query["created_at"] = {"$gte": start, "$lt": end}
    elif start_date or end_date:
        start = india_day_bounds(start_date)[0] if start_date else datetime.min.replace(tzinfo=timezone.utc)
        end = india_day_bounds(end_date)[1] if end_date else datetime.max.replace(tzinfo=timezone.utc)
        query["created_at"] = {"$gte": start, "$lt": end}

    transactions = list(
        db.transactions.find(query).sort("created_at", -1)
    )

    for transaction in transactions:
        transaction["_id"] = str(
            transaction["_id"]
        )

    return transactions


# =========================================================
# SUMMARY
# =========================================================

@router.get("/transactions/summary")
def get_summary(account_id: str):

    transactions = list(
        db.transactions.find({
            "account_id": account_id
        })
    )

    total_sales = sum(
        t.get("total_amount", 0)
        for t in transactions
    )

    total_collected = sum(
        t.get("paid_amount", 0)
        for t in transactions
    )

    total_pending = sum(
        t.get("pending_amount", 0)
        for t in transactions
    )

    return {
        "total_sales": total_sales,
        "total_collected": total_collected,
        "total_pending": total_pending,
        "transaction_count": len(transactions),
    }


# =========================================================
# CUSTOMER LEDGER
# =========================================================

@router.get("/customers/{customer_name}/ledger")
def get_customer_ledger(
    customer_name: str,
    account_id: str
):

    transactions = list(
        db.transactions.find({
            "account_id": account_id,
            "customer": customer_name
        })
    )

    for transaction in transactions:
        transaction["_id"] = str(
            transaction["_id"]
        )

    total_purchased = sum(
        t.get("total_amount", 0)
        for t in transactions
    )

    total_paid = sum(
        t.get("paid_amount", 0)
        for t in transactions
    )

    total_pending = sum(
        t.get("pending_amount", 0)
        for t in transactions
    )

    return {
        "customer": customer_name,
        "total_purchased": total_purchased,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "transactions": transactions
    }


# =========================================================
# MARK PAYMENT DONE
# =========================================================

@router.patch("/transactions/{transaction_id}/payment")
def mark_payment_done(
    transaction_id: str,
    account_id: str
):

    try:
        object_id = ObjectId(transaction_id)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid transaction ID"
        )

    transaction = db.transactions.find_one({
        "_id": object_id,
        "account_id": account_id
    })

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    db.transactions.update_one(
        {
            "_id": object_id,
            "account_id": account_id
        },
        {
            "$set": {
                "paid_amount": transaction["total_amount"],
                "pending_amount": 0,
                "payment_status": "paid"
            }
        }
    )

    return {
        "message": "Payment marked as completed!",
        "pending_amount": 0,
        "payment_status": "paid"
    }