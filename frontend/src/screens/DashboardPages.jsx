import { useEffect, useRef, useState } from "react";
import {
  displayCustomerName as localizedCustomerName,
  displayProductName as localizedProductName,
} from "../utils/displayNames.js";
import "./DashboardPages.css";

const API = "http://127.0.0.1:8000";

/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
  hi: {
    khata: "खाता",
    khataSub: "आपका पूरा ग्राहक खाता",
    searchCustomer: "ग्राहक खोजें...",
    noTransactions: "अभी कोई लेन-देन नहीं है",
    transactionsAppear: "आपके दर्ज किए गए लेन-देन यहाँ दिखाई देंगे।",
    paid: "भुगतान",
    credit: "उधार",
    partial: "आंशिक",
    pending: "बाकी",
    sales: "बिक्री",
    collected: "वसूली",
    today: "आज",
    yesterday: "कल",
    thisWeek: "इस सप्ताह",
    thisMonth: "इस महीने",
    all: "सभी",

    customers: "ग्राहक",
    customersSub: "अपने ग्राहकों और उनकी जानकारी को संभालें",
    searchCustomers: "ग्राहक खोजें...",
    cancel: "रद्द करें",
    addCustomer: "+ ग्राहक जोड़ें",
    addCustomerTitle: "ग्राहक जोड़ें",
    customerName: "ग्राहक का नाम",
    customerNamePlaceholder: "जैसे रमेश कुमार",
    phone: "फ़ोन नंबर",
    optional: "वैकल्पिक",
    adding: "जोड़ा जा रहा है...",
    customerAdded: "ग्राहक सफलतापूर्वक जोड़ दिया गया!",
    enterCustomerName: "कृपया ग्राहक का नाम दर्ज करें।",
    unableAddCustomer: "ग्राहक जोड़ने में असमर्थ।",
    backendError: "बैकएंड से कनेक्ट नहीं हो सका।",
    noCustomers: "कोई ग्राहक नहीं मिला",
    addFirstCustomer:
      "अपना पहला ग्राहक जोड़ें और उनका खाता संभालना शुरू करें।",
    view: "देखें →",
    deleteCustomer: "ग्राहक हटाएँ",
    deleteConfirm: "ग्राहक हटाएँ?",
    deletePending:
      "इस ग्राहक पर ₹{amount} बाकी है। क्या आप इसे हटाना चाहते हैं?",
    customerDeleted: "ग्राहक को सक्रिय सूची से हटा दिया गया।",

    customerLedger: "ग्राहक खाता",
    loading: "लोड हो रहा है...",
    totalPurchased: "कुल खरीद",
    totalPaid: "कुल भुगतान",
    noCustomerTransactions: "कोई लेन-देन नहीं",
    noCustomerTransactionsSub:
      "इस ग्राहक का कोई लेन-देन दर्ज नहीं है।",

    stock: "स्टॉक",
    stockSub: "अपने सामान और इन्वेंटरी को संभालें",
    searchProducts: "सामान खोजें...",
    addProduct: "+ सामान जोड़ें",
    addProductTitle: "सामान जोड़ें",
    productName: "सामान का नाम",
    productPlaceholder: "जैसे चावल",
    price: "कीमत",
    pricePlaceholder: "जैसे 60",
    stockLabel: "स्टॉक",
    stockPlaceholder: "जैसे 50",
    unit: "इकाई",
    unitPlaceholder: "किलो / लीटर / पीस",
    productAdded: "सामान सफलतापूर्वक जोड़ दिया गया!",
    enterProductName: "कृपया सामान का नाम दर्ज करें।",
    enterProductPrice: "कृपया सामान की कीमत दर्ज करें।",
    addingProduct: "जोड़ा जा रहा है...",
    unableAddProduct: "सामान जोड़ने में असमर्थ।",
    noProducts: "कोई सामान नहीं मिला",
    addProductsInventory:
      "अपनी इन्वेंटरी संभालना शुरू करने के लिए सामान जोड़ें।",
    deleteProduct: "सामान हटाएँ",
    deleteProductConfirm: "सामान हटाएँ?",
    deleteProductMessage:
      "क्या आप {name} को सक्रिय स्टॉक से हटाना चाहते हैं?",
    productDeleted: "सामान सक्रिय स्टॉक से हटा दिया गया।",
    confirm: "पुष्टि करें",

    paidConfirm: "₹{amount} को भुगतान किया हुआ चिह्नित करें?",
    paymentUpdated: "भुगतान अपडेट हो गया।",

    calendar: "कैलेंडर",
    calendarSub: "तारीख के अनुसार लेन-देन देखें",
    selectDate: "तारीख चुनें",
    noTransactionsDate: "इस तारीख को कोई लेन-देन नहीं है",
    transactionsDateSub:
      "चुनी गई तारीख के लेन-देन यहाँ दिखाई देंगे।",

    more: "अधिक",
    moreSub: "अपने खाते और दुकान को संभालें",
    shopkeeper: "दुकानदार",
    myShop: "मेरी दुकान",
    myProfile: "मेरी प्रोफ़ाइल",
    myProfileSub: "अपनी व्यक्तिगत जानकारी संभालें",
    shopDetails: "दुकान की जानकारी",
    shopDetailsSub: "अपनी दुकान की जानकारी संभालें",
    reports: "रिपोर्ट",
    reportsSub: "अपने व्यापार की रिपोर्ट देखें",
    settings: "सेटिंग्स",
    settingsSub: "ऐप की प्राथमिकताएँ संभालें",
    language: "भाषा",
    languageSub: "हिंदी · मराठी · English",
    logout: "लॉगआउट",
    logoutSub: "DukaanSaathi से बाहर निकलें",

    profileTitle: "मेरी प्रोफ़ाइल",
    profileSub: "आपकी DukaanSaathi प्रोफ़ाइल",
    name: "नाम",
    mobile: "मोबाइल",

    shopTitle: "दुकान की जानकारी",
    shopSub: "आपकी दुकान की जानकारी",
    shopName: "दुकान का नाम",
    shopType: "दुकान का प्रकार",
    generalStore: "जनरल स्टोर",

    reportsTitle: "रिपोर्ट",
    reportsSub: "व्यापार प्रदर्शन रिपोर्ट",
    reportsComing:
      "आपकी व्यापार रिपोर्ट यहाँ वास्तविक लेन-देन के डेटा से जुड़ेंगी।",
    viewHistory: "लेन-देन इतिहास देखें",

    settingsTitle: "सेटिंग्स",
    settingsSub: "अपनी प्राथमिकताएँ संभालें",
    currentLanguage: "वर्तमान भाषा",

    languageTitle: "भाषा",
    languageChooseSub: "अपनी पसंदीदा भाषा चुनें",

    back: "वापस",
    productStock: "स्टॉक",
  },

  mr: {
    khata: "खाते",
    khataSub: "तुमचे संपूर्ण ग्राहक खाते",
    searchCustomer: "ग्राहक शोधा...",
    noTransactions: "अजून कोणतेही व्यवहार नाहीत",
    transactionsAppear: "तुमचे नोंदवलेले व्यवहार येथे दिसतील.",
    paid: "भरले",
    credit: "उधार",
    partial: "अंशतः",
    pending: "बाकी",
    sales: "विक्री",
    collected: "वसूल",
    today: "आज",
    yesterday: "काल",
    thisWeek: "या आठवड्यात",
    thisMonth: "या महिन्यात",
    all: "सर्व",

    customers: "ग्राहक",
    customersSub: "तुमचे ग्राहक आणि त्यांची माहिती सांभाळा",
    searchCustomers: "ग्राहक शोधा...",
    cancel: "रद्द करा",
    addCustomer: "+ ग्राहक जोडा",
    addCustomerTitle: "ग्राहक जोडा",
    customerName: "ग्राहकाचे नाव",
    customerNamePlaceholder: "उदा. रमेश कुमार",
    phone: "फोन नंबर",
    optional: "पर्यायी",
    adding: "जोडत आहे...",
    customerAdded: "ग्राहक यशस्वीरित्या जोडला!",
    enterCustomerName: "कृपया ग्राहकाचे नाव टाका.",
    unableAddCustomer: "ग्राहक जोडता आला नाही.",
    backendError: "बॅकएंडशी कनेक्ट करता आले नाही.",
    noCustomers: "ग्राहक सापडले नाहीत",
    addFirstCustomer:
      "तुमचा पहिला ग्राहक जोडा आणि त्यांचे खाते सांभाळायला सुरुवात करा.",
    view: "पहा →",
    deleteCustomer: "ग्राहक हटवा",
    deleteConfirm: "ग्राहक हटवायचा?",
    deletePending:
      "या ग्राहकाकडे ₹{amount} बाकी आहे. हटवायचे का?",
    customerDeleted: "ग्राहक सक्रिय यादीतून काढला आहे.",

    customerLedger: "ग्राहक खाते",
    loading: "लोड होत आहे...",
    totalPurchased: "एकूण खरेदी",
    totalPaid: "एकूण भरले",
    noCustomerTransactions: "कोणतेही व्यवहार नाहीत",
    noCustomerTransactionsSub:
      "या ग्राहकाचे कोणतेही व्यवहार नोंदवलेले नाहीत.",

    stock: "स्टॉक",
    stockSub: "तुमचे सामान आणि इन्व्हेंटरी सांभाळा",
    searchProducts: "सामान शोधा...",
    addProduct: "+ सामान जोडा",
    addProductTitle: "सामान जोडा",
    productName: "सामानाचे नाव",
    productPlaceholder: "उदा. तांदूळ",
    price: "किंमत",
    pricePlaceholder: "उदा. 60",
    stockLabel: "स्टॉक",
    stockPlaceholder: "उदा. 50",
    unit: "एकक",
    unitPlaceholder: "किलो / लिटर / नग",
    productAdded: "सामान यशस्वीरित्या जोडले!",
    enterProductName: "कृपया सामानाचे नाव टाका.",
    enterProductPrice: "कृपया सामानाची किंमत टाका.",
    addingProduct: "जोडत आहे...",
    unableAddProduct: "सामान जोडता आले नाही.",
    noProducts: "सामान सापडले नाही",
    addProductsInventory:
      "तुमची इन्व्हेंटरी सांभाळण्यासाठी सामान जोडा.",
    deleteProduct: "सामान हटवा",
    deleteProductConfirm: "सामान हटवायचे?",
    deleteProductMessage:
      "{name} सक्रिय स्टॉकमधून हटवायचे आहे का?",
    productDeleted: "सामान सक्रिय स्टॉकमधून काढले आहे.",
    confirm: "पुष्टी करा",

    paidConfirm: "₹{amount} भरले म्हणून चिन्हांकित करायचे?",
    paymentUpdated: "पेमेंट अपडेट झाले.",

    calendar: "कॅलेंडर",
    calendarSub: "तारखेनुसार व्यवहार पहा",
    selectDate: "तारीख निवडा",
    noTransactionsDate: "या तारखेला कोणतेही व्यवहार नाहीत",
    transactionsDateSub:
      "निवडलेल्या तारखेचे व्यवहार येथे दिसतील.",

    more: "अधिक",
    moreSub: "तुमचे खाते आणि दुकान सांभाळा",
    shopkeeper: "दुकानदार",
    myShop: "माझे दुकान",
    myProfile: "माझी प्रोफाइल",
    myProfileSub: "तुमची वैयक्तिक माहिती सांभाळा",
    shopDetails: "दुकानाची माहिती",
    shopDetailsSub: "तुमच्या दुकानाची माहिती सांभाळा",
    reports: "रिपोर्ट",
    reportsSub: "तुमचे व्यवसाय रिपोर्ट पहा",
    settings: "सेटिंग्स",
    settingsSub: "अॅपच्या प्राधान्यक्रमांचे व्यवस्थापन करा",
    language: "भाषा",
    languageSub: "हिंदी · मराठी · English",
    logout: "लॉगआउट",
    logoutSub: "DukaanSaathi मधून बाहेर पडा",

    profileTitle: "माझी प्रोफाइल",
    profileSub: "तुमची DukaanSaathi प्रोफाइल",
    name: "नाव",
    mobile: "मोबाइल",

    shopTitle: "दुकानाची माहिती",
    shopSub: "तुमच्या दुकानाची माहिती",
    shopName: "दुकानाचे नाव",
    shopType: "दुकानाचा प्रकार",
    generalStore: "जनरल स्टोअर",

    reportsTitle: "रिपोर्ट",
    reportsSub: "व्यवसाय कामगिरी रिपोर्ट",
    reportsComing:
      "तुमचे व्यवसाय रिपोर्ट येथे वास्तविक व्यवहारांच्या डेटाशी जोडले जातील.",
    viewHistory: "व्यवहार इतिहास पहा",

    settingsTitle: "सेटिंग्स",
    settingsSub: "तुमची प्राधान्ये सांभाळा",
    currentLanguage: "सध्याची भाषा",

    languageTitle: "भाषा",
    languageChooseSub: "तुमची पसंतीची भाषा निवडा",

    back: "मागे",
    productStock: "स्टॉक",
  },

  en: {
    khata: "Khata",
    khataSub: "Your complete customer ledger",
    searchCustomer: "Search customer...",
    noTransactions: "No transactions yet",
    transactionsAppear: "Your recorded transactions will appear here.",
    paid: "Paid",
    credit: "Credit",
    partial: "Partial",
    pending: "Pending",
    sales: "Sales",
    collected: "Collected",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    all: "All",

    customers: "Customers",
    customersSub: "Manage your customers and their details",
    searchCustomers: "Search customers...",
    cancel: "Cancel",
    addCustomer: "+ Add Customer",
    addCustomerTitle: "Add Customer",
    customerName: "Customer Name",
    customerNamePlaceholder: "e.g. Ramesh Kumar",
    phone: "Phone Number",
    optional: "Optional",
    adding: "Adding...",
    customerAdded: "Customer added successfully!",
    enterCustomerName: "Please enter customer name.",
    unableAddCustomer: "Unable to add customer.",
    backendError: "Unable to connect to backend.",
    noCustomers: "No customers found",
    addFirstCustomer:
      "Add your first customer to start managing their khata.",
    view: "View →",
    deleteCustomer: "Delete Customer",
    deleteConfirm: "Delete this customer?",
    deletePending:
      "This customer has ₹{amount} pending. Are you sure you want to delete this customer?",
    customerDeleted: "Customer removed from the active list.",

    customerLedger: "Customer ledger",
    loading: "Loading...",
    totalPurchased: "Total Purchased",
    totalPaid: "Total Paid",
    noCustomerTransactions: "No transactions",
    noCustomerTransactionsSub:
      "This customer has no recorded transactions.",

    stock: "Stock",
    stockSub: "Manage your products and inventory",
    searchProducts: "Search products...",
    addProduct: "+ Add Product",
    addProductTitle: "Add Product",
    productName: "Product Name",
    productPlaceholder: "e.g. Rice",
    price: "Price",
    pricePlaceholder: "e.g. 60",
    stockLabel: "Stock",
    stockPlaceholder: "e.g. 50",
    unit: "Unit",
    unitPlaceholder: "kg / litre / piece",
    productAdded: "Product added successfully!",
    enterProductName: "Please enter product name.",
    enterProductPrice: "Please enter product price.",
    addingProduct: "Adding...",
    unableAddProduct: "Unable to add product.",
    noProducts: "No products found",
    addProductsInventory:
      "Add products to start managing your inventory.",
    deleteProduct: "Delete Product",
    deleteProductConfirm: "Delete this product?",
    deleteProductMessage:
      "Do you want to remove {name} from your active stock?",
    productDeleted: "Product removed from active stock.",
    confirm: "Confirm",

    paidConfirm: "Mark ₹{amount} as paid?",
    paymentUpdated: "Payment updated.",

    calendar: "Calendar",
    calendarSub: "View transactions by date",
    selectDate: "Select Date",
    noTransactionsDate: "No transactions on this date",
    transactionsDateSub:
      "Transactions recorded for the selected date will appear here.",

    more: "More",
    moreSub: "Manage your account and shop",
    shopkeeper: "Shopkeeper",
    myShop: "My Shop",
    myProfile: "My Profile",
    myProfileSub: "Manage your personal details",
    shopDetails: "Shop Details",
    shopDetailsSub: "Manage your shop information",
    reports: "Reports",
    reportsSub: "View your business reports",
    settings: "Settings",
    settingsSub: "Manage app preferences",
    language: "Language",
    languageSub: "Hindi · Marathi · English",
    logout: "Logout",
    logoutSub: "Sign out of DukaanSaathi",

    profileTitle: "My Profile",
    profileSub: "Your DukaanSaathi profile",
    name: "Name",
    mobile: "Mobile",

    shopTitle: "Shop Details",
    shopSub: "Your shop information",
    shopName: "Shop Name",
    shopType: "Shop Type",
    generalStore: "General Store",

    reportsTitle: "Reports",
    reportsSub: "Business performance reports",
    reportsComing:
      "Your business reports will be connected to real transaction data here.",
    viewHistory: "View Transaction History",

    settingsTitle: "Settings",
    settingsSub: "Manage your preferences",
    currentLanguage: "Current Language",

    languageTitle: "Language",
    languageChooseSub: "Choose your preferred language",

    back: "Back",
    productStock: "Stock",
  },
};

