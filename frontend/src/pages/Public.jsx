import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { api, img, fmtDate } from '../api'
import { useApp } from '../ctx'
import { MemorialCard, MemoryForm, PrayerForm } from '../components'


/* =========================================
   LOAD AND SEARCH MEMORIALS
========================================= */

function useMemorials(q, type) {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let active = true

    setRows(null)
    setErr('')

    const timer = setTimeout(async () => {
      try {
        const result = await api.get(
          `/memorials?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`
        )

        if (active) {
          setRows(Array.isArray(result) ? result : [])
        }

      } catch (e) {
        if (active) {
          setErr(e.message || 'Unable to load memorials.')
          setRows([])
        }
      }
    }, 200)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [q, type])

  return [rows, err]
}


/* =========================================
   MEMORIAL GRID
========================================= */

export const Grid = ({ rows, err }) => {
  if (err) return <p>{err}</p>

  if (!rows) return <p>Loading memorials…</p>

  if (!rows.length) {
    return <p>No memorials match your search. Try a different name or category.</p>
  }

  return (
    <div className="grid">
      {rows.map((m) => (
        <MemorialCard key={m.id} m={m} />
      ))}
    </div>
  )
}


/* =========================================
   HOME PAGE
========================================= */

export function Home() {
  const { site } = useApp()
  const nav = useNavigate()

  const [q, setQ] = useState('')
  const [rows, err] = useMemorials('', '')

  const search = (e) => {
    e.preventDefault()

    nav('/memorials?q=' + encodeURIComponent(q))
  }

  return (
    <>
      <section className="hero">

        <div>
          <h1>{site.hero_title}</h1>

          <p>
            A quiet place to honor the lives of those we love:
            light a candle, offer a prayer, and share the stories
            that keep them close.
          </p>

          <form className="search" onSubmit={search}>
            <input
              type="search"
              placeholder="Search for a loved one"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search"
            />

            <button className="btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div aria-hidden="true">
          <div className="candle c1" />
        </div>

      </section>

      <h2>Recently created memorials</h2>

      <Grid
        rows={rows?.slice(0, 4)}
        err={err}
      />

      <h2 style={{ marginTop: '2.5rem' }}>
        More memorials
      </h2>

      <Grid
        rows={rows?.slice(4, 7)}
        err={err}
      />
    </>
  )
}


/* =========================================
   MEMORIALS PAGE
========================================= */

export function Memorials() {
  const [sp, setSp] = useSearchParams()

  const q = sp.get('q') || ''
  const type = sp.get('type') || ''

  const [rows, err] = useMemorials(q, type)

  const upd = (k, v) => {
    const n = new URLSearchParams(sp)

    if (v) {
      n.set(k, v)
    } else {
      n.delete(k)
    }

    setSp(n, { replace: true })
  }

  return (
    <>
      <h2>Memorials</h2>

      <div className="search">
        <input
          type="search"
          placeholder="Search for a loved one"
          value={q}
          onChange={(e) => upd('q', e.target.value)}
          aria-label="Search memorials"
        />
      </div>

      <div className="tabs">
        {[
          ['', 'All'],
          ['catholic', 'Catholic cemetery'],
          ['private', 'Private cemetery'],
          ['public', 'Public cemetery']
        ].map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={type === k ? 'on' : ''}
            onClick={() => upd('type', k)}
          >
            {v}
          </button>
        ))}
      </div>

      <Grid rows={rows} err={err} />
    </>
  )
}


/* =========================================
   TRIBUTES PAGE
========================================= */

