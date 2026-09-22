from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone


class Item(BaseModel):

    product: str

    quantity: float = Field(gt=0)

    unit: Optional[str] = None


class Transaction(BaseModel):

    account_id: str

    customer: str

    items: List[Item]

    total_amount: float = Field(ge=0)

    paid_amount: float = Field(ge=0)

    payment_method: Optional[str] = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )