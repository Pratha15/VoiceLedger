import { useState, useRef } from "react";
import { Store, MapPin, ChevronDown, Image, Globe } from "lucide-react";
import "./Auth.css";
import logoLotus from "../assets/decorations/logo-lotus.png";
import headerTopRight from "../assets/decorations/header-top-right.png";
import heroShop from "../assets/decorations/hero-shop.png";
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

export default function ShopSetupScreen({ userData, onComplete, language, onLanguageChange }) {
  const [shopName, setShopName] = useState(userData?.shopName || "");
  const [shopType, setShopType] = useState(userData?.shopType || "");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);
  const t = getAuthTranslations(language);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({ shopName, shopType, address, photo });
  };

  return (
    <div className="auth-shell">
      <img src={headerTopRight} className="auth-leaf-tr" alt="" aria-hidden="true" />
      <img src={headerTopRight} className="auth-leaf-tl" alt="" aria-hidden="true" />

      <div className="auth-topbar">
        <label className="auth-lang-btn">
          <Globe size={14} />
          <select value={language} onChange={(e) => onLanguageChange(e.target.value)} aria-label="Language">
            {AUTH_LANGUAGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div className="setup-screen">
        <form className="setup-card" onSubmit={handleSubmit}>
          {/* Brand */}
          <div className="setup-brand">
            <img src={logoLotus} className="setup-logo" alt="DukaanSaathi" />
            <span className="setup-brand-name">DukaanSaathi</span>
          </div>

          {/* Step bar */}
          <div className="setup-step-bar">
            <div className="setup-step-dot" />
            <div className="setup-step-dot" />
            <div className="setup-step-dot active" />
          </div>

          {/* Shop image */}
          <img
            src={heroShop}
            className="setup-illustration"
            alt="Shop illustration"
          />

          <h2 className="setup-title">{t.shopSetup}</h2>
          <p className="setup-subtitle">{t.shopSetupSubtitle}</p>

          {/* Shop Name */}
          <div className="auth-field">
            <div className="auth-field-icon"><Store size={17} /></div>
            <input
              type="text"
              className="auth-input"
              placeholder={t.shopName}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>

          {/* Shop Type */}
          <div className="auth-field" style={{ position: "relative" }}>
            <div className="auth-field-icon"><Store size={17} /></div>
            <select
              className="auth-select"
              value={shopType}
              onChange={(e) => setShopType(e.target.value)}
              required
            >
              <option value="" disabled>{t.shopType}</option>
              {SHOP_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-light)" }}>
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Shop Address */}
          <div className="auth-field">
            <div className="auth-field-icon" style={{ top: 16, transform: "none" }}>
              <MapPin size={17} />
            </div>
            <textarea
              className="auth-textarea"
              placeholder={t.shopAddress}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
            />
          </div>

          {/* Photo upload */}
          <div
            className="setup-photo-upload"
            onClick={() => fileRef.current.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current.click()}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              onChange={handlePhoto}
            />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Shop preview"
                style={{ height: 70, borderRadius: 8, objectFit: "cover" }}
              />
            ) : (
              <>
                <Image size={22} style={{ color: "var(--green-primary)", opacity: 0.7 }} />
                <span>{t.shopImage}</span>
              </>
            )}
          </div>

          {/* Next button */}
          <button type="submit" className="auth-btn-primary" style={{ marginTop: 4 }}>
            {t.next} →
          </button>
        </form>
      </div>

      <div className="auth-footer">
        <img src={logoLotus} alt="" />
        DukaanSaathi &nbsp;|&nbsp; {t.footer}
      </div>
    </div>
  );
}

