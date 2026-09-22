from pydantic import BaseModel
from typing import Optional


class Customer(BaseModel):

    account_id: str

    name: str

    phone: Optional[str] = None

    is_active: bool = True