export function Tributes({ kind }) {
  const { setModal } = useApp()

  const [d, setD] = useState(null)
  const [list, setList] = useState([])
  const [pick, setPick] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    let active = true

    const loadTributes = async () => {
      try {
        const result = await api.get('/tributes')

        if (active) {
          setD(result || { memories: [], prayers: [] })
        }
      } catch (e) {
        if (active) {
          setD({ memories: [], prayers: [] })
          setErr(e.message || 'Unable to load tributes.')
        }
      }
    }

    const loadMemorials = async () => {
      try {
        const result = await api.get('/memorials')
        const available = Array.isArray(result)
          ? result.filter((m) => !m.locked)
          : []

        if (active) {
          setList(available)
          setPick(available[0]?.id || '')
        }
      } catch (e) {
        if (active) {
          setErr(e.message || 'Unable to load memorials.')
        }
      }
    }

    loadTributes()
    loadMemorials()

    return () => {
      active = false
    }
  }, [])

  const m = list.find(
    (x) => String(x.id) === String(pick)
  )

  const rows = d?.[kind] || []

  return (
    <>
      <h2>
        {kind === 'memories'
          ? 'Memory wall'
          : 'Prayers and condolences'}
      </h2>

      <p>
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          style={{ maxWidth: 320 }}
          aria-label="Memorial"
        >
          {list.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>{' '}

        <button
          className="btn"
          type="button"
          disabled={!m}
          onClick={() =>
            setModal(
              kind === 'memories'
                ? <MemoryForm m={m} />
                : <PrayerForm m={m} />
            )
          }
        >
          Add yours
        </button>
      </p>

      {err && <p>{err}</p>}

      {!d ? (
        <p>Loading tributes…</p>
      ) : rows.length === 0 ? (
        <p>Nothing has been shared yet. Be the first.</p>
      ) : (
        rows.map((t) => (
          <div className="tribute" key={t.id}>

            {t.photo && (
              <img
                src={img(t.photo)}
                alt={t.caption || 'Memorial tribute'}
                style={{
                  maxWidth: 220,
                  display: 'block'
                }}
              />
            )}

            {t.type && <b>{t.type}</b>}

            <p>{t.story || t.message}</p>

            <small>
              {t.name} for {t.memorial},{' '}
              {fmtDate(t.created_at?.slice(0, 10))}
            </small>

          </div>
        ))
      )}
    </>
  )
}


/* =========================================
   ABOUT PAGE
========================================= */

export const About = () => {
  const { site } = useApp()

  return (
    <>
      <h2>About {site.site_name}</h2>

      <p style={{ maxWidth: '60ch' }}>
        {site.site_name} is a peaceful digital place where
        families and friends remember their departed loved
        ones, even when they cannot visit the cemetery.
        The administrator approves every memory before
        it is published.
      </p>

      <p>
        Cemetery type and memorial visibility are separate
        settings: a Catholic cemetery memorial can be public
        or private.
      </p>
    </>
  )
}


/* =========================================
   CONTACT PAGE
========================================= */

export function Contact() {
  const { toast } = useApp()

  const [f, setF] = useState({
    name: '',
    email: '',
    message: ''
  })

  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => {
    setF((prev) => ({
      ...prev,
      [k]: e.target.value
    }))
  }

  const send = async (e) => {
    e.preventDefault()

    if (busy) return

    setBusy(true)

    try {
      await api.post('/contact', f)

      setF({
        name: '',
        email: '',
        message: ''
      })

      toast('Message sent. Thank you.')

    } catch (er) {
      toast(er.message || 'Unable to send message.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h2>Contact us</h2>

      <form
        onSubmit={send}
        style={{ maxWidth: 480 }}
      >
        <label>Name</label>

        <input
          required
          value={f.name}
          onChange={set('name')}
        />

        <label>Email</label>

        <input
          type="email"
          required
          value={f.email}
          onChange={set('email')}
        />

        <label>Message</label>

        <textarea
          rows="4"
          required
          value={f.message}
          onChange={set('message')}
        />

        <p>
          <button
            className="btn"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Sending…' : 'Send message'}
          </button>
        </p>
      </form>
    </>
  )
}


/* =========================================
   ADMINISTRATOR LOGIN
========================================= */

export function Login() {
  const { user, setUser, toast } = useApp()

  const [f, setF] = useState({
    email: '',
    password: ''
  })

  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to="/admin" replace />
  }

  const go = async (e) => {
    e.preventDefault()

    if (busy) return

    setBusy(true)

    try {
      const r = await api.post('/auth/login', f)

      if (!r?.user) {
        throw new Error('Invalid login response.')
      }

      setUser(r.user)

    } catch (er) {
      toast(er.message || 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h2>Administrator log in</h2>

      <form
        onSubmit={go}
        style={{ maxWidth: 380 }}
      >
        <label>Email</label>

        <input
          type="email"
          required
          autoComplete="username"
          value={f.email}
          onChange={(e) =>
            setF({
              ...f,
              email: e.target.value
            })
          }
        />

        <label>Password</label>

        <input
          type="password"
          required
          autoComplete="current-password"
          value={f.password}
          onChange={(e) =>
            setF({
              ...f,
              password: e.target.value
            })
          }
        />

        <p>
          <button
            className="btn"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </p>
      </form>
    </>
  )
}
