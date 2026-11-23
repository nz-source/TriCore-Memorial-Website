import Schedule from './AdminSchedule'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import {
  api,
  CEMETERY,
  img,
  fmtDate
} from '../api'

import { useApp } from '../ctx'

import {
  useLoad,
  useAct
} from './util'

import {
  MemorialMgmt,
  Cemeteries,
  Privacy,
  MemorialForm
} from './AdminMemorials'

import {
  Gallery,
  MemoryWall,
  PrayersCandles,
  Guests
} from './AdminContent'

import Users from './AdminUsers'


/* =========================================
   ADMIN MENU
========================================= */

const MENU = [
  ['dash', 'Dashboard'],
  ['mgmt', 'Memorial Management'],
  ['wake', 'Wake & Funeral'],
  ['cem', 'Cemetery Management'],
  ['gal', 'Gallery Management'],
  ['wall', 'Memory Wall'],
  ['pc', 'Prayers & Candles'],
  ['guest', 'Guest Management'],
  ['users', 'User Management'],
  ['priv', 'Privacy & Security'],
  ['rep', 'Reports'],
  ['set', 'Settings']
]


/* =========================================
   ADMIN DASHBOARD
========================================= */

function Dashboard() {
  const { setModal } = useApp()

  const [s, reloadStats] = useLoad('/admin/stats')
  const [rows, reloadMemorials] = useLoad('/admin/memorials')

  const refreshDashboard = () => {
    reloadStats()
    reloadMemorials()
  }

  if (!s || !rows) {
    return <p>Loading dashboard...</p>
  }

  const stats = [
    ['Total memorials', s.memorials ?? 0],
    ['Candles lit', s.candles ?? 0],
    ['Prayers received', s.prayers ?? 0],
    ['Pending approvals', s.pending ?? 0]
  ]

  return (
    <div className="dashboard">

      {/* DASHBOARD STATISTICS */}

      <div className="stats">
        {stats.map(([label, value]) => (
          <div className="stat" key={label}>
            <b>{String(value).padStart(3, '0')}</b>
            {label}
          </div>
        ))}
      </div>


      {/* MEMORIAL RECORDS HEADER */}

      <div className="dashboard-actions">
        <h3>Memorial Records</h3>

        <button
          className="btn"
          type="button"
          onClick={() =>
            setModal(
              <MemorialForm onSaved={refreshDashboard} />
            )
          }
        >
          + Add New Memorial
        </button>
      </div>


      {/* MEMORIAL RECORDS */}

      {rows.length > 0 ? (
        <div className="admin-memorial-grid">

          {rows.map((m) => (
            <div
              className="admin-memorial-card"
              key={m.id}
            >

              {/* MEMORIAL PORTRAIT */}

              {m.portrait ? (
                <img
                  className="admin-memorial-photo"
                  src={img(m.portrait)}
                  alt={m.name}
                />
              ) : (
                <div className="admin-memorial-placeholder">
                  <span className="admin-memorial-cross">
                    ✝
                  </span>
                  <div className="candle"></div>
                </div>
              )}


              {/* MEMORIAL TITLE */}

              <p className="admin-memorial-subtitle">
                In Loving Memory
              </p>


              {/* MEMORIAL NAME */}

              <h3 className="admin-memorial-name">
                {m.name}
              </h3>


              {/* BIRTH AND DEATH DATES */}

              <p className="admin-memorial-dates">
                {m.birth_date
                  ? fmtDate(m.birth_date)
                  : 'Birth date unavailable'}

                {' – '}

                {m.death_date
                  ? fmtDate(m.death_date)
                  : 'Passing date unavailable'}
              </p>


              {/* CEMETERY TYPE */}

              <p className="admin-memorial-cemetery">
                {CEMETERY[m.cemetery_type] ||
                  m.cemetery_type ||
                  'No cemetery type'}
              </p>


              {/* CEMETERY NAME */}

              {m.cemetery_name && (
                <p className="admin-memorial-detail">
                  {m.cemetery_name}
                </p>
              )}


              {/* VISIBILITY AND STATUS */}

              <div className="admin-memorial-info">

                <div>
                  <span>Visibility</span>
                  <strong>
                    {m.visibility || 'N/A'}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong
                    className={
                      m.status === 'published'
                        ? 'status-published'
                        : 'status-draft'
                    }
                  >
                    {m.status || 'N/A'}
                  </strong>
                </div>

              </div>

            </div>
          ))}

        </div>
      ) : (

        /* EMPTY MEMORIAL RECORDS */

        <div className="admin-empty">
          <h3>No Memorial Records Yet</h3>
          <p>
            Add a new memorial to display its information here.
          </p>
        </div>

      )}

    </div>
  )
}


