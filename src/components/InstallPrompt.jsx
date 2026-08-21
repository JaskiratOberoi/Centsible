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

    let timer
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      // re-check at fire time: the event can arrive again after a dismiss
      timer = setTimeout(() => { if (!snoozed()) setShow(true) }, 1800)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // iOS never fires beforeinstallprompt — show manual instructions instead
    if (isIOS()) timer = setTimeout(() => { if (!snoozed()) setShow(true) }, 1800)

    const onInstalled = () => { setShow(false); setDeferred(null) }
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      clearTimeout(timer)
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
            ) : (
              <span>
                Tap <span className="is-share" aria-label="Share">⎋</span> Share, then
                {' '}<b>Add to Home Screen</b>.
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
