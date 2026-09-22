import { useEffect, useRef, useState } from "react";

import {
  Home,
  Notebook,
  Users,
  Package,
  MoreHorizontal,
  Calendar,
  Mic,
  TrendingUp,
  ShoppingBag,
  Check,
  Clock,
  ChevronDown,
  MessageSquare,
  Search,
  Plus,
  Trash2,
} from "lucide-react";

import "./App.css";

import logoLotus from "./assets/decorations/logo-lotus.png";
import heroLotus from "./assets/decorations/hero-lotus.png";
import heroShop from "./assets/decorations/hero-shop.png";
import sidebarShop from "./assets/decorations/sidebar-shop.png";
import sidebarVine from "./assets/decorations/sidebar-vine.png";
import headerTopRight from "./assets/decorations/header-top-right.png";
import headerTopCenter from "./assets/decorations/header-top-center.png";
import convLotusWave from "./assets/decorations/conv-lotus-wave.png";
import convCornerLeaf from "./assets/decorations/conv-corner-leaf.png";
import quickHeaderIcon from "./assets/decorations/quick-header-icon.png";
import mandalaSvg from "./assets/decorations/mandala.svg";
import floralWatermark from "./assets/decorations/floral-watermark.svg";

import DashboardPages from "./screens/DashboardPages.jsx";
import {
  displayCustomerName as localizedCustomerName,
  displayProductName as localizedProductName,
} from "./utils/displayNames.js";

const API = "http://127.0.0.1:8000";

const displayProductName = (name, language) => {
  const localized = localizedProductName(name, language);
  if (localized !== name || language === "en") return localized;
  const normalized = (name || "").toLowerCase();
  if (normalized === "rice") return language === "hi" ? "चावल" : language === "mr" ? "तांदूळ" : "Rice";
  if (normalized === "sugar") return language === "hi" ? "चीनी" : language === "mr" ? "साखर" : "Sugar";
  if (normalized === "chips") return language === "hi" || language === "mr" ? "चिप्स" : "Chips";
  return name;
};

const displayCustomerName = (name, language) => {
  const localized = localizedCustomerName(name, language);
  if (localized !== name || language === "en") return localized;
  const normalized = (name || "").trim().toLowerCase();
  const names = {
    "amit verma": { hi: "अमित वर्मा", mr: "अमित वर्मा" },
    "amit kumar": { hi: "अमित कुमार", mr: "अमित कुमार" },
    "pratha": { hi: "प्रथा", mr: "प्रथा" },
    "shivam": { hi: "शिवम", mr: "शिवम" },
    "siyad shukla": { hi: "सियाद शुक्ला", mr: "सियाद शुक्ला" },
  };
  return names[normalized]?.[language] || name;
};

