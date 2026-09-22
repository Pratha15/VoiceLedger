import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LoginScreen from './screens/LoginScreen.jsx'
import RegisterScreen from './screens/RegisterScreen.jsx'
import ShopSetupScreen from './screens/ShopSetupScreen.jsx'

const API = 'http://127.0.0.1:8000'
const ACCOUNT_SESSION_KEY = 'dukaansaathi-account-id'

/**
 * DukaanSaathi — Root Renderer
 *
 * Screen states:
 *   'login'      → LoginScreen
 *   'register'   → RegisterScreen
 *   'shop-setup' → ShopSetupScreen
 *   'dashboard'  → App (full dashboard)
 */
function Root() {
  const normalizeLanguage = (value) => {
    const languageMap = {
      Hindi: 'hi',
      English: 'en',
      Marathi: 'mr',
    }

    return languageMap[value] || value || 'en'
  }

  const toUser = (account) => ({
    ...account,
    name: account.shopkeeperName,
    shop: account.shopName,
  })

  const [screen, setScreen] = useState('restoring')
  const [user, setUser] = useState(null)        // shopkeeper profile
  const [shopData, setShopData] = useState(null) // shop details from setup
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    const accountId = localStorage.getItem(ACCOUNT_SESSION_KEY)
    if (!accountId) {
      setScreen('login')
      return
    }

    fetch(`${API}/accounts/${accountId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired')
        return response.json()
      })
      .then((account) => {
        setUser(toUser(account))
        setLanguage(normalizeLanguage(account.language))
        setScreen('dashboard')
      })
      .catch(() => {
        localStorage.removeItem(ACCOUNT_SESSION_KEY)
        setScreen('login')
      })
  }, [])

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage)
    setUser((currentUser) => currentUser ? { ...currentUser, language: nextLanguage } : currentUser)

    const accountId = localStorage.getItem(ACCOUNT_SESSION_KEY)
    if (accountId) {
      fetch(`${API}/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: nextLanguage }),
      }).catch(() => {})
    }
  }

  const handleLogin = (loginData) => {
    const accountLanguage = normalizeLanguage(loginData.language)
    localStorage.setItem(ACCOUNT_SESSION_KEY, loginData.id)
    setUser(toUser(loginData))
    setLanguage(accountLanguage)
    setScreen('dashboard')
}

  // ── Register → Shop Setup ───────────────────────────────────
  const handleRegister = (formData) => {
    const accountLanguage = normalizeLanguage(formData.language)
    localStorage.setItem(ACCOUNT_SESSION_KEY, formData.id)
    setUser(toUser(formData))
    setLanguage(accountLanguage)
    setScreen('shop-setup')
}

  // ── Shop Setup → Dashboard ──────────────────────────────────
  const handleShopSetupComplete = async (setupData) => {
    setShopData(setupData)
    if (user?.id) {
      const response = await fetch(`${API}/accounts/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: setupData.shopName,
          shop_type: setupData.shopType,
          address: setupData.address,
        }),
      })
      if (response.ok) setUser(toUser(await response.json()))
    }
    setScreen('dashboard')
  }

  // ── Logout ──────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem(ACCOUNT_SESSION_KEY)
    setUser(null)
    setShopData(null)
    setScreen('login')
  }

  if (screen === 'restoring') {
    return <div className="auth-shell">Restoring your account...</div>
  }

  // ── Render correct screen ───────────────────────────────────
  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onRegister={() => setScreen('register')}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    )
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        onRegister={handleRegister}
        onLogin={() => setScreen('login')}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    )
  }

  if (screen === 'shop-setup') {
    return (
      <ShopSetupScreen
        userData={user}
        onComplete={handleShopSetupComplete}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    )
  }

  // Dashboard
  return (
    <App
      user={user}
      shopData={shopData}
      onLogout={handleLogout}
      onLanguageChange={handleLanguageChange}
    />
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
