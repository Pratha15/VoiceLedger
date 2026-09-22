import { useEffect, useState } from "react";
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
    aliases: "उपनाम",
    aliasesPlaceholder: "रमेश, रमेश जी, रमेश भाई",
    adding: "जोड़ा जा रहा है...",
    customerAdded: "ग्राहक सफलतापूर्वक जोड़ दिया गया!",
    enterCustomerName: "कृपया ग्राहक का नाम दर्ज करें।",
    unableAddCustomer: "ग्राहक जोड़ने में असमर्थ।",
    backendError: "बैकएंड से कनेक्ट नहीं हो सका।",
    noCustomers: "कोई ग्राहक नहीं मिला",
    addFirstCustomer:
      "अपना पहला ग्राहक जोड़ें और उनका खाता संभालना शुरू करें।",
    view: "देखें →",

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
    productAliases: "उपनाम",
    productAliasesPlaceholder: "Rice, Chawal, चावल",
    productAdded: "सामान सफलतापूर्वक जोड़ दिया गया!",
    enterProductName: "कृपया सामान का नाम दर्ज करें।",
    enterProductPrice: "कृपया सामान की कीमत दर्ज करें।",
    addingProduct: "जोड़ा जा रहा है...",
    unableAddProduct: "सामान जोड़ने में असमर्थ।",
    noProducts: "कोई सामान नहीं मिला",
    addProductsInventory:
      "अपनी इन्वेंटरी संभालना शुरू करने के लिए सामान जोड़ें।",

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
    aliases: "उपनावे",
    aliasesPlaceholder: "रमेश, रमेश जी, रमेश भाऊ",
    adding: "जोडत आहे...",
    customerAdded: "ग्राहक यशस्वीरित्या जोडला!",
    enterCustomerName: "कृपया ग्राहकाचे नाव टाका.",
    unableAddCustomer: "ग्राहक जोडता आला नाही.",
    backendError: "बॅकएंडशी कनेक्ट करता आले नाही.",
    noCustomers: "ग्राहक सापडले नाहीत",
    addFirstCustomer:
      "तुमचा पहिला ग्राहक जोडा आणि त्यांचे खाते सांभाळायला सुरुवात करा.",
    view: "पहा →",

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
    productAliases: "उपनावे",
    productAliasesPlaceholder: "Rice, Chawal, तांदूळ",
    productAdded: "सामान यशस्वीरित्या जोडले!",
    enterProductName: "कृपया सामानाचे नाव टाका.",
    enterProductPrice: "कृपया सामानाची किंमत टाका.",
    addingProduct: "जोडत आहे...",
    unableAddProduct: "सामान जोडता आले नाही.",
    noProducts: "सामान सापडले नाही",
    addProductsInventory:
      "तुमची इन्व्हेंटरी सांभाळण्यासाठी सामान जोडा.",

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
    aliases: "Aliases",
    aliasesPlaceholder: "Ramesh, Ramesh ji, Ramesh bhai",
    adding: "Adding...",
    customerAdded: "Customer added successfully!",
    enterCustomerName: "Please enter customer name.",
    unableAddCustomer: "Unable to add customer.",
    backendError: "Unable to connect to backend.",
    noCustomers: "No customers found",
    addFirstCustomer:
      "Add your first customer to start managing their khata.",
    view: "View →",

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
    productAliases: "Aliases",
    productAliasesPlaceholder: "Rice, Chawal, चावल",
    productAdded: "Product added successfully!",
    enterProductName: "Please enter product name.",
    enterProductPrice: "Please enter product price.",
    addingProduct: "Adding...",
    unableAddProduct: "Unable to add product.",
    noProducts: "No products found",
    addProductsInventory:
      "Add products to start managing your inventory.",

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
  return translations[language] || translations.en;
}

function displayProductName(name, language) {
  const normalized = (name || "").toLowerCase();
  if (normalized === "rice") {
    return language === "hi" ? "चावल" : language === "mr" ? "तांदूळ" : "Rice";
  }
  if (normalized === "sugar") {
    return language === "hi" ? "चीनी" : language === "mr" ? "साखर" : "Sugar";
  }
  if (normalized === "chips") {
    return language === "hi" || language === "mr" ? "चिप्स" : "Chips";
  }
  return name;
}

