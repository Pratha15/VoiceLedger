from pydantic import BaseModel
from typing import Optional


class Product(BaseModel):

    account_id: str

    name: str

    price: float = 0

    stock: Optional[float] = 0

    unit: Optional[str] = None

    is_active: bool = True