function getTranslations(language) {
  const selected = language === "auto" ? "en" : language;
  return translations[selected] || translations.en;
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function getIndiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function addDaysToDateString(dateString, amount) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
}

function getWeekStart(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  const dayOfWeek = date.getUTCDay();

  return addDaysToDateString(
    dateString,
    -dayOfWeek
  );
}

function getWeekEnd(dateString) {
  return addDaysToDateString(
    getWeekStart(dateString),
    6
  );
}

function getMonthStart(dateString) {
  return `${dateString.slice(0, 7)}-01`;
}

function getMonthEnd(dateString) {
  const [year, month] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month, 0)
  );

  return date.toISOString().slice(0, 10);
}

function getDateQuery(dateFilter, selectedDate) {
  if (dateFilter === "all") {
    return "";
  }

  if (dateFilter === "today") {
    return `date=${selectedDate}`;
  }

  if (dateFilter === "yesterday") {
    const yesterday = addDaysToDateString(
      selectedDate,
      -1
    );

    return `date=${yesterday}`;
  }

  if (dateFilter === "week") {
    return `start_date=${getWeekStart(
      selectedDate
    )}&end_date=${getWeekEnd(selectedDate)}`;
  }

  if (dateFilter === "month") {
    return `start_date=${getMonthStart(
      selectedDate
    )}&end_date=${getMonthEnd(selectedDate)}`;
  }

  return "";
}

