
import { useEffect, useState, useCallback, useRef } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'

import { api } from './api'
import { Ctx } from './ctx'

import { Nav, Footer, Modal } from './components'

import {
  Home,
  Memorials,
  Tributes,
  About,
  Contact,
  Login
} from './pages/Public'

import Admin from './admin/Admin'


/* =========================================
   APPLICATION LAYOUT
========================================= */

function AppLayout({ modal, setModal, msg }) {

  const location = useLocation()

  // Detect Admin page
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>

      {/* PUBLIC NAVIGATION */}
      {!isAdmin && <Nav />}

      {/* MAIN CONTENT */}
      <main className={isAdmin ? 'admin-main' : 'public-main'}>

        <Routes>

          {/* PUBLIC PAGES */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/memorials"
            element={<Memorials />}
          />

          <Route
            path="/memories"
            element={<Tributes kind="memories" />}
          />

          <Route
            path="/prayers"
            element={<Tributes kind="prayers" />}
          />

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />


          {/* ADMINISTRATOR LOGIN */}

          <Route
            path="/login"
            element={<Login />}
          />


          {/* ADMIN DASHBOARD */}

          <Route
            path="/admin"
            element={<Admin />}
          />


          {/* UNKNOWN ROUTES */}

          <Route
            path="*"
            element={<Home />}
          />

        </Routes>

      </main>


      {/* PUBLIC FOOTER */}
      {!isAdmin && <Footer />}


      {/* MODAL */}

      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal}
        </Modal>
      )}


      {/* TOAST NOTIFICATION */}

      {msg && (
        <div
          className="toast"
          role="status"
          aria-live="polite"
        >
          {msg}
        </div>
      )}

    </>
  )
}


/* =========================================
   MAIN APPLICATION
========================================= */

export default function App() {

  // ADMINISTRATOR
  const [user, setUser] = useState(null)

  // WEBSITE SETTINGS
  const [site, setSite] = useState({
    site_name: 'TriCore Memorial Website',
    hero_title: 'Forever Remembered, Never Forgotten.',
    tagline: 'Though they are no longer beside us, their memories will live forever in our hearts.'
  })

  // APPLICATION LOADING
  const [ready, setReady] = useState(false)

  // TOAST MESSAGE
  const [msg, setMsg] = useState('')
  const toastTimer = useRef(null)

  // MODAL
  const [modal, setModal] = useState(null)


  /* =========================================
     TOAST NOTIFICATION
  ========================================= */

  const toast = useCallback((message) => {

    setMsg(message)

    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }

    toastTimer.current = setTimeout(() => {
      setMsg('')
      toastTimer.current = null
    }, 3200)

  }, [])


  /* =========================================
     LOAD USER AND WEBSITE SETTINGS
  ========================================= */

  useEffect(() => {

    let active = true

    async function initialize() {

      try {

        const [authResult, settingsResult] =
          await Promise.allSettled([
            api.get('/auth/me'),
            api.get('/settings')
          ])

        if (!active) return

        // RESTORE ADMINISTRATOR SESSION

        if (authResult.status === 'fulfilled') {

          setUser(authResult.value?.user || null)

        } else {

          setUser(null)

        }


        // LOAD WEBSITE SETTINGS

        if (settingsResult.status === 'fulfilled') {

          setSite((previous) => ({
            ...previous,
            ...settingsResult.value
          }))

        }

      } finally {

        if (active) {
          setReady(true)
        }

      }

    }

    initialize()

    return () => {
      active = false
    }

  }, [])


  /* =========================================
     UPDATE BROWSER TAB TITLE
  ========================================= */

  useEffect(() => {

    document.title = site.site_name || 'TriCore Memorial'

  }, [site.site_name])


  /* =========================================
     CLEANUP TOAST TIMER
  ========================================= */

  useEffect(() => {

    return () => {

      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }

    }

  }, [])


  /* =========================================
     APPLICATION LOADING SCREEN
  ========================================= */

  if (!ready) {

    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center'
        }}
      >
        <p>Loading TriCore Memorial…</p>
      </div>
    )

  }


  /* =========================================
     APPLICATION CONTEXT
  ========================================= */

  return (

    <Ctx.Provider
      value={{
        user,
        setUser,
        site,
        setSite,
        toast,
        modal,
        setModal
      }}
    >

      <HashRouter>

        <AppLayout
          modal={modal}
          setModal={setModal}
          msg={msg}
        />

      </HashRouter>

    </Ctx.Provider>

  )

}
