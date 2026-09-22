from pydantic import BaseModel
from typing import List, Optional


class Product(BaseModel):
    account_id: str
    name: str
    price: float
    stock: Optional[float] = 0
    unit: Optional[str] = None
    aliases: List[str] = []