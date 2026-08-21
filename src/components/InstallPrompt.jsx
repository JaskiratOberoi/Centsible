import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SNOOZE_KEY = 'centsible-install-snooze'
const SNOOZE_DAYS = 7

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isMobile = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent)

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null) // Android beforeinstallprompt event
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isStandalone() || !isMobile()) return
    const snoozed = () =>
      Date.now() - (+localStorage.getItem(SNOOZE_KEY) || 0) < SNOOZE_DAYS * 864e5
    if (snoozed()) return

    let timer, fallback
    const onPrompt = (e) => {
      e.preventDefault()
      clearTimeout(fallback)
      setDeferred(e)
      // re-check at fire time: the event can arrive again after a dismiss
      timer = setTimeout(() => { if (!snoozed()) setShow(true) }, 1800)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    if (isIOS()) {
      // iOS never fires beforeinstallprompt — show manual instructions instead
      timer = setTimeout(() => { if (!snoozed()) setShow(true) }, 1800)
    } else {
      // Android: Chrome sometimes withholds the event — fall back to
      // menu instructions so the sheet still appears
      fallback = setTimeout(() => { if (!snoozed()) setShow(true) }, 5000)
    }

    const onInstalled = () => { setShow(false); setDeferred(null) }
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      clearTimeout(timer)
      clearTimeout(fallback)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()))
    setShow(false)
  }

  async function install() {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setShow(false)
    else dismiss()
    setDeferred(null)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="install-sheet"
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 140, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          role="dialog"
          aria-label="Install Centsible"
        >
          <div className="is-coin">¢</div>
          <div className="is-copy">
            <b>Add Centsible to your phone</b>
            {deferred ? (
              <span>One tap — works offline, opens full-screen.</span>
            ) : isIOS() ? (
              <span>
                Tap{' '}
                <svg className="is-glyph" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share">
                  <path d="M12 3v11M8.5 6.5 12 3l3.5 3.5" />
                  <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
                </svg>{' '}
                Share, then <b>Add to Home Screen</b>.
              </span>
            ) : (
              <span>
                Open the browser menu <b>⋮</b> and choose <b>Add to Home screen</b>.
              </span>
            )}
          </div>
          {deferred && (
            <button className="btn small" onClick={install}>Install</button>
          )}
          <button className="is-close" onClick={dismiss} aria-label="Not now">✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