/* =========================================
   REPORTS
========================================= */

function Reports() {
  const [s] = useLoad('/admin/stats')

  if (!s) {
    return <p>Loading reports...</p>
  }

  return (
    <>
      <div className="stats">
        {[
          ['Memorials', s.memorials ?? 0],
          ['Candles', s.candles ?? 0],
          ['Prayers', s.prayers ?? 0],
          ['Memories', s.memories ?? 0],
          ['Messages', s.messages ?? 0]
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <b>{value}</b>
            {label}
          </div>
        ))}
      </div>


      {/* BY CEMETERY TYPE */}

      <h3>By cemetery type</h3>

      <p>
        {(s.by_cemetery ?? []).length > 0
          ? s.by_cemetery.map((r) => (
              <span key={r.k}>
                {CEMETERY[r.k] ?? r.k}: {r.n}
                <br />
              </span>
            ))
          : 'No cemetery records available.'}
      </p>


      {/* BY VISIBILITY */}

      <h3>By visibility</h3>

      <p>
        {(s.by_visibility ?? []).length > 0
          ? s.by_visibility.map((r) => (
              <span key={r.k}>
                {r.k}: {r.n}
                <br />
              </span>
            ))
          : 'No visibility records available.'}
      </p>
    </>
  )
}


/* =========================================
   WEBSITE SETTINGS
========================================= */

function Settings() {
  const { site, setSite } = useApp()

  const [f, setF] = useState({
    site_name: site?.site_name ?? '',
    hero_title: site?.hero_title ?? '',
    tagline: site?.tagline ?? ''
  })

  const act = useAct()

  return (
    <form
      style={{ maxWidth: 520 }}
      onSubmit={(e) => {
        e.preventDefault()

        act(
          async () => {
            await api.put('/settings', f)

            setSite({
              ...site,
              ...f
            })
          },
          'Settings saved.'
        )
      }}
    >

      {[
        ['site_name', 'Site name'],
        ['hero_title', 'Homepage headline'],
        ['tagline', 'Footer quote']
      ].map(([key, label]) => (
        <div key={key}>
          <label>{label}</label>

          <input
            value={f[key]}
            onChange={(e) =>
              setF({
                ...f,
                [key]: e.target.value
              })
            }
          />
        </div>
      ))}

      <p>
        <button className="btn" type="submit">
          Save settings
        </button>
      </p>

    </form>
  )
}


/* =========================================
   ADMIN PAGE COMPONENTS
========================================= */

const VIEW = {
  dash: Dashboard,
  mgmt: MemorialMgmt,
  wake: Schedule,
  cem: Cemeteries,
  gal: Gallery,
  wall: MemoryWall,
  pc: PrayersCandles,
  guest: Guests,
  users: Users,
  priv: Privacy,
  rep: Reports,
  set: Settings
}


/* =========================================
   MAIN ADMIN DASHBOARD
========================================= */

export default function Admin() {
  const { user, setUser, toast } = useApp()

  const [tab, setTab] = useState('dash')
  const [loggingOut, setLoggingOut] = useState(false)


  /* LOGOUT */

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await api.post('/auth/logout', {})

      setUser(null)
      toast('You have successfully logged out.')

    } catch (error) {
      toast(
        error.message ||
        'Unable to log out. Please try again.'
      )
    } finally {
      setLoggingOut(false)
    }
  }


  /* CHECK LOGIN */

  if (!user) {
    return <Navigate to="/login" replace />
  }


  /* CHECK ADMIN ROLE */

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }


  /* ACTIVE VIEW */

  const View = VIEW[tab]
  const activeMenu = MENU.find(
    (item) => item[0] === tab
  )


  /* ADMIN LAYOUT */

  return (
    <div className="admin">

      {/* SIDEBAR */}

      <aside className="side">

        {/* ADMIN BRAND */}

        <div className="serif admin-brand">

          <div className="admin-flower">
            <img
              src="/Flower.png"
              alt="Memorial Flower"
            />
          </div>

          <h2>TriCore</h2>

          <p className="admin-subtitle">
            Memorial Website
          </p>

          <div className="admin-role">
            Administrator
          </div>

        </div>


        {/* ADMIN MENU */}

        <div className="side-menu">
          {MENU.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={tab === key ? 'on' : ''}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>


        {/* LOGOUT */}

        <div className="side-logout">
          <button
            type="button"
            className="logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut
              ? 'Logging Out...'
              : 'Log Out'}
          </button>
        </div>

      </aside>


      {/* MAIN CONTENT */}

      <section className="admin-content">

        <h2>
          {activeMenu?.[1] ?? 'Dashboard'}
        </h2>

        <View key={tab} />

      </section>

    </div>
  )
}