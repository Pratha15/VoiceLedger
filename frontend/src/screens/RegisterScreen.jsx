import { useState } from "react";
import {
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Store,
  Globe,
  ChevronDown,
} from "lucide-react";
import "./Auth.css";
import logoLotus from "../assets/decorations/logo-lotus.png";
import headerTopRight from "../assets/decorations/header-top-right.png";
import sidebarShop from "../assets/decorations/sidebar-shop.png";
import heroLotus from "../assets/decorations/hero-lotus.png";
import { AUTH_LANGUAGES, getAuthTranslations } from "./authTranslations";

const SHOP_TYPES = [
  "General Store",
  "Grocery / Kirana",
  "Medical / Pharmacy",
  "Electronics",
  "Clothing & Textiles",
  "Stationery",
  "Hardware",
  "Dairy & Milk",
  "Bakery",
  "Other",
];

const LANGUAGES = [
  { value: "hi", label: "Hindi" },
  { value: "en", label: "English" },
  { value: "mr", label: "Marathi" },
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Bengali",
];

export default function RegisterScreen({
  onRegister,
  onLogin,
  language,
  onLanguageChange,
}) {
  const [form, setForm] = useState({
    shopkeeperName: "",
    mobile: "",
    password: "",
    shopName: "",
    shopType: "",
    language: "hi",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const t = getAuthTranslations(language);

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    update("mobile", value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Mobile validation
    if (!/^\d{10}$/.test(form.mobile)) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    // Password validation
    if (!validatePassword(form.password)) {
      setError(
        "Password must be at least 8 characters and contain uppercase, lowercase, number and special character."
      );
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/accounts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopkeeper_name: form.shopkeeperName.trim(),
          mobile: form.mobile,
          password: form.password,
          shop_name: form.shopName.trim(),
          shop_type: form.shopType,
          language: form.language,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Unable to create account");
      }
      onRegister(data);
    } catch (registerError) {
      setError(registerError.message);
    }
  };

  return (
    <div className="auth-shell">
      <img
        src={headerTopRight}
        className="auth-leaf-tr"
        alt=""
        aria-hidden="true"
      />

      <img
        src={headerTopRight}
        className="auth-leaf-tl"
        alt=""
        aria-hidden="true"
      />

      <div className="auth-topbar">
        <label className="auth-lang-btn">
          <Globe size={14} />

          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label="Language"
          >
            {AUTH_LANGUAGES.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="register-screen">

        {/* LEFT ILLUSTRATION */}
        <div className="register-left">

          <div className="login-brand">
            <div className="login-brand-row">
              <img
                src={logoLotus}
                className="login-logo"
                alt="DukaanSaathi logo"
              />

              <span className="login-brand-name">
                DukaanSaathi
              </span>
            </div>

            <p className="login-tagline">
              {t.tagline}
            </p>
          </div>

          <img
            src={sidebarShop}
            className="register-illustration"
            alt="Shop illustration"
          />

          <img
            src={heroLotus}
            style={{
              width: 140,
              opacity: 0.75,
            }}
            alt=""
            aria-hidden="true"
          />
        </div>

        {/* RIGHT FORM */}
        <div className="register-right">

          <form
            className="auth-card auth-card-scroll"
            onSubmit={handleSubmit}
          >
            <h1 className="auth-card-title">
              {t.createTitle}
            </h1>

            <p className="auth-card-subtitle">
              {t.createSubtitle}
            </p>

            {/* SHOPKEEPER NAME */}
            <div className="auth-field">
              <div className="auth-field-icon">
                <User size={17} />
              </div>

              <input
                type="text"
                className="auth-input"
                placeholder="Your name"
                value={form.shopkeeperName}
                onChange={(e) =>
                  update("shopkeeperName", e.target.value)
                }
                required
              />
            </div>

            {/* MOBILE */}
            <div className="auth-field">
              <div className="auth-field-icon">
                <Phone size={17} />
              </div>

              <span className="auth-prefix">
                +91
              </span>

              <input
                type="tel"
                inputMode="numeric"
                className="auth-input has-prefix"
                placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={handleMobileChange}
                maxLength={10}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="auth-field">
              <div className="auth-field-icon">
                <Lock size={17} />
              </div>

              <input
                type={showPwd ? "text" : "password"}
                className="auth-input"
                placeholder="Create password"
                value={form.password}
                onChange={(e) =>
                  update("password", e.target.value)
                }
                required
              />

              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPwd(!showPwd)}
                aria-label="Toggle password visibility"
              >
                {showPwd ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {/* PASSWORD RULES */}
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-light)",
                marginTop: "-6px",
                marginBottom: "14px",
                lineHeight: "1.6",
              }}
            >
              Password: 8+ characters, uppercase, lowercase,
              number & special character.
            </div>

            {/* SHOP NAME */}
            <div className="auth-field">
              <div className="auth-field-icon">
                <Store size={17} />
              </div>

              <input
                type="text"
                className="auth-input"
                placeholder="Shop name"
                value={form.shopName}
                onChange={(e) =>
                  update("shopName", e.target.value)
                }
                required
              />
            </div>

            {/* SHOP TYPE */}
            <div
              className="auth-field"
              style={{ position: "relative" }}
            >
              <div className="auth-field-icon">
                <Store size={17} />
              </div>

              <select
                className="auth-select"
                value={form.shopType}
                onChange={(e) =>
                  update("shopType", e.target.value)
                }
                required
              >
                <option value="" disabled>
                  {t.shopType}
                </option>

                {SHOP_TYPES.map((shopType) => (
                  <option
                    key={shopType}
                    value={shopType}
                  >
                    {shopType}
                  </option>
                ))}
              </select>

              <div
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "var(--text-light)",
                }}
              >
                <ChevronDown size={16} />
              </div>
            </div>

            {/* LANGUAGE */}
            <div
              className="auth-field"
              style={{ position: "relative" }}
            >
              <div className="auth-field-icon">
                <Globe size={17} />
              </div>

              <select
                className="auth-select"
                value={form.language}
                onChange={(e) =>
                  update("language", e.target.value)
                }
              >
                {LANGUAGES.map((item) => (
                  <option
                    key={item.value || item}
                    value={item.value || item}
                  >
                    {item.label || item}
                  </option>
                ))}
              </select>

              <div
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "var(--text-light)",
                }}
              >
                <ChevronDown size={16} />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div
                style={{
                  background: "#fff1f0",
                  border: "1px solid #f0c8c4",
                  color: "#a33a32",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  marginBottom: "14px",
                  lineHeight: "1.4",
                }}
              >
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="auth-btn-primary"
              style={{ marginTop: 8 }}
            >
              {t.create}
            </button>

            {/* LOGIN */}
            <div
              className="auth-link-row"
              style={{ marginTop: 14 }}
            >
              {t.alreadyAccount}{" "}
              <button
                type="button"
                className="auth-link-btn"
                onClick={onLogin}
              >
                {t.backToLogin}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* FOOTER */}
      <div className="auth-footer">
        <img src={logoLotus} alt="" />
        DukaanSaathi &nbsp;|&nbsp; {t.footer}
      </div>
    </div>
  );
}