/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
  hi: {
    tagline: "Aap bolo, hisaab hum sambhale.",
    home: "होम",
    khata: "खाता",
    customers: "ग्राहक",
    stock: "स्टॉक",
    more: "अधिक",
    greeting: "नमस्ते 👋",
    question1: "आज दुकान में",
    question2: "क्या हुआ?",
    hint: "आप बोलिए, हिसाब हम संभालेंगे।",
    start: "बात शुरू करें",
    stop: "बात रोकें",
    ready: "मैं सुनने के लिए तैयार हूँ",
    listening: "मैं सुन रहा हूँ...",
    thinking: "सोच रहा हूँ...",
    conversation: "आपकी बातचीत",
    todayDate: "आज की तारीख",
    today: "आज का हिसाब",
    sales: "बिक्री",
    collected: "मिला",
    pending: "बाकी",
    recent: "हाल की लेन-देन",
    addCustomer: "ग्राहक जोड़ें",
    addProduct: "सामान जोड़ें",
    viewKhata: "खाता देखें",
    quickActions: "जल्दी से करें",
    noTransactions: "अभी कोई लेन-देन नहीं है।",
    noConversationTitle: "अभी तक कोई बातचीत नहीं हुई है",
    noConversationSub: "बात शुरू करें और अपना हिसाब बताएं",
    paid: "भुगतान",
    credit: "उधार",
    partial: "आंशिक",
    goodMorning: "Good Morning",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
    goodNight: "Good Night",
    notSupported:
      "इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है।",
    navHome: "होम",
    navKhata: "खाता",
    navCust: "ग्राहक",
    navMore: "और",
  },

  mr: {
    tagline: "तुम्ही बोला, हिशोब आम्ही सांभाळू.",
    home: "होम",
    khata: "खाते",
    customers: "ग्राहक",
    stock: "स्टॉक",
    more: "अधिक",
    greeting: "नमस्कार 👋",
    question1: "आज दुकानात",
    question2: "काय झालं?",
    hint: "तुम्ही बोला, हिशोब आम्ही सांभाळू.",
    start: "बोलणे सुरू करा",
    stop: "बोलणे थांबवा",
    ready: "मी ऐकण्यासाठी तयार आहे",
    listening: "ऐकत आहे...",
    thinking: "विचार करत आहे...",
    conversation: "तुमची बातचीत",
    todayDate: "आजची तारीख",
    today: "आजचा हिशोब",
    sales: "विक्री",
    collected: "मिळाले",
    pending: "बाकी",
    recent: "अलीकडील व्यवहार",
    addCustomer: "ग्राहक जोडा",
    addProduct: "सामान जोडा",
    viewKhata: "खाते पहा",
    quickActions: "जलद कृती",
    noTransactions: "अजून कोणतेही व्यवहार नाहीत.",
    noConversationTitle:
      "अजून कोणतीही बातचीत झालेली नाही",
    noConversationSub:
      "बोलणे सुरू करा आणि तुमचा हिशोब सांगा",
    paid: "भुगतान",
    credit: "उधार",
    partial: "आंशिक",
    goodMorning: "Good Morning",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
    goodNight: "Good Night",
    notSupported:
      "या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही.",
    navHome: "होम",
    navKhata: "खाते",
    navCust: "ग्राहक",
    navMore: "अधिक",
  },

  en: {
    tagline: "Aap bolo, hisaab hum sambhale.",
    home: "Home",
    khata: "Khata",
    customers: "Customers",
    stock: "Stock",
    more: "More",
    greeting: "Namaste 👋",
    question1: "What happened in",
    question2: "the shop today?",
    hint: "You speak, we manage your accounts.",
    start: "Start talking",
    stop: "Stop talking",
    ready: "I'm ready to listen",
    listening: "I'm listening...",
    thinking: "Thinking...",
    conversation: "Your conversation",
    todayDate: "Today's date",
    today: "Today's summary",
    sales: "Sales",
    collected: "Collected",
    pending: "Pending",
    recent: "Recent transactions",
    addCustomer: "Add customer",
    addProduct: "Add product",
    viewKhata: "View Khata",
    quickActions: "Quick actions",
    noTransactions: "No transactions yet.",
    noConversationTitle: "No conversation yet",
    noConversationSub:
      "Start talking and record your accounts",
    paid: "Paid",
    credit: "Credit",
    partial: "Partial",
    goodMorning: "Good Morning",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
    goodNight: "Good Night",
    notSupported:
      "Speech recognition is not supported in this browser.",
    navHome: "Home",
    navKhata: "Khata",
    navCust: "Customers",
    navMore: "More",
  },
};

/* =========================================================
   APP
========================================================= */

