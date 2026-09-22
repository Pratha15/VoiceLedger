from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db
from routes.transactions import router as transaction_router
from routes.customers import router as customer_router
from routes.products import router as product_router
from routes.ai import router as ai_router
from routes.conversation import router as conversation_router
from routes.accounts import router as account_router
from routes.chats import router as chat_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transaction_router)
app.include_router(customer_router)
app.include_router(product_router)
app.include_router(ai_router)
app.include_router(conversation_router)
app.include_router(account_router)
app.include_router(chat_router)
@app.get("/")
def home():
    return {"message": "VoiceLedger Backend is Running!"}


@app.get("/db-test")
def db_test():
    db.test.insert_one({"message": "MongoDB connected!"})
    return {"message": "MongoDB connected successfully!"}