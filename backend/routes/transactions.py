from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from models.transaction import Transaction
from database import db
from utils.resolver import find_customer, find_product
from bson import ObjectId
import re


router = APIRouter()


# =========================================================
# HELPERS
# =========================================================

def clean_text(value: str) -> str:
    return " ".join((value or "").strip().split())


def india_day_bounds(date_value: str | None):
    """
    Convert an Indian calendar date into UTC boundaries.

    MongoDB stores timestamps in UTC, while the dashboard
    works with Indian calendar dates.
    """
    india = timezone(timedelta(hours=5, minutes=30))

    if date_value:
        start_local = datetime.strptime(
            date_value,
            "%Y-%m-%d"
        ).replace(tzinfo=india)
    else:
        start_local = datetime.now(india).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

    end_local = start_local + timedelta(days=1)

    return (
        start_local.astimezone(timezone.utc),
        end_local.astimezone(timezone.utc)
    )


def calculate_payment_status(total_amount: float, paid_amount: float):
    pending_amount = round(
        total_amount - paid_amount,
        2
    )

    if pending_amount == 0:
        payment_status = "paid"
    elif paid_amount == 0:
        payment_status = "credit"
    else:
        payment_status = "partial"

    return pending_amount, payment_status


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

    if not transaction.items:
        raise HTTPException(
            status_code=400,
            detail="At least one product is required"
        )

    for item in transaction.items:

        if not item.product:
            raise HTTPException(
                status_code=400,
                detail="Product name is required"
            )

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

        if item.quantity is None or item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quantity for product: {item.product}"
            )

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

    pending_amount, payment_status = calculate_payment_status(
        transaction.total_amount,
        transaction.paid_amount
    )

    # -----------------------------------------------------
    # Prepare database document
    # -----------------------------------------------------

    transaction_data = transaction.model_dump()

    now = datetime.now(timezone.utc)

    transaction_data["created_at"] = (
        transaction_data.get("created_at")
        or now
    )

    transaction_data["updated_at"] = now
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

@router.get("/transactions")
def get_transactions(
    account_id: str,
    date: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
):

    query = {
        "account_id": account_id
    }

    if date:

        start, end = india_day_bounds(date)

        query["created_at"] = {
            "$gte": start,
            "$lt": end
        }

    elif start_date or end_date:

        if start_date:
            start = india_day_bounds(start_date)[0]
        else:
            start = datetime.min.replace(
                tzinfo=timezone.utc
            )

        if end_date:
            end = india_day_bounds(end_date)[1]
        else:
            end = datetime.max.replace(
                tzinfo=timezone.utc
            )

        query["created_at"] = {
            "$gte": start,
            "$lt": end
        }

    transactions = list(
        db.transactions.find(query).sort(
            "created_at",
            -1
        )
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

    total_sales = round(
        sum(
            float(t.get("total_amount", 0) or 0)
            for t in transactions
        ),
        2
    )

    total_collected = round(
        sum(
            float(t.get("paid_amount", 0) or 0)
            for t in transactions
        ),
        2
    )

    total_pending = round(
        sum(
            float(t.get("pending_amount", 0) or 0)
            for t in transactions
        ),
        2
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

    cleaned_name = clean_text(customer_name)

    if not cleaned_name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required"
        )

    transactions = list(
        db.transactions.find({
            "account_id": account_id,
            "customer": {
                "$regex": f"^{re.escape(cleaned_name)}$",
                "$options": "i"
            }
        }).sort(
            "created_at",
            -1
        )
    )

    for transaction in transactions:
        transaction["_id"] = str(
            transaction["_id"]
        )

    total_purchased = round(
        sum(
            float(t.get("total_amount", 0) or 0)
            for t in transactions
        ),
        2
    )

    total_paid = round(
        sum(
            float(t.get("paid_amount", 0) or 0)
            for t in transactions
        ),
        2
    )

    total_pending = round(
        sum(
            float(t.get("pending_amount", 0) or 0)
            for t in transactions
        ),
        2
    )

    return {
        "customer": cleaned_name,
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

    pending_amount = float(
        transaction.get("pending_amount", 0) or 0
    )

    if pending_amount <= 0:
        raise HTTPException(
            status_code=409,
            detail="Transaction is already paid"
        )

    now = datetime.now(timezone.utc)

    result = db.transactions.update_one(
        {
            "_id": object_id,
            "account_id": account_id,
            "pending_amount": {"$gt": 0},
        },
        {
            "$set": {
                "paid_amount": transaction["total_amount"],
                "pending_amount": 0,
                "payment_status": "paid",
                "payment_method": "manual",
                "updated_at": now,
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=409,
            detail="Transaction was already updated"
        )

    return {
        "message": "Payment marked as completed!",
        "pending_amount": 0,
        "payment_status": "paid"
    }