function displayCustomerName(name, language) {
  const normalized = (name || "").trim().toLowerCase();
  const names = {
    "amit verma": { hi: "अमित वर्मा", mr: "अमित वर्मा" },
    "amit kumar": { hi: "अमित कुमार", mr: "अमित कुमार" },
    "pratha": { hi: "प्रथा", mr: "प्रथा" },
    "shivam": { hi: "शिवम", mr: "शिवम" },
    "siyad shukla": { hi: "सियाद शुक्ला", mr: "सियाद शुक्ला" },
  };
  return names[normalized]?.[language] || name;
}

/* =========================================================
   COMMON HEADER
========================================================= */

function PageHeader({ title, subtitle, onBack }) {
  return (
    <div className="page-header">
      <button className="back-btn" onClick={onBack}>
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

function KhataPage({ onBack, user, language }) {
  const t = getTranslations(language);

  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
  });

  const getDateQuery = () => {
    if (dateFilter === "all") return "";
    if (dateFilter === "today") return `date=${selectedDate}`;
    const selected = new Date(`${selectedDate}T00:00:00`);
    const start = new Date(selected);
    const end = new Date(selected);
    if (dateFilter === "yesterday") {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (dateFilter === "week") {
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 6);
    } else if (dateFilter === "month") {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
    }
    const format = (value) => value.toISOString().slice(0, 10);
    return `start_date=${format(start)}&end_date=${format(end)}`;
  };

  const loadTransactions = () => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }

    const query = getDateQuery();
    fetch(`${API}/transactions?account_id=${user.id}${query ? `&${query}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      })
      .catch((err) =>
        console.error("Transactions error:", err)
      );
  };

  useEffect(() => {
    loadTransactions();
  }, [user?.id, dateFilter, selectedDate]);

  const visibleTransactions = transactions.filter((transaction) =>
    transaction.customer
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );
  const dailySales = visibleTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.total_amount || 0),
    0
  );
  const dailyCollected = visibleTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.paid_amount || 0),
    0
  );
  const dailyPending = visibleTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.pending_amount || 0),
    0
  );

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
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="khata-filters">
        {["today", "yesterday", "week", "month", "all"].map((filter) => (
          <button
            key={filter}
            className={dateFilter === filter ? "active" : ""}
            onClick={() => setDateFilter(filter)}
          >
            {filter === "today" ? "Today" : filter === "yesterday" ? "Yesterday" : filter === "week" ? "This Week" : filter === "month" ? "This Month" : "All"}
          </button>
        ))}
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(event.target.value);
            setDateFilter("today");
          }}
          aria-label="Select Khata date"
        />
      </div>

      <div className="ledger-summary khata-summary">
        <div><span>Sales</span><strong>₹{dailySales.toLocaleString("en-IN")}</strong></div>
        <div><span>Collected</span><strong>₹{dailyCollected.toLocaleString("en-IN")}</strong></div>
        <div><span>Pending</span><strong className="pending-balance">₹{dailyPending.toLocaleString("en-IN")}</strong></div>
      </div>

      <div className="page-list">
        {visibleTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>{t.noTransactions}</h3>
            <p>{t.transactionsAppear}</p>
          </div>
        ) : (
          visibleTransactions.map((transaction) => (
            <div
              className="transaction-card"
              key={transaction._id}
            >
              <div className="transaction-top">
                <div>
                  <h3>{displayCustomerName(transaction.customer, language)}</h3>

                  <p>
                    {transaction.items?.map((item, index) => (
                      <span key={index}>
                        {item.quantity} {item.unit || ""}{" "}
                        {displayProductName(item.product, language)}
                        {index < transaction.items.length - 1
                          ? ", "
                          : ""}
                      </span>
                    ))}
                  </p>
                </div>

                <strong>
                  ₹
                  {Number(
                    transaction.total_amount || 0
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="transaction-bottom">
                <span>
                  {t.paid}: ₹
                  {Number(
                    transaction.paid_amount || 0
                  ).toLocaleString("en-IN")}
                </span>

                <span
                  className={`status ${
                    transaction.payment_status || "pending"
                  }`}
                >
                  {transaction.payment_status === "paid"
                    ? t.paid
                    : transaction.payment_status === "credit"
                    ? t.credit
                    : transaction.payment_status === "partial"
                    ? t.partial
                    : t.pending}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
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

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadCustomers = () => {
    if (!user?.id) {
      setCustomers([]);
      return;
    }

    fetch(`${API}/customers?account_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data);
        }
      })
      .catch((err) =>
        console.error("Customers error:", err)
      );
  };

  useEffect(() => {
    loadCustomers();
  }, [user?.id]);

  const addCustomer = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setMessage(t.enterCustomerName);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_id: user.id,
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || t.unableAddCustomer);
        return;
      }

      setFormData({
        name: "",
        phone: "",
      });

      setShowForm(false);
      setMessage(t.customerAdded);

      loadCustomers();
    } catch (error) {
      console.error(error);
      setMessage(t.backendError);
    } finally {
      setLoading(false);
    }
  };

  const visibleCustomers = customers.filter((customer) => {
    const searchText = search.toLowerCase();

    return (
      customer.name?.toLowerCase().includes(searchText) ||
      customer.phone?.toLowerCase().includes(searchText) ||
      customer.aliases?.some((alias) =>
        alias.toLowerCase().includes(searchText)
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
            placeholder={t.searchCustomers}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className="primary-action"
          onClick={() => {
            setShowForm(!showForm);
            setMessage("");
          }}
        >
          {showForm ? t.cancel : t.addCustomer}
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
          <h2>{t.addCustomerTitle}</h2>

          <label>{t.customerName}</label>
          <input
            type="text"
            placeholder={t.customerNamePlaceholder}
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
          />

          <label>{t.phone}</label>
          <input
            type="text"
            placeholder={t.optional}
            value={formData.phone}
            onChange={(e) =>
              setFormData({
                ...formData,
                phone: e.target.value,
              })
            }
          />

          <button
            className="primary-action form-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? t.adding : t.addCustomer}
          </button>
        </form>
      )}

      <div className="page-list">
        {visibleCustomers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>{t.noCustomers}</h3>
            <p>{t.addFirstCustomer}</p>
          </div>
        ) : (
          visibleCustomers.map((customer) => (
            <div
              className="customer-card"
              key={customer._id}
            >
              <div className="customer-avatar">
                {customer.name?.charAt(0)?.toUpperCase() ||
                  "C"}
              </div>

              <div className="customer-info">
                <h3>{displayCustomerName(customer.name, language)}</h3>

                {customer.phone && (
                  <p>📞 {customer.phone}</p>
                )}

                {customer.aliases?.length > 0 && (
                  <div className="aliases">
                    {customer.aliases.map(
                      (alias, index) => (
                        <span key={index}>{alias}</span>
                      )
                    )}
                  </div>
                )}
              </div>

              <button
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
          ))
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
  user,
  language,
}) {
  const t = getTranslations(language);

  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLedger(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(
      `${API}/customers/${encodeURIComponent(
        customerName
      )}/ledger?account_id=${user.id}`
    )
      .then((res) => res.json())
      .then((data) => setLedger(data))
      .catch((err) =>
        console.error("Customer ledger error:", err)
      )
      .finally(() => setLoading(false));
  }, [customerName, user?.id]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title={displayCustomerName(customerName, language)}
          subtitle={t.customerLedger}
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
        title={displayCustomerName(customerName, language)}
        subtitle={t.customerLedger}
        onBack={onBack}
      />

      <div className="ledger-summary">
        <div>
          <span>{t.totalPurchased}</span>
          <strong>
            ₹
            {Number(
              ledger?.total_purchased || 0
            ).toLocaleString("en-IN")}
          </strong>
        </div>

        <div>
          <span>{t.totalPaid}</span>
          <strong>
            ₹
            {Number(
              ledger?.total_paid || 0
            ).toLocaleString("en-IN")}
          </strong>
        </div>

        <div>
          <span>{t.pending}</span>
          <strong className="pending-balance">
            ₹
            {Number(
              ledger?.total_pending || 0
            ).toLocaleString("en-IN")}
          </strong>
        </div>
      </div>

      <div className="page-list">
        {ledger?.transactions?.length === 0 ? (
          <div className="empty-state">
            <h3>{t.noCustomerTransactions}</h3>
            <p>{t.noCustomerTransactionsSub}</p>
          </div>
        ) : (
          ledger?.transactions?.map((transaction) => (
            <div
              className="transaction-card"
              key={transaction._id}
            >
              <div className="transaction-top">
                <div>
                  <h3>
                    {transaction.items?.map(
                      (item, index) => (
                        <span key={index}>
                          {item.quantity}{" "}
                          {item.unit || ""}{" "}
                          {displayProductName(item.product, language)}
                          {index <
                          transaction.items.length - 1
                            ? ", "
                            : ""}
                        </span>
                      )
                    )}
                  </h3>

                  <p>
                    {t.paid}: ₹
                    {Number(
                      transaction.paid_amount || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <strong>
                  ₹
                  {Number(
                    transaction.total_amount || 0
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="transaction-bottom">
                <span className="pending-balance">
                  {t.pending}: ₹
                  {Number(
                    transaction.pending_amount || 0
                  ).toLocaleString("en-IN")}
                </span>

                <span
                  className={`status ${
                    transaction.payment_status ||
                    "pending"
                  }`}
                >
                  {transaction.payment_status === "paid"
                    ? t.paid
                    : transaction.payment_status === "credit"
                    ? t.credit
                    : transaction.payment_status === "partial"
                    ? t.partial
                    : t.pending}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STOCK
========================================================= */

function StockPage({ onBack, user, language }) {
  const t = getTranslations(language);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    unit: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadProducts = () => {
    if (!user?.id) {
      setProducts([]);
      return;
    }

    fetch(`${API}/products?account_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) =>
        console.error("Products error:", err)
      );
  };

  useEffect(() => {
    loadProducts();
  }, [user?.id]);

  const addProduct = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setMessage(t.enterProductName);
      return;
    }

    if (!formData.price) {
      setMessage(t.enterProductPrice);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_id: user.id,
          name: formData.name.trim(),
          price: Number(formData.price),
          stock: formData.stock
            ? Number(formData.stock)
            : 0,
          unit: formData.unit.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || t.unableAddProduct
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
      setMessage(t.productAdded);

      loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(t.backendError);
    } finally {
      setLoading(false);
    }
  };

  const visibleProducts = products.filter((product) =>
    product.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

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
            placeholder={t.searchProducts}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className="primary-action"
          onClick={() => {
            setShowForm(!showForm);
            setMessage("");
          }}
        >
          {showForm ? t.cancel : t.addProduct}
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
          <h2>{t.addProductTitle}</h2>

          <label>{t.productName}</label>
          <input
            type="text"
            placeholder={t.productPlaceholder}
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
          />

          <label>{t.price}</label>
          <input
            type="number"
            placeholder={t.pricePlaceholder}
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: e.target.value,
              })
            }
          />

          <label>{t.stockLabel}</label>
          <input
            type="number"
            placeholder={t.stockPlaceholder}
            value={formData.stock}
            onChange={(e) =>
              setFormData({
                ...formData,
                stock: e.target.value,
              })
            }
          />

          <label>{t.unit}</label>
          <input
            type="text"
            placeholder={t.unitPlaceholder}
            value={formData.unit}
            onChange={(e) =>
              setFormData({
                ...formData,
                unit: e.target.value,
              })
            }
          />

          <button
            className="primary-action form-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? t.addingProduct : t.addProduct}
          </button>
        </form>
      )}

      <div className="page-list">
        {visibleProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>{t.noProducts}</h3>
            <p>{t.addProductsInventory}</p>
          </div>
        ) : (
          visibleProducts.map((product) => (
            <div
              className="product-card"
              key={product._id}
            >
              <div className="product-icon">📦</div>

              <div className="product-info">
                <h3>{displayProductName(product.name, language)}</h3>

                <p>
                  ₹
                  {Number(
                    product.price || 0
                  ).toLocaleString("en-IN")}
                  {product.unit
                    ? ` / ${product.unit}`
                    : ""}
                </p>
              </div>

              <div className="product-stock">
                <span>{t.productStock}</span>

                <strong>
                  {product.stock || 0}{" "}
                  {product.unit || ""}
                </strong>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   CALENDAR
========================================================= */

function CalendarPage({ onBack, user, language }) {
  const t = getTranslations(language);

  const [transactions, setTransactions] = useState([]);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }

    fetch(`${API}/transactions?account_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      })
      .catch((err) =>
        console.error("Calendar error:", err)
      );
  }, [user?.id]);

  const selectedTransactions = transactions.filter(
    (transaction) => {
      if (!transaction._id) return false;

      const objectIdDate = new Date(
        parseInt(
          transaction._id.substring(0, 8),
          16
        ) * 1000
      );

      return (
        objectIdDate.toISOString().split("T")[0] ===
        selectedDate
      );
    }
  );

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t.calendar}
        subtitle={t.calendarSub}
        onBack={onBack}
      />

      <div className="calendar-picker">
        <label>{t.selectDate}</label>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) =>
            setSelectedDate(e.target.value)
          }
        />
      </div>

      <div className="page-list">
        {selectedTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>{t.noTransactionsDate}</h3>
            <p>{t.transactionsDateSub}</p>
          </div>
        ) : (
          selectedTransactions.map((transaction) => (
            <div
              className="transaction-card"
              key={transaction._id}
            >
              <div className="transaction-top">
                <div>
                  <h3>{displayCustomerName(transaction.customer, language)}</h3>

                  <p>
                    {transaction.items?.map(
                      (item, index) => (
                        <span key={index}>
                          {item.quantity}{" "}
                          {item.unit || ""}{" "}
                          {displayProductName(item.product, language)}
                          {index <
                          transaction.items.length - 1
                            ? ", "
                            : ""}
                        </span>
                      )
                    )}
                  </p>
                </div>

                <strong>
                  ₹
                  {Number(
                    transaction.total_amount || 0
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="transaction-bottom">
                <span>
                  {t.pending}: ₹
                  {Number(
                    transaction.pending_amount || 0
                  ).toLocaleString("en-IN")}
                </span>

                <span
                  className={`status ${
                    transaction.payment_status ||
                    "pending"
                  }`}
                >
                  {transaction.payment_status === "paid"
                    ? t.paid
                    : transaction.payment_status === "credit"
                    ? t.credit
                    : transaction.payment_status === "partial"
                    ? t.partial
                    : t.pending}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
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
          {user?.name?.charAt(0)?.toUpperCase() || "D"}
        </div>

        <div>
          <h2>{user?.name || t.shopkeeper}</h2>
          <p>{user?.shop || t.myShop}</p>
        </div>
      </div>

      <div className="more-list">
        <button onClick={() => onPageChange("profile")}>
          <span>👤</span>
          <div>
            <strong>{t.myProfile}</strong>
            <small>{t.myProfileSub}</small>
          </div>
          <b>→</b>
        </button>

        <button onClick={() => onPageChange("shop")}>
          <span>🏪</span>
          <div>
            <strong>{t.shopDetails}</strong>
            <small>{t.shopDetailsSub}</small>
          </div>
          <b>→</b>
        </button>

        <button onClick={() => onPageChange("reports")}>
          <span>📊</span>
          <div>
            <strong>{t.reports}</strong>
            <small>{t.reportsSub}</small>
          </div>
          <b>→</b>
        </button>

        <button onClick={() => onPageChange("settings")}>
          <span>⚙️</span>
          <div>
            <strong>{t.settings}</strong>
            <small>{t.settingsSub}</small>
          </div>
          <b>→</b>
        </button>

        <button onClick={() => onPageChange("language")}>
          <span>🌐</span>
          <div>
            <strong>{t.language}</strong>
            <small>{t.languageSub}</small>
          </div>
          <b>→</b>
        </button>

        <button
          className="logout-option"
          onClick={onLogout}
        >
          <span>🚪</span>
          <div>
            <strong>{t.logout}</strong>
            <small>{t.logoutSub}</small>
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
            <h2>{t.profileTitle}</h2>

            <label>{t.name}</label>
            <input
              value={user?.name || ""}
              readOnly
            />

            <label>{t.mobile}</label>
            <input
              value={user?.mobile || ""}
              readOnly
            />
          </>
        )}

        {page === "shop" && (
          <>
            <h2>{t.shopTitle}</h2>

            <label>{t.shopName}</label>
            <input
              value={user?.shop || t.myShop}
              readOnly
            />

            <label>{t.shopType}</label>
            <input
              value={user?.shopType || t.generalStore}
              readOnly
            />
          </>
        )}

        {page === "reports" && (
          <>
            <h2>{t.reportsTitle}</h2>

            <p style={{ opacity: 0.7 }}>
              {t.reportsComing}
            </p>

            <button
              className="primary-action"
              onClick={() => onPageChange("khata")}
            >
              {t.viewHistory}
            </button>
          </>
        )}

        {page === "settings" && (
          <>
            <h2>{t.settingsTitle}</h2>

            <label>{t.currentLanguage}</label>

            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #d7d8ca",
                font: "inherit",
              }}
            >
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
              <option value="en">English</option>
            </select>
          </>
        )}

        {page === "language" && (
          <>
            <h2>{t.languageTitle}</h2>

            <p style={{ opacity: 0.65 }}>
              {t.languageChooseSub}
            </p>

            <button
              className="primary-action"
              style={{
                width: "100%",
                marginBottom: "10px",
              }}
              onClick={() => onLanguageChange("hi")}
            >
              हिंदी
            </button>

            <button
              className="primary-action"
              style={{
                width: "100%",
                marginBottom: "10px",
              }}
              onClick={() => onLanguageChange("mr")}
            >
              मराठी
            </button>

            <button
              className="primary-action"
              style={{ width: "100%" }}
              onClick={() => onLanguageChange("en")}
            >
              English
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
        onPageChange={onPageChange}
        user={user}
        language={language}
      />
    );
  }

  if (page?.startsWith("customer:")) {
    const customerName =
      page.substring("customer:".length);

    return (
      <CustomerDetailPage
        customerName={customerName}
        onBack={() => onPageChange("customers")}
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
        onPageChange={onPageChange}
        onLogout={onLogout}
        language={language}
      />
    );
  }

  if (page === "profile") {
    const t = getTranslations(language);

    return (
      <SimplePage
        page="profile"
        title={t.profileTitle}
        subtitle={t.profileSub}
        onBack={() => onPageChange("more")}
        user={user}
        language={language}
        onPageChange={onPageChange}
      />
    );
  }

  if (page === "shop") {
    const t = getTranslations(language);

    return (
      <SimplePage
        page="shop"
        title={t.shopTitle}
        subtitle={t.shopSub}
        onBack={() => onPageChange("more")}
        user={user}
        language={language}
        onPageChange={onPageChange}
      />
    );
  }

  if (page === "reports") {
    const t = getTranslations(language);

    return (
      <SimplePage
        page="reports"
        title={t.reportsTitle}
        subtitle={t.reportsSub}
        onBack={() => onPageChange("more")}
        user={user}
        language={language}
        onPageChange={onPageChange}
      />
    );
  }

  if (page === "settings") {
    const t = getTranslations(language);

    return (
      <SimplePage
        page="settings"
        title={t.settingsTitle}
        subtitle={t.settingsSub}
        onBack={() => onPageChange("more")}
        user={user}
        language={language}
        onPageChange={onPageChange}
      />
    );
  }

  if (page === "language") {
    const t = getTranslations(language);

    return (
      <SimplePage
        page="language"
        title={t.languageTitle}
        subtitle={t.languageChooseSub}
        onBack={() => onPageChange("more")}
        user={user}
        language={language}
        onPageChange={onPageChange}
      />
    );
  }

  return null;
}