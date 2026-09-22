from pydantic import BaseModel
from typing import List, Optional


class Customer(BaseModel):
    account_id: str
    name: str
    phone: Optional[str] = None
    aliases: List[str] = []