function getLocalizedProductName(name, language) {
  return localizedProductName(
    name,
    language
  );
}

function getLocalizedCustomerName(name, language) {
  return localizedCustomerName(
    name,
    language
  );
}

function matchesSearch(value, search) {
  return String(value || "")
    .toLowerCase()
    .includes(search.toLowerCase());
}

/* =========================================================
   CONFIRMATION MODAL
========================================================= */

function ConfirmationModal({
  title,
  message,
  cancelLabel,
  confirmLabel,
  busy,
  error,
  onCancel,
  onConfirm,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [busy, onCancel]);

  return (
    <div
      className="action-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
      >
        <button
          type="button"
          className="action-modal-close"
          onClick={onCancel}
          disabled={busy}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="action-modal-title">
          {title}
        </h2>

        <p>{message}</p>

        {error && (
          <p className="action-modal-error">
            {error}
          </p>
        )}

        <div className="action-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            ref={confirmRef}
            className="action-modal-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  title,
  subtitle,
  onBack,
}) {
  return (
    <div className="page-header">
      <button
        type="button"
        className="back-btn"
        onClick={onBack}
      >
        ←
      </button>

      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

/* =========================================================
   KHATA
========================================================= */

function KhataPage({
  onBack,
  user,
  language,
}) {
  const t = getTranslations(language);

  const [transactions, setTransactions] =
    useState([]);

  const [paymentTarget, setPaymentTarget] =
    useState(null);

  const [paymentBusy, setPaymentBusy] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [search, setSearch] = useState("");

  const [dateFilter, setDateFilter] =
    useState("today");

  const [selectedDate, setSelectedDate] =
    useState(getIndiaDate());

  const loadTransactions = async () => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }

    try {
      const query = getDateQuery(
        dateFilter,
        selectedDate
      );

      const response = await fetch(
        `${API}/transactions?account_id=${user.id}${
          query ? `&${query}` : ""
        }`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (error) {
      console.error(
        "Transactions error:",
        error
      );
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [
    user?.id,
    dateFilter,
    selectedDate,
  ]);

  const visibleTransactions =
    transactions.filter((transaction) =>
      matchesSearch(
        getLocalizedCustomerName(
          transaction.customer,
          language
        ),
        search
      ) ||
      matchesSearch(
        transaction.customer,
        search
      )
    );

  const dailySales =
    visibleTransactions.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.total_amount || 0
        ),
      0
    );

  const dailyCollected =
    visibleTransactions.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.paid_amount || 0
        ),
      0
    );

  const dailyPending =
    visibleTransactions.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.pending_amount || 0
        ),
      0
    );

  const markAsPaid = async (transaction) => {
    if (!user?.id) return;

    setPaymentBusy(true);
    setPaymentError("");

    try {
      const response = await fetch(
        `${API}/transactions/${transaction._id}/payment?account_id=${user.id}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPaymentError(
          data.detail ||
            t.unableAddCustomer
        );
        setPaymentBusy(false);
        return;
      }

      await loadTransactions();

      window.dispatchEvent(
        new Event("transaction-updated")
      );

      setPaymentTarget(null);
    } catch (error) {
      console.error(error);

      setPaymentError(
        t.backendError
      );
    } finally {
      setPaymentBusy(false);
    }
  };

  const filterLabels = {
    today: t.today,
    yesterday: t.yesterday,
    week: t.thisWeek,
    month: t.thisMonth,
    all: t.all,
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t.khata}
        subtitle={t.khataSub}
        onBack={onBack}
      />

      <div className="page-search">
        <input
          type="text"
          placeholder={t.searchCustomer}
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </div>

      <div className="khata-filters">
        {[
          "today",
          "yesterday",
          "week",
          "month",
          "all",
        ].map((filter) => (
          <button
            type="button"
            key={filter}
            className={
              dateFilter === filter
                ? "active"
                : ""
            }
            onClick={() =>
              setDateFilter(filter)
            }
          >
            {filterLabels[filter]}
          </button>
        ))}

        <input
          type="date"
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(
              event.target.value
            );
            setDateFilter("today");
          }}
          aria-label={t.selectDate}
        />
      </div>

      <div className="ledger-summary khata-summary">
        <div>
          <span>{t.sales}</span>
          <strong>
            ₹{formatCurrency(dailySales)}
          </strong>
        </div>

        <div>
          <span>{t.collected}</span>
          <strong>
            ₹{formatCurrency(dailyCollected)}
          </strong>
        </div>

        <div>
          <span>{t.pending}</span>
          <strong className="pending-balance">
            ₹{formatCurrency(dailyPending)}
          </strong>
        </div>
      </div>

      <div className="page-list">
        {visibleTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              📖
            </div>

            <h3>{t.noTransactions}</h3>

            <p>
              {t.transactionsAppear}
            </p>
          </div>
        ) : (
          visibleTransactions.map(
            (transaction) => (
              <div
                className="transaction-card"
                key={transaction._id}
              >
                <div className="transaction-top">
                  <div>
                    <h3>
                      {getLocalizedCustomerName(
                        transaction.customer,
                        language
                      )}
                    </h3>

                    <p>
                      {transaction.items?.map(
                        (item, index) => (
                          <span key={index}>
                            {item.quantity}{" "}
                            {item.unit || ""}{" "}
                            {getLocalizedProductName(
                              item.product,
                              language
                            )}
                            {index <
                            transaction.items
                              .length -
                              1
                              ? ", "
                              : ""}
                          </span>
                        )
                      )}
                    </p>
                  </div>

                  <strong>
                    ₹
                    {formatCurrency(
                      transaction.total_amount
                    )}
                  </strong>
                </div>

                <div className="transaction-bottom">
                  <span>
                    {t.paid}: ₹
                    {formatCurrency(
                      transaction.paid_amount
                    )}
                  </span>

                  <span
                    className={`status ${
                      transaction.payment_status ||
                      "pending"
                    }`}
                  >
                    {transaction.payment_status ===
                    "paid"
                      ? t.paid
                      : transaction.payment_status ===
                        "credit"
                      ? t.credit
                      : transaction.payment_status ===
                        "partial"
                      ? t.partial
                      : t.pending}
                  </span>

                  {Number(
                    transaction.pending_amount || 0
                  ) > 0 && (
                    <button
                      type="button"
                      className="small-action"
                      onClick={() => {
                        setPaymentError("");
                        setPaymentTarget(
                          transaction
                        );
                      }}
                    >
                      {t.markAsPaid}
                    </button>
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>

      {paymentTarget && (
        <ConfirmationModal
          title={t.markAsPaid}
          message={t.paidConfirm.replace(
            "{amount}",
            formatCurrency(
              paymentTarget.pending_amount
            )
          )}
          cancelLabel={t.cancel}
          confirmLabel={t.markAsPaid}
          busy={paymentBusy}
          error={paymentError}
          onCancel={() => {
            if (!paymentBusy) {
              setPaymentTarget(null);
              setPaymentError("");
            }
          }}
          onConfirm={() =>
            markAsPaid(paymentTarget)
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   CUSTOMERS
========================================================= */

function CustomersPage({
  onBack,
  onPageChange,
  user,
  language,
}) {
  const t = getTranslations(language);

  const [customers, setCustomers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [formData, setFormData] =
    useState({
      name: "",
      phone: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const loadCustomers = async () => {
    if (!user?.id) {
      setCustomers([]);
      return;
    }

    try {
      const response = await fetch(
        `${API}/customers?account_id=${user.id}`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (error) {
      console.error(
        "Customers error:",
        error
      );
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [user?.id]);

  const addCustomer = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setMessage(
        t.enterCustomerName
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/customers`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            account_id: user.id,
            name: formData.name.trim(),
            phone:
              formData.phone.trim() ||
              null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            t.unableAddCustomer
        );
        return;
      }

      setFormData({
        name: "",
        phone: "",
      });

      setShowForm(false);
      setMessage(
        t.customerAdded
      );

      await loadCustomers();
    } catch (error) {
      console.error(error);
      setMessage(t.backendError);
    } finally {
      setLoading(false);
    }
  };

  const visibleCustomers =
    customers.filter((customer) => {
      const localizedName =
        getLocalizedCustomerName(
          customer.name,
          language
        );

      return (
        matchesSearch(
          customer.name,
          search
        ) ||
        matchesSearch(
          localizedName,
          search
        ) ||
        matchesSearch(
          customer.phone,
          search
        )
      );
    });

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t.customers}
        subtitle={t.customersSub}
        onBack={onBack}
      />

      <div className="page-actions">
        <div className="page-search">
          <input
            type="text"
            placeholder={
              t.searchCustomers
            }
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={() => {
            setShowForm(!showForm);
            setMessage("");
          }}
        >
          {showForm
            ? t.cancel
            : t.addCustomer}
        </button>
      </div>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

      {showForm && (
        <form
          className="dashboard-form"
          onSubmit={addCustomer}
        >
          <h2>
            {t.addCustomerTitle}
          </h2>

          <label>
            {t.customerName}
          </label>

          <input
            type="text"
            placeholder={
              t.customerNamePlaceholder
            }
            value={formData.name}
            onChange={(event) =>
              setFormData({
                ...formData,
                name: event.target.value,
              })
            }
          />

          <label>{t.phone}</label>

          <input
            type="text"
            placeholder={t.optional}
            value={formData.phone}
            onChange={(event) =>
              setFormData({
                ...formData,
                phone:
                  event.target.value,
              })
            }
          />

          <button
            type="submit"
            className="primary-action form-submit"
            disabled={loading}
          >
            {loading
              ? t.adding
              : t.addCustomer}
          </button>
        </form>
      )}

      <div className="page-list">
        {visibleCustomers.length ===
        0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              👥
            </div>

            <h3>
              {t.noCustomers}
            </h3>

            <p>
              {t.addFirstCustomer}
            </p>
          </div>
        ) : (
          visibleCustomers.map(
            (customer) => (
              <div
                className="customer-card"
                key={customer._id}
              >
                <div className="customer-avatar">
                  {customer.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "C"}
                </div>

                <div className="customer-info">
                  <h3>
                    {getLocalizedCustomerName(
                      customer.name,
                      language
                    )}
                  </h3>

                  {customer.phone && (
                    <p>
                      📞{" "}
                      {customer.phone}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="small-action"
                  onClick={() =>
                    onPageChange(
                      `customer:${customer.name}`
                    )
                  }
                >
                  {t.view}
                </button>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMER DETAIL
========================================================= */

function CustomerDetailPage({
  customerName,
  onBack,
  onPageChange,
  user,
  language,
}) {
  const t = getTranslations(language);

  const [ledger, setLedger] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [modal, setModal] =
    useState(null);

  const [actionBusy, setActionBusy] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const loadLedger = async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/customers/${encodeURIComponent(
          customerName
        )}/ledger?account_id=${user.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        setLedger(null);
        return;
      }

      setLedger(data);
    } catch (error) {
      console.error(
        "Customer ledger error:",
        error
      );

      setLedger(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLedger(null);
      setLoading(false);
      return;
    }

    loadLedger();
  }, [
    customerName,
    user?.id,
  ]);

  const openDeleteModal = () => {
    const pending =
      Number(
        ledger?.total_pending || 0
      );

    setActionError("");

    setModal({
      type: "delete-customer",
      title: t.deleteCustomer,
      message:
        pending > 0
          ? t.deletePending.replace(
              "{amount}",
              formatCurrency(pending)
            )
          : t.deleteConfirm,
    });
  };

  const openPaymentModal = (
    transaction
  ) => {
    setActionError("");

    setModal({
      type: "payment",
      transaction,
      title: t.markAsPaid,
      message:
        t.paidConfirm.replace(
          "{amount}",
          formatCurrency(
            transaction.pending_amount
          )
        ),
    });
  };

  const closeModal = () => {
    if (actionBusy) return;

    setModal(null);
    setActionError("");
  };

  const confirmDeleteCustomer =
    async () => {
      if (!user?.id) return;

      setActionBusy(true);
      setActionError("");

      try {
        const response =
          await fetch(
            `${API}/customers/${encodeURIComponent(
              customerName
            )}?account_id=${user.id}`,
            {
              method: "DELETE",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setActionError(
            data.detail ||
              t.unableAddCustomer
          );
          return;
        }

        setModal(null);

        window.dispatchEvent(
          new Event("customer-updated")
        );

        onPageChange("customers");
      } catch (error) {
        console.error(error);

        setActionError(
          t.backendError
        );
      } finally {
        setActionBusy(false);
      }
    };

  const confirmPayment =
    async () => {
      if (
        !user?.id ||
        !modal?.transaction
      ) {
        return;
      }

      setActionBusy(true);
      setActionError("");

      try {
        const response =
          await fetch(
            `${API}/transactions/${modal.transaction._id}/payment?account_id=${user.id}`,
            {
              method: "PATCH",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          setActionError(
            data.detail ||
              t.backendError
          );
          return;
        }

        setModal(null);

        await loadLedger();

        window.dispatchEvent(
          new Event("transaction-updated")
        );
      } catch (error) {
        console.error(error);

        setActionError(
          t.backendError
        );
      } finally {
        setActionBusy(false);
      }
    };

  if (loading) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title={getLocalizedCustomerName(
            customerName,
            language
          )}
          subtitle={
            t.customerLedger
          }
          onBack={onBack}
        />

        <div className="empty-state">
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        title={getLocalizedCustomerName(
          customerName,
          language
        )}
        subtitle={t.customerLedger}
        onBack={onBack}
      />

      <div className="ledger-summary">
        <div>
          <span>
            {t.totalPurchased}
          </span>

          <strong>
            ₹
            {formatCurrency(
              ledger?.total_purchased
            )}
          </strong>
        </div>

        <div>
          <span>{t.totalPaid}</span>

          <strong>
            ₹
            {formatCurrency(
              ledger?.total_paid
            )}
          </strong>
        </div>

        <div>
          <span>{t.pending}</span>

          <strong className="pending-balance">
            ₹
            {formatCurrency(
              ledger?.total_pending
            )}
          </strong>
        </div>
      </div>

      <button
        type="button"
        className="primary-action"
        onClick={
          openDeleteModal
        }
      >
        {t.deleteCustomer}
      </button>

      <div className="page-list">
        {!ledger?.transactions ||
        ledger.transactions.length ===
          0 ? (
          <div className="empty-state">
            <h3>
              {
                t.noCustomerTransactions
              }
            </h3>

            <p>
              {
                t.noCustomerTransactionsSub
              }
            </p>
          </div>
        ) : (
          ledger.transactions.map(
            (transaction) => (
              <div
                className="transaction-card"
                key={transaction._id}
              >
                <div className="transaction-top">
                  <div>
                    <h3>
                      {transaction.items?.map(
                        (item, index) => (
                          <span
                            key={index}
                          >
                            {item.quantity}{" "}
                            {item.unit || ""}{" "}
                            {getLocalizedProductName(
                              item.product,
                              language
                            )}
                            {index <
                            transaction.items
                              .length -
                              1
                              ? ", "
                              : ""}
                          </span>
                        )
                      )}
                    </h3>

                    <p>
                      {t.paid}: ₹
                      {formatCurrency(
                        transaction.paid_amount
                      )}
                    </p>
                  </div>

                  <strong>
                    ₹
                    {formatCurrency(
                      transaction.total_amount
                    )}
                  </strong>
                </div>

                <div className="transaction-bottom">
                  <span className="pending-balance">
                    {t.pending}: ₹
                    {formatCurrency(
                      transaction.pending_amount
                    )}
                  </span>

                  <span
                    className={`status ${
                      transaction.payment_status ||
                      "pending"
                    }`}
                  >
                    {transaction.payment_status ===
                    "paid"
                      ? t.paid
                      : transaction.payment_status ===
                        "credit"
                      ? t.credit
                      : transaction.payment_status ===
                        "partial"
                      ? t.partial
                      : t.pending}
                  </span>

                  {Number(
                    transaction.pending_amount ||
                      0
                  ) > 0 && (
                    <button
                      type="button"
                      className="small-action"
                      onClick={() =>
                        openPaymentModal(
                          transaction
                        )
                      }
                    >
                      {t.markAsPaid}
                    </button>
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>

      {modal && (
        <ConfirmationModal
          title={modal.title}
          message={modal.message}
          cancelLabel={t.cancel}
          confirmLabel={
            modal.type ===
            "delete-customer"
              ? t.deleteCustomer
              : t.markAsPaid
          }
          busy={actionBusy}
          error={actionError}
          onCancel={closeModal}
          onConfirm={
            modal.type ===
            "delete-customer"
              ? confirmDeleteCustomer
              : confirmPayment
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   STOCK
========================================================= */

function StockPage({
  onBack,
  user,
  language,
}) {
  const t = getTranslations(language);

  const [products, setProducts] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [formData, setFormData] =
    useState({
      name: "",
      price: "",
      stock: "",
      unit: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleteBusy, setDeleteBusy] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState("");

  const loadProducts = async () => {
    if (!user?.id) {
      setProducts([]);
      return;
    }

    try {
      const response = await fetch(
        `${API}/products?account_id=${user.id}`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error(
        "Products error:",
        error
      );
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user?.id]);

  const addProduct = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setMessage(
        t.enterProductName
      );
      return;
    }

    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {
      setMessage(
        t.enterProductPrice
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/products`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            account_id: user.id,
            name: formData.name.trim(),
            price: Number(
              formData.price
            ),
            stock:
              formData.stock === ""
                ? 0
                : Number(formData.stock),
            unit:
              formData.unit.trim() ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            t.unableAddProduct
        );
        return;
      }

      setFormData({
        name: "",
        price: "",
        stock: "",
        unit: "",
      });

      setShowForm(false);
      setMessage(
        t.productAdded
      );

      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(t.backendError);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteProduct =
    (product) => {
      setDeleteError("");

      setDeleteTarget(product);
    };

  const deleteProduct = async () => {
    if (
      !deleteTarget ||
      !user?.id
    ) {
      return;
    }

    setDeleteBusy(true);
    setDeleteError("");

    try {
      const response =
        await fetch(
          `${API}/products/${encodeURIComponent(
            deleteTarget.name
          )}?account_id=${user.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setDeleteError(
          data.detail ||
            t.unableAddProduct
        );
        return;
      }

      setDeleteTarget(null);
      setMessage(
        t.productDeleted
      );

      await loadProducts();

      window.dispatchEvent(
        new Event("product-updated")
      );
    } catch (error) {
      console.error(error);

      setDeleteError(
        t.backendError
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const visibleProducts =
    products.filter((product) => {
      const localizedName =
        getLocalizedProductName(
          product.name,
          language
        );

      return (
        matchesSearch(
          product.name,
          search
        ) ||
        matchesSearch(
          localizedName,
          search
        )
      );
    });

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t.stock}
        subtitle={t.stockSub}
        onBack={onBack}
      />

      <div className="page-actions">
        <div className="page-search">
          <input
            type="text"
            placeholder={
              t.searchProducts
            }
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={() => {
            setShowForm(!showForm);
            setMessage("");
          }}
        >
          {showForm
            ? t.cancel
            : t.addProduct}
        </button>
      </div>

      {message && (
        <div className="page-message">
          {message}
        </div>
      )}

      {showForm && (
        <form
          className="dashboard-form"
          onSubmit={addProduct}
        >
          <h2>
            {t.addProductTitle}
          </h2>

          <label>
            {t.productName}
          </label>

          <input
            type="text"
            placeholder={
              t.productPlaceholder
            }
            value={formData.name}
            onChange={(event) =>
              setFormData({
                ...formData,
                name: event.target.value,
              })
            }
          />

          <label>{t.price}</label>

          <input
            type="number"
            min="0"
            placeholder={
              t.pricePlaceholder
            }
            value={formData.price}
            onChange={(event) =>
              setFormData({
                ...formData,
                price:
                  event.target.value,
              })
            }
          />

          <label>
            {t.stockLabel}
          </label>

          <input
            type="number"
            min="0"
            placeholder={
              t.stockPlaceholder
            }
            value={formData.stock}
            onChange={(event) =>
              setFormData({
                ...formData,
                stock:
                  event.target.value,
              })
            }
          />

          <label>{t.unit}</label>

          <input
            type="text"
            placeholder={
              t.unitPlaceholder
            }
            value={formData.unit}
            onChange={(event) =>
              setFormData({
                ...formData,
                unit:
                  event.target.value,
              })
            }
          />

          <button
            type="submit"
            className="primary-action form-submit"
            disabled={loading}
          >
            {loading
              ? t.addingProduct
              : t.addProduct}
          </button>
        </form>
      )}

      <div className="page-list">
        {visibleProducts.length ===
        0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              📦
            </div>

            <h3>
              {t.noProducts}
            </h3>

            <p>
              {
                t.addProductsInventory
              }
            </p>
          </div>
        ) : (
          visibleProducts.map(
            (product) => (
              <div
                className="product-card"
                key={product._id}
              >
                <div className="product-icon">
                  📦
                </div>

                <div className="product-info">
                  <h3>
                    {getLocalizedProductName(
                      product.name,
                      language
                    )}
                  </h3>

                  <p>
                    ₹
                    {formatCurrency(
                      product.price
                    )}

                    {product.unit
                      ? ` / ${product.unit}`
                      : ""}
                  </p>
                </div>

                <div className="product-stock">
                  <span>
                    {t.productStock}
                  </span>

                  <strong>
                    {product.stock || 0}{" "}
                    {product.unit || ""}
                  </strong>
                </div>

                <button
                  type="button"
                  className="small-action danger-action"
                  onClick={() =>
                    openDeleteProduct(
                      product
                    )
                  }
                >
                  {t.deleteProduct}
                </button>
              </div>
            )
          )
        )}
      </div>

      {deleteTarget && (
        <ConfirmationModal
          title={
            t.deleteProductConfirm
          }
          message={t.deleteProductMessage.replace(
            "{name}",
            getLocalizedProductName(
              deleteTarget.name,
              language
            )
          )}
          cancelLabel={t.cancel}
          confirmLabel={
            t.deleteProduct
          }
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => {
            if (!deleteBusy) {
              setDeleteTarget(null);
              setDeleteError("");
            }
          }}
          onConfirm={deleteProduct}
        />
      )}
    </div>
  );
}

/* =========================================================
   CALENDAR
========================================================= */

function CalendarPage({
  onBack,
  user,
  language,
}) {
  const t = getTranslations(language);

  const [transactions, setTransactions] =
    useState([]);

  const [selectedDate, setSelectedDate] =
    useState(getIndiaDate());

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }

    const loadCalendarTransactions =
      async () => {
        setLoading(true);

        try {
          const response =
            await fetch(
              `${API}/transactions?account_id=${user.id}&date=${selectedDate}`
            );

          const data =
            await response.json();

          if (Array.isArray(data)) {
            setTransactions(data);
          } else {
            setTransactions([]);
          }
        } catch (error) {
          console.error(
            "Calendar error:",
            error
          );

          setTransactions([]);
        } finally {
          setLoading(false);
        }
      };

    loadCalendarTransactions();
  }, [
    user?.id,
    selectedDate,
  ]);

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t.calendar}
        subtitle={t.calendarSub}
        onBack={onBack}
      />

      <div className="calendar-picker">
        <label>
          {t.selectDate}
        </label>

        <input
          type="date"
          value={selectedDate}
          onChange={(event) =>
            setSelectedDate(
              event.target.value
            )
          }
        />
      </div>

      {loading ? (
        <div className="empty-state">
          <p>{t.loading}</p>
        </div>
      ) : (
        <div className="page-list">
          {transactions.length ===
          0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                📅
              </div>

              <h3>
                {
                  t.noTransactionsDate
                }
              </h3>

              <p>
                {
                  t.transactionsDateSub
                }
              </p>
            </div>
          ) : (
            transactions.map(
              (transaction) => (
                <div
                  className="transaction-card"
                  key={transaction._id}
                >
                  <div className="transaction-top">
                    <div>
                      <h3>
                        {getLocalizedCustomerName(
                          transaction.customer,
                          language
                        )}
                      </h3>

                      <p>
                        {transaction.items?.map(
                          (
                            item,
                            index
                          ) => (
                            <span
                              key={
                                index
                              }
                            >
                              {
                                item.quantity
                              }{" "}
                              {item.unit ||
                                ""}{" "}
                              {getLocalizedProductName(
                                item.product,
                                language
                              )}
                              {index <
                              transaction
                                .items
                                .length -
                                1
                                ? ", "
                                : ""}
                            </span>
                          )
                        )}
                      </p>
                    </div>

                    <strong>
                      ₹
                      {formatCurrency(
                        transaction.total_amount
                      )}
                    </strong>
                  </div>

                  <div className="transaction-bottom">
                    <span>
                      {t.pending}: ₹
                      {formatCurrency(
                        transaction.pending_amount
                      )}
                    </span>

                    <span
                      className={`status ${
                        transaction.payment_status ||
                        "pending"
                      }`}
                    >
                      {transaction.payment_status ===
                      "paid"
                        ? t.paid
                        : transaction.payment_status ===
                          "credit"
                        ? t.credit
                        : transaction.payment_status ===
                          "partial"
                        ? t.partial
                        : t.pending}
                    </span>
                  </div>
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MORE
========================================================= */

function MorePage({
  user,
  onBack,
  onPageChange,
  onLogout,
  language,
}) {
  const t = getTranslations(language);

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t.more}
        subtitle={t.moreSub}
        onBack={onBack}
      />

      <div className="profile-preview">
        <div className="profile-avatar">
          {user?.name
            ?.charAt(0)
            ?.toUpperCase() || "D"}
        </div>

        <div>
          <h2>
            {user?.name ||
              t.shopkeeper}
          </h2>

          <p>
            {user?.shop ||
              t.myShop}
          </p>
        </div>
      </div>

      <div className="more-list">
        <button
          type="button"
          onClick={() =>
            onPageChange("profile")
          }
        >
          <span>👤</span>

          <div>
            <strong>
              {t.myProfile}
            </strong>

            <small>
              {t.myProfileSub}
            </small>
          </div>

          <b>→</b>
        </button>

        <button
          type="button"
          onClick={() =>
            onPageChange("shop")
          }
        >
          <span>🏪</span>

          <div>
            <strong>
              {t.shopDetails}
            </strong>

            <small>
              {t.shopDetailsSub}
            </small>
          </div>

          <b>→</b>
        </button>

        <button
          type="button"
          onClick={() =>
            onPageChange("reports")
          }
        >
          <span>📊</span>

          <div>
            <strong>
              {t.reports}
            </strong>

            <small>
              {t.reportsSub}
            </small>
          </div>

          <b>→</b>
        </button>

        <button
          type="button"
          onClick={() =>
            onPageChange("settings")
          }
        >
          <span>⚙️</span>

          <div>
            <strong>
              {t.settings}
            </strong>

            <small>
              {t.settingsSub}
            </small>
          </div>

          <b>→</b>
        </button>

        <button
          type="button"
          onClick={() =>
            onPageChange("language")
          }
        >
          <span>🌐</span>

          <div>
            <strong>
              {t.language}
            </strong>

            <small>
              {t.languageSub}
            </small>
          </div>

          <b>→</b>
        </button>

        <button
          type="button"
          className="logout-option"
          onClick={onLogout}
        >
          <span>🚪</span>

          <div>
            <strong>
              {t.logout}
            </strong>

            <small>
              {t.logoutSub}
            </small>
          </div>

          <b>→</b>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   SIMPLE PAGES
========================================================= */

function SimplePage({
  page,
  title,
  subtitle,
  onBack,
  user,
  language,
  onPageChange,
  onLanguageChange,
}) {
  const t = getTranslations(language);

  return (
    <div className="dashboard-page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        onBack={onBack}
      />

      <div className="dashboard-form">
        {page === "profile" && (
          <>
            <h2>
              {t.profileTitle}
            </h2>

            <label>{t.name}</label>

            <input
              value={user?.name || ""}
              readOnly
            />

            <label>
              {t.mobile}
            </label>

            <input
              value={
                user?.mobile || ""
              }
              readOnly
            />
          </>
        )}

        {page === "shop" && (
          <>
            <h2>
              {t.shopTitle}
            </h2>

            <label>
              {t.shopName}
            </label>

            <input
              value={
                user?.shop ||
                t.myShop
              }
              readOnly
            />

            <label>
              {t.shopType}
            </label>

            <input
              value={
                user?.shopType ||
                t.generalStore
              }
              readOnly
            />
          </>
        )}

        {page === "reports" && (
          <>
            <h2>
              {t.reportsTitle}
            </h2>

            <p
              style={{
                opacity: 0.7,
              }}
            >
              {t.reportsComing}
            </p>

            <button
              type="button"
              className="primary-action"
              onClick={() =>
                onPageChange("khata")
              }
            >
              {t.viewHistory}
            </button>
          </>
        )}

        {page === "settings" && (
          <>
            <h2>
              {t.settingsTitle}
            </h2>

            <label>
              {t.currentLanguage}
            </label>

            <select
              value={language}
              onChange={(event) =>
                onLanguageChange(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border:
                  "1px solid #d7d8ca",
                font: "inherit",
              }}
            >
              <option value="hi">
                हिंदी
              </option>

              <option value="mr">
                मराठी
              </option>

              <option value="en">
                English
              </option>

              <option value="auto">
                Auto
              </option>
            </select>
          </>
        )}

        {page === "language" && (
          <>
            <h2>
              {t.languageTitle}
            </h2>

            <p
              style={{
                opacity: 0.65,
              }}
            >
              {
                t.languageChooseSub
              }
            </p>

            <button
              type="button"
              className="primary-action"
              style={{
                width: "100%",
                marginBottom:
                  "10px",
              }}
              onClick={() =>
                onLanguageChange("hi")
              }
            >
              हिंदी
            </button>

            <button
              type="button"
              className="primary-action"
              style={{
                width: "100%",
                marginBottom:
                  "10px",
              }}
              onClick={() =>
                onLanguageChange("mr")
              }
            >
              मराठी
            </button>

            <button
              type="button"
              className="primary-action"
              style={{
                width: "100%",
              }}
              onClick={() =>
                onLanguageChange("en")
              }
            >
              English
            </button>

            <button
              type="button"
              className="primary-action"
              style={{
                width: "100%",
                marginTop: "10px",
              }}
              onClick={() =>
                onLanguageChange("auto")
              }
            >
              Auto
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN ROUTER
========================================================= */

export default function DashboardPages({
  page,
  language,
  user,
  onBack,
  onPageChange,
  onLogout,
  onLanguageChange,
}) {
  if (page === "khata") {
    return (
      <KhataPage
        onBack={onBack}
        user={user}
        language={language}
      />
    );
  }

  if (page === "customers") {
    return (
      <CustomersPage
        onBack={onBack}
        onPageChange={
          onPageChange
        }
        user={user}
        language={language}
      />
    );
  }

  if (page?.startsWith("customer:")) {
    const customerName =
      page.substring(
        "customer:".length
      );

    return (
      <CustomerDetailPage
        customerName={
          customerName
        }
        onBack={() =>
          onPageChange("customers")
        }
        onPageChange={
          onPageChange
        }
        user={user}
        language={language}
      />
    );
  }

  if (page === "stock") {
    return (
      <StockPage
        onBack={onBack}
        user={user}
        language={language}
      />
    );
  }

  if (page === "calendar") {
    return (
      <CalendarPage
        onBack={onBack}
        user={user}
        language={language}
      />
    );
  }

  if (page === "more") {
    return (
      <MorePage
        user={user}
        onBack={onBack}
        onPageChange={
          onPageChange
        }
        onLogout={onLogout}
        language={language}
      />
    );
  }

  if (page === "profile") {
    const t =
      getTranslations(language);

    return (
      <SimplePage
        page="profile"
        title={t.profileTitle}
        subtitle={t.profileSub}
        onBack={() =>
          onPageChange("more")
        }
        user={user}
        language={language}
        onPageChange={
          onPageChange
        }
        onLanguageChange={
          onLanguageChange
        }
      />
    );
  }

  if (page === "shop") {
    const t =
      getTranslations(language);

    return (
      <SimplePage
        page="shop"
        title={t.shopTitle}
        subtitle={t.shopSub}
        onBack={() =>
          onPageChange("more")
        }
        user={user}
        language={language}
        onPageChange={
          onPageChange
        }
        onLanguageChange={
          onLanguageChange
        }
      />
    );
  }

  if (page === "reports") {
    const t =
      getTranslations(language);

    return (
      <SimplePage
        page="reports"
        title={t.reportsTitle}
        subtitle={t.reportsSub}
        onBack={() =>
          onPageChange("more")
        }
        user={user}
        language={language}
        onPageChange={
          onPageChange
        }
        onLanguageChange={
          onLanguageChange
        }
      />
    );
  }

  if (page === "settings") {
    const t =
      getTranslations(language);

    return (
      <SimplePage
        page="settings"
        title={t.settingsTitle}
        subtitle={t.settingsSub}
        onBack={() =>
          onPageChange("more")
        }
        user={user}
        language={language}
        onPageChange={
          onPageChange
        }
        onLanguageChange={
          onLanguageChange
        }
      />
    );
  }

  if (page === "language") {
    const t =
      getTranslations(language);

    return (
      <SimplePage
        page="language"
        title={t.languageTitle}
        subtitle={
          t.languageChooseSub
        }
        onBack={() =>
          onPageChange("more")
        }
        user={user}
        language={language}
        onPageChange={
          onPageChange
        }
        onLanguageChange={
          onLanguageChange
        }
      />
    );
  }

  return null;
}