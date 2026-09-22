from pydantic import BaseModel, Field
from typing import Optional


class AccountCreate(BaseModel):
    shopkeeper_name: str = Field(min_length=1)
    mobile: str = Field(min_length=10, max_length=10)
    password: str = Field(min_length=8)
    shop_name: str = Field(min_length=1)
    shop_type: str = Field(min_length=1)
    language: str = "en"


class AccountLogin(BaseModel):
    mobile: str = Field(min_length=10, max_length=10)
    password: str


class AccountUpdate(BaseModel):
    shop_name: Optional[str] = None
    shop_type: Optional[str] = None
    address: Optional[str] = None
    language: Optional[str] = None


class AccountResponse(BaseModel):
    id: str
    shopkeeperName: str
    mobile: str
    shopName: str
    shopType: str
    language: str
    address: Optional[str] = None
