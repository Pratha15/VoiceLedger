import { useState } from "react";
import { Phone, Lock, Eye, EyeOff, Globe, ShieldCheck, UserPlus, ArrowRight, Mic, BookOpen, Users, Package } from "lucide-react";
import "./Auth.css";
import logoLotus from "../assets/decorations/logo-lotus.png";
import headerTopRight from "../assets/decorations/header-top-right.png";
import heroShop from "../assets/decorations/hero-shop.png";
import { AUTH_LANGUAGES, getAuthTranslations } from "./authTranslations";

export default function LoginScreen({ onLogin, onRegister, language, onLanguageChange }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = getAuthTranslations(language);

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setIsSubmitting(true);

  try {
    const response = await fetch("http://127.0.0.1:8000/accounts/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Unable to log in");
    }
    onLogin(data);
  } catch (loginError) {
    setError(loginError.message);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="auth-shell">
      {/* Botanical corners */}
      <img src={headerTopRight} className="auth-leaf-tr" alt="" aria-hidden="true" />
      <img src={headerTopRight} className="auth-leaf-tl" alt="" aria-hidden="true" />

      {/* Language selector */}
      <div className="auth-topbar">
        <label className="auth-lang-btn">
          <Globe size={14} />
          <select value={language} onChange={(e) => onLanguageChange(e.target.value)} aria-label="Language">
            {AUTH_LANGUAGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {/* Main 2-col layout */}
      <div className="login-screen">
        {/* LEFT PANEL */}
        <div className="login-left">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-row">
              <img src={logoLotus} className="login-logo" alt="DukaanSaathi logo" />
              <span className="login-brand-name">DukaanSaathi</span>
            </div>
            <p className="login-tagline">{t.tagline}</p>
            <p className="login-promise">{t.promise}</p>
          </div>

          {/* Feature pills */}
          <div className="login-features">
            {[
              { icon: Mic, label: t.featureVoice },
              { icon: BookOpen, label: t.featureKhata },
              { icon: Users, label: t.featureCustomers },
              { icon: Package, label: t.featureStock },
            ].map((f) => (
              <div className="login-feature-pill" key={f.label}>
                <div className="feat-icon"><f.icon size={17} /></div>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Illustration */}
          <img
            src={heroShop}
            className="login-illustration"
            alt="Kirana shopkeeper illustration"
          />

        </div>

        {/* RIGHT PANEL — Login card */}
        <div className="login-right">
          <form className="auth-card" onSubmit={handleLogin}>
            <h1 className="auth-card-title">{t.welcome}</h1>
            <p className="auth-card-subtitle">{t.loginSubtitle}</p>
            {error && <p className="auth-error">{error}</p>}

            {/* Mobile Number */}
            <div className="auth-field">
              <div className="auth-field-icon">
                <Phone size={17} />
              </div>
              <span className="auth-prefix">+91</span>
              <input
                type="tel"
                className="auth-input has-prefix"
                placeholder={t.mobilePlaceholder}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={10}
                required
              />
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-field-icon">
                <Lock size={17} />
              </div>
              <input
                type={showPwd ? "text" : "password"}
                className="auth-input"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPwd(!showPwd)}
                aria-label="Toggle password visibility"
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Remember + Forgot */}
            <div className="auth-row">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                {t.remember}
              </label>
              <a href="#" className="auth-forgot">{t.forgot}</a>
            </div>

            {/* Login button */}
            <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : t.login} <ArrowRight size={18} />
            </button>

            {/* OR divider */}
            <div className="auth-divider">{t.or}</div>

            {/* Create account */}
            <button type="button" className="auth-btn-outline" onClick={onRegister}>
              <UserPlus size={18} />
              {t.createAccount}
            </button>

            {/* Trust badges */}
            <div className="auth-trust">
              <div className="auth-trust-item">
                <ShieldCheck size={14} /> {t.secure}
              </div>
              <div className="auth-trust-sep" />
              <div className="auth-trust-item">
                <Lock size={14} /> {t.private}
              </div>
              <div className="auth-trust-sep" />
              <div className="auth-trust-item">
                <ShieldCheck size={14} /> {t.trusted}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-footer">
        <img src={logoLotus} alt="" />
        DukaanSaathi &nbsp;|&nbsp; {t.footer}
      </div>
    </div>
  );
}