function App({ user, shopData, onLogout, onLanguageChange }) {
  const [language, setLanguage] = useState(user?.language || "en");

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatSearch, setChatSearch] = useState("");
  const [currentTime, setCurrentTime] = useState(
    new Date()
  );

  const [isConversationActive, setIsConversationActive] =
    useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activePage, setActivePage] = useState("home");

  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const activeRef = useRef(false);
  const recognitionRunningRef = useRef(false);
  const processingRef = useRef(false);

  const t =
  translations[language] ||
  translations["en"];

  useEffect(() => {
    if (user?.language) setLanguage(user.language);
  }, [user?.language]);

  const chatSessionKey = `dukaansaathi-chat-id-${user?.id || ""}`;

  const loadChatDetails = async (chatId) => {
    const response = await fetch(
      `${API}/chats/${chatId}?account_id=${user.id}`
    );
    if (!response.ok) throw new Error("Unable to load chat");
    const data = await response.json();
    setSelectedChatId(chatId);
    setMessages(
      (data.messages || []).map((message) => ({
        sender: message.sender,
        text: message.text,
      }))
    );
    localStorage.setItem(chatSessionKey, chatId);
  };

  const loadChats = async () => {
    const response = await fetch(`${API}/chats?account_id=${user.id}`);
    if (!response.ok) throw new Error("Unable to load chats");
    let data = await response.json();

    if (data.length === 0) {
      const createResponse = await fetch(
        `${API}/chats?account_id=${user.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New chat" }),
        }
      );
      data = [await createResponse.json()];
    }

    setChats(data);
    const savedChatId = localStorage.getItem(chatSessionKey);
    const selected = data.find((chat) => chat.id === savedChatId) || data[0];
    await loadChatDetails(selected.id);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadChats().catch((error) => console.error("Chat loading error:", error));
  }, [user?.id]);

  const createNewChat = async () => {
    stopConversation();
    const response = await fetch(`${API}/chats?account_id=${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New chat" }),
    });
    const chat = await response.json();
    setChats((current) => [chat, ...current]);
    await loadChatDetails(chat.id);
  };

  const deleteChat = async (chatId) => {
    const response = await fetch(
      `${API}/chats/${chatId}?account_id=${user.id}`,
      { method: "DELETE" }
    );
    if (!response.ok) return;

    const remaining = chats.filter((chat) => chat.id !== chatId);
    if (remaining.length === 0) {
      const response = await fetch(`${API}/chats?account_id=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New chat" }),
      });
      const replacement = await response.json();
      setChats([replacement]);
      await loadChatDetails(replacement.id);
      return;
    }

    setChats(remaining);
    if (selectedChatId === chatId) await loadChatDetails(remaining[0].id);
  };

  const saveChatMessage = async (sender, text) => {
    if (!selectedChatId) return;
    await fetch(
      `${API}/chats/${selectedChatId}/messages?account_id=${user.id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, text }),
      }
    );
  };

  const updateChatTitle = async (text) => {
    if (!selectedChatId) return;
    const title = text.replace(/\s+/g, " ").trim().slice(0, 42) || "New chat";
    const response = await fetch(
      `${API}/chats/${selectedChatId}?account_id=${user.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }
    );
    if (response.ok) {
      const updated = await response.json();
      setChats((current) => current.map((chat) => (
        chat.id === updated.id ? updated : chat
      )));
    }
  };

  const groupedChats = chats
    .filter((chat) => chat.title.toLowerCase().includes(chatSearch.toLowerCase()))
    .reduce((groups, chat) => {
      const date = new Date(chat.updated_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const key = date.toDateString() === today.toDateString()
        ? "Today"
        : date.toDateString() === yesterday.toDateString()
        ? "Yesterday"
        : "Older";
      groups[key].push(chat);
      return groups;
    }, { Today: [], Yesterday: [], Older: [] });

  /* =========================================================
     CLOCK
  ========================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* =========================================================
     FETCH SUMMARY
  ========================================================= */

  const fetchSummary = () => {
  if (!user?.id) {
    setSummary({
      total_sales: 0,
      total_collected: 0,
      total_pending: 0,
    });
    return;
  }

  fetch(`${API}/transactions/summary?account_id=${user.id}`)
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        setSummary(data);
      }
    })
    .catch((error) =>
      console.log("Summary error:", error)
    );
};

  /* =========================================================
     FETCH TRANSACTIONS
  ========================================================= */

  const fetchTransactions = () => {
  if (!user?.id) {
    setTransactions([]);
    return;
  }

  fetch(`${API}/transactions?account_id=${user.id}`)
    .then((response) => response.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    })
    .catch((error) =>
      console.log("Transactions error:", error)
    );
};

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  useEffect(() => {
    const refreshDashboard = () => {
      fetchSummary();
      fetchTransactions();
    };
    window.addEventListener("transaction-updated", refreshDashboard);
    return () => window.removeEventListener("transaction-updated", refreshDashboard);
  }, []);

  /* =========================================================
     DATE / TIME
  ========================================================= */

  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayNamesShort = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];

  const dayNamesFull = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const fullMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const headerDateStr = `${dayNamesShort[currentTime.getDay()]}, ${
    currentTime.getDate()
  } ${
    monthNamesShort[currentTime.getMonth()]
  } ${currentTime.getFullYear()}`;

  const rightCardDateStr = `${currentTime.getDate()} ${
    fullMonths[currentTime.getMonth()]
  } ${currentTime.getFullYear()}`;

  const rightCardDayStr =
    dayNamesFull[currentTime.getDay()];

  const formattedTime =
    currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const hour = currentTime.getHours();

  const greeting =
    hour < 12
      ? t.goodMorning
      : hour < 17
      ? t.goodAfternoon
      : hour < 21
      ? t.goodEvening
      : t.goodNight;

  /* =========================================================
     SPEAK RESPONSE
  ========================================================= */

  const speakResponse = (text, speechLanguage = language) => {
    return new Promise((resolve) => {
      if (!text || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        resolve();
        return;
      }

      const synthesis = window.speechSynthesis;
      const requestedLanguage = speechLanguage === "mr"
        ? "mr-IN"
        : speechLanguage === "hi"
        ? "hi-IN"
        : speechLanguage === "auto"
        ? (/[^ -]/.test(text) ? "hi-IN" : "en-IN")
        : "en-IN";
      let hasSpoken = false;

      const speakWithAvailableVoice = () => {
        if (hasSpoken) return;
        hasSpoken = true;
        const voices = synthesis.getVoices();
        const requestedFamily = requestedLanguage.slice(0, 2).toLowerCase();
        const voice = voices.find((candidate) => candidate.lang === requestedLanguage)
          || voices.find((candidate) => candidate.lang?.toLowerCase().startsWith(requestedFamily))
          || (requestedFamily === "mr" && voices.find((candidate) => candidate.lang?.toLowerCase().startsWith("hi")))
          || voices.find((candidate) => candidate.lang?.toLowerCase() === "en-in")
          || voices.find((candidate) => candidate.lang?.toLowerCase().startsWith("en"))
          || voices[0];
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = voice?.lang || requestedLanguage;
        if (voice) speech.voice = voice;
        speech.rate = 0.95;
        speech.pitch = 1;
        speech.onend = resolve;
        speech.onerror = resolve;
        synthesis.speak(speech);
      };

      synthesis.cancel();
      if (synthesis.getVoices().length > 0) {
        speakWithAvailableVoice();
        return;
      }

      const handleVoicesChanged = () => {
        synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        speakWithAvailableVoice();
      };
      synthesis.addEventListener("voiceschanged", handleVoicesChanged, { once: true });
      window.setTimeout(() => {
        synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        speakWithAvailableVoice();
      }, 700);
    });
  };

  /* =========================================================
     FORMAT AI RESPONSE
  ========================================================= */

  const getAIReplyText = (data) => {
    if (!data) {
      return language === "hi"
        ? "माफ़ कीजिए, कोई जवाब नहीं मिला।"
        : "Sorry, I could not understand that.";
    }

    if (typeof data.reply === "string") {
      return data.reply;
    }

    if (data.reply && typeof data.reply === "object") {
      const reply = data.reply;

      if (
        reply.needs_clarification &&
        reply.clarification_question
      ) {
        return reply.clarification_question;
      }

      if (reply.intent === "sale") {
        if (data.transaction_id) {
          return language === "hi"
            ? "ठीक है, लेन-देन दर्ज कर लिया गया है।"
            : language === "mr"
            ? "ठीक आहे, व्यवहार नोंदवला आहे."
            : "Okay, the transaction has been recorded.";
        }

        return language === "hi"
          ? "मैंने जानकारी समझ ली है।"
          : "I understood the information.";
      }

      if (reply.intent === "query") {
        return language === "hi"
          ? "मैं आपके हिसाब की जानकारी देख रहा हूँ।"
          : "I'm checking your ledger information.";
      }
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    return language === "hi"
      ? "हिसाब दर्ज कर लिया गया है।"
      : "Transaction recorded.";
  };

  /* =========================================================
     START SPEECH RECOGNITION
  ========================================================= */

  const startRecognition = () => {
    if (
      !activeRef.current ||
      recognitionRunningRef.current
    ) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t.notSupported);

      activeRef.current = false;
      setIsConversationActive(false);

      return;
    }

    const recognition =
      new SpeechRecognition();

    // The Web Speech API accepts one recognition locale per listening turn.
    // Auto uses the browser locale as a stable starting point; the backend
    // then detects each transcript and responds in one language.
    recognition.lang =
      language === "hi"
        ? "hi-IN"
        : language === "mr"
        ? "mr-IN"
        : language === "auto" && /^(hi|mr)-/i.test(navigator.language)
        ? navigator.language
        : "en-IN";

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      recognitionRunningRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = async (event) => {
      if (processingRef.current) return;

      const text =
        event.results[0][0].transcript.trim();

      if (!text) return;

      processingRef.current = true;

      setIsListening(false);
      setIsThinking(true);

      try {
        recognition.stop();
      } catch (err) {
        console.log(err);
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text,
        },
      ]);
      await saveChatMessage("user", text);
      await updateChatTitle(text);

      try {
        const response = await fetch(
          `${API}/ai/process`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              language,
              account_id: user.id,
              chat_id: selectedChatId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "AI request failed"
          );
        }

        const replyText =
          getAIReplyText(data);

        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: replyText,
          },
        ]);
        await saveChatMessage("assistant", replyText);

        fetchSummary();
        fetchTransactions();

        await speakResponse(replyText, data.response_language || language);
      } catch (err) {
        console.error(
          "AI process error:",
          err
        );

        const isIncompleteItemError = err.message?.toLowerCase().includes("product and quantity");
        const errorReply = isIncompleteItemError
          ? language === "hi"
            ? "कृपया सामान और उसकी मात्रा बताइए।"
            : language === "mr"
            ? "कृपया सामान आणि त्याचे प्रमाण सांगा."
            : "Please tell me the product and quantity."
          : err.message && err.message !== "AI request failed"
          ? err.message
          : language === "hi"
          ? "माफ़ कीजिए, कोई त्रुटि हुई।"
          : language === "mr"
          ? "माफ करा, काहीतरी चूक झाली।"
          : "Sorry, an error occurred.";

        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: errorReply,
          },
        ]);

        await speakResponse(errorReply);
      } finally {
        setIsThinking(false);
        processingRef.current = false;

        if (activeRef.current) {
          restartTimerRef.current =
            setTimeout(() => {
              restartTimerRef.current = null;
              startRecognition();
            }, 700);
        }
      }
    };

    recognition.onerror = (e) => {
      console.log(
        "Recognition note:",
        e.error
      );

      recognitionRunningRef.current = false;
      setIsListening(false);

      if (
        activeRef.current &&
        !processingRef.current
      ) {
        restartTimerRef.current =
          setTimeout(() => {
            restartTimerRef.current = null;
            startRecognition();
          }, 800);
      }
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      setIsListening(false);

      if (
        activeRef.current &&
        !processingRef.current &&
        !restartTimerRef.current
      ) {
        restartTimerRef.current =
          setTimeout(() => {
            restartTimerRef.current = null;
            startRecognition();
          }, 500);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(
        "Recognition start error:",
        err
      );

      recognitionRunningRef.current = false;

      if (activeRef.current) {
        restartTimerRef.current =
          setTimeout(() => {
            restartTimerRef.current = null;
            startRecognition();
          }, 1000);
      }
    }
  };

  /* =========================================================
     START CONVERSATION
  ========================================================= */

  const startConversation = () => {
    if (activeRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t.notSupported);
      return;
    }

    window.speechSynthesis.cancel();

    activeRef.current = true;
    processingRef.current = false;

    setIsConversationActive(true);
    setIsThinking(false);

    startRecognition();
  };

  /* =========================================================
     STOP CONVERSATION
  ========================================================= */

  const stopConversation = () => {
    activeRef.current = false;
    processingRef.current = false;
    recognitionRunningRef.current = false;

    setIsConversationActive(false);
    setIsListening(false);
    setIsThinking(false);

    if (restartTimerRef.current) {
      clearTimeout(
        restartTimerRef.current
      );

      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.log(err);
      }

      recognitionRef.current = null;
    }

    window.speechSynthesis.cancel();
  };

  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {
    return () => {
      activeRef.current = false;

      if (restartTimerRef.current) {
        clearTimeout(
          restartTimerRef.current
        );
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log(err);
        }
      }

      window.speechSynthesis.cancel();
    };
  }, []);

  /* =========================================================
     REAL DASHBOARD VALUES
  ========================================================= */

  const displaySales = Number(
    summary?.total_sales || 0
  ).toLocaleString("en-IN");

  const displayCollected = Number(
    summary?.total_collected || 0
  ).toLocaleString("en-IN");

  const displayPending = Number(
    summary?.total_pending || 0
  ).toLocaleString("en-IN");

  /* =========================================================
     RECENT TRANSACTIONS
  ========================================================= */

  const recentTransactions =
    transactions.slice(-4).reverse();

  /* =========================================================
     PAGE NAVIGATION
  ========================================================= */

  const goToPage = (page) => {
    setActivePage(page);
  };

  return (
    <div className="app-shell">

      {/* =====================================================
          HEADER DECORATIONS
      ===================================================== */}

      <img
        src={headerTopCenter}
        className="header-garland garland-center"
        alt=""
        aria-hidden="true"
      />

      <img
        src={headerTopRight}
        className="header-garland garland-right"
        alt=""
        aria-hidden="true"
      />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="main-header">

        <div className="brand">

          <div className="brand-icon-wrapper">
            <img
              src={logoLotus}
              alt="DukaanSaathi Logo"
              className="brand-lotus-img"
            />
          </div>

          <div className="brand-text">
            <h1 className="brand-title">
              DukaanSaathi
            </h1>

            <p className="brand-tagline">
              {t.tagline}
            </p>
          </div>

        </div>

        <div className="header-actions">

          <button
            className="header-date-badge header-date-button"
            onClick={() => setActivePage("khata")}
            aria-label="Open Khata date view"
            title="Open Khata"
          >

            <div className="header-cal-icon">
              <Calendar
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <div className="header-date-info">
              <span className="header-day-str">
                {headerDateStr}
              </span>

              <strong className="header-time-str">
                {formattedTime}
              </strong>
            </div>

          </button>

          <div className="header-lang-wrapper">

            <select
              className="header-lang-select"
              value={language}
              disabled={isConversationActive}
              onChange={(e) => {
                const newLang =
                  e.target.value;

                setLanguage(newLang);
                onLanguageChange(newLang);
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

            <ChevronDown
              size={15}
              className="lang-select-arrow"
              strokeWidth={2.2}
            />

          </div>

        </div>

      </header>

      {/* =====================================================
          INNER DASHBOARD PAGE
      ===================================================== */}

      {activePage !== "home" && (
        <DashboardPages
          page={activePage}
          language={language}
          user={user}
          shopData={shopData}
          onBack={() =>
            setActivePage("home")
          }
          onPageChange={setActivePage}
          onLogout={onLogout}
          onLanguageChange={onLanguageChange}
        />
      )}

      {/* =====================================================
          HOME DASHBOARD
      ===================================================== */}

      <main
        className={`dashboard-grid ${
          activePage !== "home"
            ? "dashboard-grid-hidden"
            : ""
        }`}
      >

        {/* ===================================================
            LEFT SIDEBAR
        =================================================== */}

        <aside className="left-sidebar">

          <nav className="nav-menu">

            <button
              className={`nav-item ${
                activePage === "home"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                goToPage("home")
              }
            >
              <Home
                size={18}
                strokeWidth={2}
              />
              <span>{t.home}</span>
            </button>

            <button
              className="nav-item"
              onClick={() =>
                goToPage("khata")
              }
            >
              <Notebook
                size={18}
                strokeWidth={1.8}
              />
              <span>{t.khata}</span>
            </button>

            <button
              className="nav-item"
              onClick={() =>
                goToPage("customers")
              }
            >
              <Users
                size={18}
                strokeWidth={1.8}
              />
              <span>{t.customers}</span>
            </button>

            <button
              className="nav-item"
              onClick={() =>
                goToPage("stock")
              }
            >
              <Package
                size={18}
                strokeWidth={1.8}
              />
              <span>{t.stock}</span>
            </button>

            <button
              className="nav-item"
              onClick={() =>
                goToPage("more")
              }
            >
              <MoreHorizontal
                size={18}
                strokeWidth={2}
              />
              <span>{t.more}</span>
            </button>

          </nav>

          <section className="chat-history-panel" aria-label="Chat history">
            <button className="new-chat-button" onClick={createNewChat}>
              <Plus size={16} />
              <span>New Chat</span>
            </button>

            <label className="chat-search-field">
              <Search size={14} />
              <input
                value={chatSearch}
                onChange={(event) => setChatSearch(event.target.value)}
                placeholder="Search chats"
                aria-label="Search chats"
              />
            </label>

            {Object.entries(groupedChats).map(([group, groupChats]) => (
              groupChats.length > 0 && (
                <div className="chat-history-group" key={group}>
                  <span className="chat-history-label">{group}</span>
                  {groupChats.map((chat) => (
                    <div
                      className={`chat-history-item ${selectedChatId === chat.id ? "selected" : ""}`}
                      key={chat.id}
                    >
                      <button
                        className="chat-history-open"
                        onClick={() => loadChatDetails(chat.id)}
                        title={chat.title}
                      >
                        <MessageSquare size={13} />
                        <span>{chat.title}</span>
                      </button>
                      <button
                        className="chat-delete-button"
                        onClick={() => deleteChat(chat.id)}
                        aria-label={`Delete ${chat.title}`}
                        title="Delete chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            ))}
          </section>

          <div className="sidebar-footer-art">

            <img
              src={sidebarShop}
              className="sidebar-shop-img"
              alt=""
            />

            <img
              src={sidebarVine}
              className="sidebar-vine-img"
              alt=""
              aria-hidden="true"
            />

          </div>

        </aside>

        {/* ===================================================
            CENTER
        =================================================== */}

        <section className="center-content">

          {/* HERO */}

          <div className="hero-card">

            <img
              src={heroLotus}
              className="hero-lotus-img"
              alt=""
              aria-hidden="true"
            />

            <div className="hero-text-side">

              <span className="hero-greeting">
                {t.greeting}
              </span>

              <h2 className="hero-question">
                {t.question1}
                <br />
                {t.question2}
              </h2>

              <p className="hero-subtitle">
                {t.hint}
              </p>

              <div className="hero-accent-strokes">
                <span className="stroke-long"></span>
                <span className="stroke-short"></span>
              </div>

            </div>

            {/* MIC */}

            <div className="hero-mic-center">

              <div className="mandala-container">

                <img
                  src={mandalaSvg}
                  className={`mandala-bg ${
                    isListening
                      ? "mandala-spin"
                      : ""
                  }`}
                  alt=""
                  aria-hidden="true"
                />

                <button
                  className={`hero-mic-circle ${
                    isConversationActive
                      ? "mic-live-pulse"
                      : ""
                  }`}
                  onClick={
                    isConversationActive
                      ? stopConversation
                      : startConversation
                  }
                  title={
                    isConversationActive
                      ? t.stop
                      : t.start
                  }
                >
                  <Mic
                    size={30}
                    color="#ffffff"
                    strokeWidth={2.2}
                  />
                </button>

              </div>

              <div className="hero-mic-status-pill">

                <span
                  className={`status-indicator-dot ${
                    isConversationActive
                      ? "dot-live"
                      : "dot-idle"
                  }`}
                ></span>

                <span className="status-text">
                  {isThinking
                    ? t.thinking
                    : isListening
                    ? t.listening
                    : t.ready}
                </span>

              </div>

              <button
                className={`hero-action-pill ${
                  isConversationActive
                    ? "btn-stop"
                    : "btn-start"
                }`}
                onClick={
                  isConversationActive
                    ? stopConversation
                    : startConversation
                }
              >
                <Mic
                  size={16}
                  strokeWidth={2.2}
                />

                <span>
                  {isConversationActive
                    ? t.stop
                    : t.start}
                </span>
              </button>

            </div>

            <div className="hero-shop-side">

              <img
                src={heroShop}
                className="hero-shop-img"
                alt=""
              />

            </div>

          </div>

          {/* =================================================
              CONVERSATION
          ================================================= */}

          <div className="card-box conversation-card">

            <div className="card-header">

              <div className="card-title-group">

                <MessageSquare
                  size={18}
                  className="card-header-icon"
                  strokeWidth={2}
                />

                <h3>{t.conversation}</h3>

              </div>

              <div className="card-header-badge">
                <span className="live-badge-dot">
                  ●
                </span>

                <span className="live-badge-text">
                  LIVE
                </span>
              </div>

            </div>

            <div className="conversation-body-wrap">

              <img
                src={convCornerLeaf}
                className="conv-corner-leaf leaf-left"
                alt=""
                aria-hidden="true"
              />

              <img
                src={convCornerLeaf}
                className="conv-corner-leaf leaf-right"
                alt=""
                aria-hidden="true"
              />

              {messages.length === 0 ? (
                <div className="conv-empty-state">

                  <div className="conv-empty-illustration-wrap">

                    <img
                      src={convLotusWave}
                      className="conv-empty-lotus-img"
                      alt=""
                      aria-hidden="true"
                    />

                  </div>

                  <h4 className="conv-empty-title">
                    {t.noConversationTitle}
                  </h4>

                  <p className="conv-empty-sub">
                    {t.noConversationSub}
                  </p>

                </div>
              ) : (
                <div className="conv-message-list">

                  {messages.map(
                    (msg, index) => (
                      <div
                        key={index}
                        className={`conv-bubble-row ${
                          msg.sender ===
                          "user"
                            ? "row-user"
                            : "row-assistant"
                        }`}
                      >

                        <div className="bubble-avatar">
                          {msg.sender ===
                          "user"
                            ? "👤"
                            : "🪷"}
                        </div>

                        <div className="bubble-box">

                          <span className="bubble-speaker">
                            {msg.sender ===
                            "user"
                              ? "आप (You)"
                              : "DukaanSaathi"}
                          </span>

                          <p className="bubble-text">
                            {msg.text}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="card-box quick-actions-container">

            <div className="quick-actions-header">

              <img
                src={quickHeaderIcon}
                className="quick-header-icon-img"
                alt=""
                aria-hidden="true"
              />

              <h3>{t.quickActions}</h3>

            </div>

            <div className="quick-actions-grid">

              <button
                className="quick-action-item"
                onClick={() =>
                  goToPage("customers")
                }
              >
                <div className="quick-icon-box">
                  <Users
                    size={18}
                    strokeWidth={1.8}
                  />
                </div>

                <span className="quick-action-label">
                  {t.addCustomer}
                </span>

                <span className="quick-action-sign">
                  +
                </span>
              </button>

              <button
                className="quick-action-item"
                onClick={() =>
                  goToPage("stock")
                }
              >
                <div className="quick-icon-box">
                  <Package
                    size={18}
                    strokeWidth={1.8}
                  />
                </div>

                <span className="quick-action-label">
                  {t.addProduct}
                </span>

                <span className="quick-action-sign">
                  +
                </span>
              </button>

              <button
                className="quick-action-item"
                onClick={() =>
                  goToPage("khata")
                }
              >
                <div className="quick-icon-box">
                  <Notebook
                    size={18}
                    strokeWidth={1.8}
                  />
                </div>

                <span className="quick-action-label">
                  {t.viewKhata}
                </span>

                <span className="quick-action-arrow">
                  →
                </span>
              </button>

            </div>

          </div>

        </section>

        {/* ===================================================
            RIGHT PANEL
        =================================================== */}

        <aside className="right-panel">

          {/* DATE */}

          <div className="card-box date-widget-card">

            <img
              src={floralWatermark}
              className="date-watermark-bg"
              alt=""
              aria-hidden="true"
            />

            <div className="card-header borderless">

              <div className="card-title-group">

                <Calendar
                  size={18}
                  className="card-header-icon"
                  strokeWidth={2}
                />

                <h3>{t.todayDate}</h3>

              </div>

            </div>

            <div className="date-widget-body">

              <p className="date-widget-date">
                {rightCardDateStr}
              </p>

              <p className="date-widget-day">
                {rightCardDayStr}
              </p>

              <div className="date-widget-time">
                {formattedTime}
              </div>

              <div className="date-widget-greeting">
                <span className="greeting-sun">
                  ☀️
                </span>

                <span className="greeting-text">
                  {greeting}
                </span>

                <span className="greeting-leaf">
                  🌿
                </span>
              </div>

            </div>

          </div>

          {/* SUMMARY */}

          <div className="card-box summary-widget-card">

            <img
              src={floralWatermark}
              className="summary-watermark-bg"
              alt=""
              aria-hidden="true"
            />

            <div className="card-header borderless">

              <div className="card-title-group">

                <TrendingUp
                  size={18}
                  className="card-header-icon"
                  strokeWidth={2}
                />

                <h3>{t.today}</h3>

              </div>

            </div>

            <div className="summary-pills-list">

              <div className="summary-pill pill-sales">

                <div className="pill-left">

                  <div className="pill-icon-square icon-sales">
                    <ShoppingBag
                      size={17}
                      strokeWidth={2}
                    />
                  </div>

                  <span className="pill-name">
                    {t.sales}
                  </span>

                </div>

                <strong className="pill-amount">
                  ₹ {displaySales}
                </strong>

              </div>

              <div className="summary-pill pill-collected">

                <div className="pill-left">

                  <div className="pill-icon-square icon-collected">
                    <Check
                      size={17}
                      strokeWidth={2.6}
                    />
                  </div>

                  <span className="pill-name">
                    {t.collected}
                  </span>

                </div>

                <strong className="pill-amount">
                  ₹ {displayCollected}
                </strong>

              </div>

              <div className="summary-pill pill-pending">

                <div className="pill-left">

                  <div className="pill-icon-square icon-pending">
                    <Clock
                      size={17}
                      strokeWidth={2}
                    />
                  </div>

                  <span className="pill-name">
                    {t.pending}
                  </span>

                </div>

                <strong className="pill-amount">
                  ₹ {displayPending}
                </strong>

              </div>

            </div>

          </div>

          {/* RECENT TRANSACTIONS */}

          <div className="card-box recent-widget-card">

            <div className="card-header borderless recent-header">

              <div className="card-title-group">

                <Notebook
                  size={18}
                  className="card-header-icon"
                  strokeWidth={2}
                />

                <h3>{t.recent}</h3>

              </div>

              <button
                className="khata-link"
                onClick={() =>
                  goToPage("khata")
                }
              >
                {t.viewKhata}
                <span className="link-arrow">
                  →
                </span>
              </button>

            </div>

            <div className="recent-tx-list">

              {recentTransactions.length ===
              0 ? (
                <div className="recent-empty">
                  {t.noTransactions}
                </div>
              ) : (
                recentTransactions.map(
                  (tx) => {

                    const initial =
                      tx.customer
                        ?.charAt(0)
                        ?.toUpperCase() ||
                      "C";

                    const itemsText =
                      tx.items
                        ?.map(
                          (item) =>
                            `${item.quantity} ${
                              item.unit || ""
                            } ${displayProductName(item.product, language)}`
                        )
                        .join(", ") ||
                      "";

                    const status =
                      tx.payment_status ||
                      "pending";

                    const statusLabel =
                      status === "paid"
                        ? t.paid
                        : status ===
                          "credit"
                        ? t.credit
                        : t.partial;

                    return (
                      <div
                        key={tx._id}
                        className="recent-tx-row"
                      >

                        <div className="recent-avatar-circle">
                          {initial}
                        </div>

                        <div className="recent-details">

                          <strong className="recent-customer-name">
                            {displayCustomerName(tx.customer, language)}
                          </strong>

                          <span className="recent-items-text">
                            {itemsText}
                          </span>

                        </div>

                        <div className="recent-amount-col">

                          <strong className="recent-price">
                            ₹
                            {Number(
                              tx.total_amount ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                          <span
                            className={`recent-status-tag status-${status}`}
                          >
                            {statusLabel}
                          </span>

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

          </div>

        </aside>

      </main>

      {/* =====================================================
          BOTTOM BAR
      ===================================================== */}

      <div className="floating-bottom-bar">

        <button
          className={`bottom-pill-btn ${
            activePage === "home"
              ? "active"
              : ""
          }`}
          onClick={() =>
            goToPage("home")
          }
        >
          <Home
            size={18}
            strokeWidth={2}
          />

          <span>{t.navHome}</span>
        </button>

        <button
          className="bottom-pill-btn"
          onClick={() =>
            goToPage("khata")
          }
        >
          <Notebook
            size={18}
            strokeWidth={1.8}
          />

          <span>{t.navKhata}</span>
        </button>

        <button
          className="bottom-pill-mic"
          onClick={
            isConversationActive
              ? stopConversation
              : startConversation
          }
          title={
            isConversationActive
              ? t.stop
              : t.start
          }
        >
          <Mic
            size={19}
            color="#ffffff"
            strokeWidth={2.4}
          />
        </button>

        <button
          className="bottom-pill-btn"
          onClick={() =>
            goToPage("customers")
          }
        >
          <Users
            size={18}
            strokeWidth={1.8}
          />

          <span>{t.navCust}</span>
        </button>

        <button
          className="bottom-pill-btn"
          onClick={() =>
            goToPage("more")
          }
        >
          <MoreHorizontal
            size={18}
            strokeWidth={2}
          />

          <span>{t.navMore}</span>
        </button>

      </div>

    </div>
  );
}

export default App;
