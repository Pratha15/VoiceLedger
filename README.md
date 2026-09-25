**DukaanSaathi
Aap bolo, hisaab hum sambhalenge. 🧾🎙️
**
**DukaanSaathi** is an AI-powered business companion designed for small shopkeepers.
It allows shopkeepers to manage their daily business using natural voice conversations instead of complicated forms and manual bookkeeping.

**🚀 Problem**
Small shopkeepers often manage:

- Customer credit and payments
- Daily sales
- Pending amounts
- Product inventory
- Purchases and stock
- Business records manually or through systems that require typing and technical knowledge.
This can be time-consuming, difficult to maintain, and especially challenging for users who are more comfortable speaking than typing.

**💡 Solution**

DukaanSaathi provides a **voice-first AI business assistant**.
A shopkeeper can simply speak naturally:

> "Ramesh ne 2 kilo rice liya, ₹120 baaki hai."
The system understands the conversation, identifies the relevant customer and product, validates the information, and updates the appropriate business record.

**Supported languages**

- 🇬🇧 English
- 🇮🇳 Hindi
- 🇮🇳 Marathi
- Mixed-language conversations
The system also understands natural corrections and follow-up conversations.

**✨ Key Features**

🎙️** Voice-First AI Assistant**
Talk naturally with the AI instead of filling complicated forms.

📒 **Digital Khata**
Manage:
- Customers
- Purchases
- Paid amounts
- Pending amounts
- Partial payments
- Payment status
- 
📦 **Inventory Management**
Track products and stock quantities through natural conversations.

💰** Payment Management**
Track pending payments and mark transactions as paid.

📊 **Business Insights**
View important business information such as:
- Total earnings
- Pending amounts
- Sales
- Profit-related information
- Transaction history
- 
🧠 **Context-Aware Conversations**
DukaanSaathi remembers the current conversation so users can naturally continue:
> "Amit ne 2 kilo rice liya."
> "Usne ₹100 de diye."
The system understands that "usne" refers to Amit.
> 
✏️ **Natural Corrections
**
Users can correct themselves naturally:
> "Customer Amit Kumar."
> "Nahi, Amit Verma."
The system updates the active conversation instead of creating unnecessary duplicate records.
> 
🌐** Language-Aware Display**
Customer and product names are displayed according to the selected application language while the original database records remain unchanged.

🛡️ **AI Safety & Validation**
AI does not directly modify the database.
The system follows:
> 
**User → AI understanding → Structured result → Validation → Business logic → Database**
This helps prevent incorrect AI-generated information from directly changing business records.

🏗️ **System Architecture**
                 ┌─────────────────────┐
                 │     Shopkeeper       │
                 │   Voice / Text       │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   React Frontend    │
                 │     + Vite          │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    FastAPI Backend  │
                 │   Business Logic    │
                 └──────────┬──────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
        ┌─────────────────┐   ┌─────────────────┐
        │   Gemini AI     │   │    MongoDB      │
        │ Understanding   │   │ Business Data   │
        └─────────────────┘   └─────────────────┘

🛠️ **Technology Stack**
**Frontend**
-React
-Vite
-JavaScript
-CSS
-Web Speech API

**Backend**
-Python
-FastAPI
-Uvicorn

**Database**
-MongoDB

**AI**
-Gemini API

**Authentication**
-Account-based authentication
-Password hashing
-MongoDB-backed user accounts

📁 **Project Structure**
VoiceLedger/
│
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── requirements.txt
│
├── .gitignore
└── README.md

🔐** Security**

Sensitive credentials and API keys are stored in environment variables and are not included in the repository.
The application also validates AI-generated structured information before performing database operations.

🌱** Future Scope**

DukaanSaathi can be extended with:

-WhatsApp-based business management
-Cloud deployment
-Advanced sales analytics
-Automated daily/weekly business reports
-GST and invoice support
-Voice-based invoice generation
-Multi-shop management
-Mobile application
-More Indian regional languages
-Advanced demand and inventory prediction

🎯 **Why DukaanSaathi?**

DukaanSaathi focuses on making digital business management accessible to small shopkeepers without forcing them to learn complex software.
Instead of asking:

"How do I use this software?"
the experience is designed around:
"Just tell your business what happened."

**Vision**

Make business management as simple as having a conversation.
**DukaanSaathi — Aap bolo, hisaab hum sambhalenge.**
