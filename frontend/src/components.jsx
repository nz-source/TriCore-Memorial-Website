import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'

import {
  api,
  img,
  fmtDate,
  fmtTime,
  age,
  CEMETERY
} from './api'

import { useApp } from './ctx'


/* =========================================
   MEMORIAL ICON
========================================= */

export const Icon = () => (
  <svg
    className="ico"
    viewBox="0 0 96 96"
    fill="none"
    stroke="#b99a58"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M62 10v40M52 22h20" />

    <rect
      x="26"
      y="40"
      width="22"
      height="34"
      rx="3"
      fill="#f3ead2"
    />

    <path
      d="M37 38c-5-6 0-10 0-16 5 5 5 11 0 16z"
      fill="#f0b84a"
      stroke="none"
    />

    <path d="M16 78c10-12 22-6 30 0s24-8 34 0" />
  </svg>
)


/* =========================================
   NAVIGATION
========================================= */

export function Nav() {
  const { user, setUser, site, toast } = useApp()

  const nav = useNavigate()
  const [busy, setBusy] = useState(false)

  const logout = async () => {
    if (busy) return

    setBusy(true)

    try {
      await api.post('/auth/logout', {})
    } catch (e) {
      // Clear the local session even if the server request fails.
      toast(e.message || 'Unable to contact the server.')
    } finally {
      setUser(null)
      setBusy(false)
      nav('/')
    }
  }

  return (
    <nav>
      <Link className="brand" to="/">
        {site.site_name}
      </Link>

      {[
        ['/', 'Home'],
        ['/memorials', 'Memorials'],
        ['/memories', 'Memories'],
        ['/prayers', 'Prayers'],
        ['/about', 'About'],
        ['/contact', 'Contact']
      ].map(([to, title]) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="l"
        >
          {title}
        </NavLink>
      ))}

      {user ? (
        <>
          <NavLink to="/admin" className="l">
            Admin
          </NavLink>

          <button
            type="button"
            className="l"
            onClick={logout}
            disabled={busy}
          >
            {busy ? 'Logging out…' : 'Log out'}
          </button>
        </>
      ) : (
        <NavLink to="/login" className="l">
          Log in
        </NavLink>
      )}
    </nav>
  )
}


/* =========================================
   FOOTER
========================================= */

export function Footer() {
  const { site } = useApp()

  return (
    <footer>
      <p
        className="serif"
        style={{
          fontSize: '1.3rem',
          color: '#fff'
        }}
      >
        {site.tagline}
      </p>

      <p>&copy; {new Date().getFullYear()} TriCore Website</p>
    </footer>
  )
}


/* =========================================
   MODAL
========================================= */

export function Modal({ children, onClose }) {

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="box">

        <button
          type="button"
          className="btn o s x"
          onClick={onClose}
          aria-label="Close dialog"
        >
          Close
        </button>

        {children}

      </div>
    </div>
  )
}


/* =========================================
   MEMORIAL CARD
========================================= */

export function MemorialCard({ m }) {
  const { setModal } = useApp()

  const nav = useNavigate()

  const cemetery =
    CEMETERY[m.cemetery_type] || 'Cemetery'


  // PRIVATE MEMORIAL
  if (m.locked) {
    return (
      <div className="card">

        <Icon />

        <small>In Loving Memory</small>

        <div className="nm">
          {m.name}
        </div>

        <small>
          {cemetery}
          <br />
          Private memorial. Contact the administrator for access.
        </small>

        <div className="row">
          <button
            type="button"
            className="btn s"
            onClick={() => nav('/login')}
          >
            Administrator log in
          </button>
        </div>

      </div>
    )
  }


  // PUBLIC MEMORIAL
  return (
    <div className="card">

      {m.portrait ? (
        <img
          className="ph"
          src={img(m.portrait)}
          alt={`Portrait of ${m.name}`}
        />
      ) : (
        <Icon />
      )}

      <small>In Loving Memory</small>

      <div className="nm">
        {m.name}
      </div>

      <small>
        {fmtDate(m.birth_date)} – {fmtDate(m.death_date)}
        <br />
        {cemetery}
      </small>

      <div className="row">

        <button
          type="button"
          className="btn s o"
          onClick={() => setModal(<CandleForm m={m} />)}
        >
          Light a candle
        </button>

        <button
          type="button"
          className="btn s o"
          onClick={() => setModal(<MemoryForm m={m} />)}
        >
          Share a memory
        </button>

        <button
          type="button"
          className="btn s"
          onClick={() => setModal(<Profile id={m.id} />)}
        >
          Show memories
        </button>

      </div>

    </div>
  )
}


/* =========================================
   MEMORIAL PROFILE
========================================= */

export function Profile({ id }) {
  const { setModal } = useApp()

  const [m, setM] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await api.get('/memorials/' + id)

        if (active) {
          setM(result)
        }

      } catch (e) {
        if (active) {
          setErr(e.message || 'Unable to load memorial.')
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [id])

  if (err) return <p>{err}</p>

  if (!m) return <p>Loading memorial…</p>

  const gallery = m.gallery || []
  const candles = m.candles || []
  const prayers = m.prayers || []
  const memories = m.memories || []

  const cemetery =
    CEMETERY[m.cemetery_type] || 'Cemetery'

  const a = age(m.birth_date, m.death_date)

  return (
    <>

      {/* PORTRAIT */}

      {m.portrait ? (
        <img
          className="ph"
          src={img(m.portrait)}
          alt={`Portrait of ${m.name}`}
        />
      ) : (
        <Icon />
      )}

      <h2 style={{ textAlign: 'center' }}>
        {m.name}
      </h2>

      <p style={{ textAlign: 'center' }}>
        {fmtDate(m.birth_date)} – {fmtDate(m.death_date)}

        {a !== '' && ` (age ${a})`}
      </p>


      {/* PERSONAL INFORMATION */}

      {m.bio && <p>{m.bio}</p>}

      {m.family_info && (
        <p>
          <b>Family:</b> {m.family_info}
        </p>
      )}


      {/* WAKE AND FUNERAL */}

      <h3>Wake and funeral</h3>

      <p>
        Wake: {
          [m.wake_location, m.wake_address]
            .filter(Boolean)
            .join(', ') || 'To be announced'
        }

        <br />

        Date: {fmtDate(m.wake_date) || 'To be announced'}

        {m.viewing_hours && (
          `, viewing hours ${m.viewing_hours}`
        )}

        <br />

        Funeral service: {m.funeral_church || 'To be announced'}

        {m.funeral_date && (
          `, ${fmtDate(m.funeral_date)} ${fmtTime(m.funeral_time)}`
        )}

        <br />

        Presiding: {m.presider || 'To be announced'}
      </p>


      {/* FINAL RESTING PLACE */}

      <h3>Final resting place</h3>

      <p>
        <span className="pill">
          {cemetery}
        </span>

        <br />

        {m.cemetery_name}

        {m.cemetery_address && `, ${m.cemetery_address}`}

        <br />

        {m.grave_id}

        {m.map_link && (
          <>
            <br />

            <a
              href={m.map_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open map location
            </a>
          </>
        )}
      </p>

      {m.grave_photo && (
        <img
          src={img(m.grave_photo)}
          alt={`Grave of ${m.name}`}
          style={{ maxWidth: '100%' }}
        />
      )}


      {/* GALLERY */}

      {gallery.length > 0 && (
        <>
          <h3>Gallery</h3>

          <div className="gal">
            {gallery.map((g) => (
              <figure
                key={g.id}
                style={{ margin: 0 }}
              >
                <img
                  src={img(g.file)}
                  alt={g.caption || 'Memorial gallery photo'}
                />

                <small>
                  {g.album}

                  {g.caption && `: ${g.caption}`}
                </small>
              </figure>
            ))}
          </div>
        </>
      )}


      {/* CANDLES */}

      <h3>
        {m.candle_count ?? candles.length} candle
        {(m.candle_count ?? candles.length) === 1 ? '' : 's'} lit
      </h3>

      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
          paddingTop: '1.8rem'
        }}
      >
        {candles.slice(0, 8).map((c) => (
          <div
            key={c.id}
            className={`candle c${c.design}`}
          />
        ))}
      </div>


      {/* VISITOR ACTIONS */}

      <div className="row">

        {m.allow_candles !== false && (
          <button
            type="button"
            className="btn"
            onClick={() => setModal(<CandleForm m={m} />)}
          >
            Light a candle
          </button>
        )}

        {m.allow_prayers !== false && (
          <button
            type="button"
            className="btn o"
            onClick={() => setModal(<PrayerForm m={m} />)}
          >
            Offer a prayer
          </button>
        )}

        {m.allow_memories !== false && (
          <button
            type="button"
            className="btn o"
            onClick={() => setModal(<MemoryForm m={m} />)}
          >
            Share a memory
          </button>
        )}

      </div>


      {/* PRAYERS AND MESSAGES */}

      <h3>Prayers and messages</h3>

      {candles
        .filter((c) => c.message)
        .map((c) => (
          <div
            className="tribute"
            key={'c' + c.id}
          >
            <p>{c.message}</p>
            <small>{c.name}</small>
          </div>
        ))}

      {prayers.map((p) => (
        <div
          className="tribute"
          key={'p' + p.id}
        >
          <b>{p.type}</b>

          <p>{p.message}</p>

          <small>{p.name}</small>
        </div>
      ))}


      {/* MEMORIES */}

      <h3>Memories</h3>

      {memories.length === 0 && (
        <p>No memories have been shared yet.</p>
      )}

      {memories.map((t) => (
        <div
          className="tribute"
          key={t.id}
        >
          {t.photo && (
            <img
              src={img(t.photo)}
              alt={t.caption || 'Memory photo'}
              style={{
                maxWidth: 220,
                display: 'block'
              }}
            />
          )}

          <p>{t.story}</p>

          <small>{t.name}</small>
        </div>
      ))}

    </>
  )
}


/* =========================================
   FORM SUBMISSION HANDLER
========================================= */

function useSubmit(done) {
  const { toast, setModal } = useApp()

  const [busy, setBusy] = useState(false)

  const submit = async (fn, okMsg) => {
    if (busy) return

    setBusy(true)

    try {
      const result = await fn()

      toast(
        typeof okMsg === 'function'
          ? okMsg(result)
          : okMsg
      )

      setModal(null)

      if (done) {
        done()
      }

    } catch (e) {
      toast(e.message || 'Unable to submit your request.')
    } finally {
      setBusy(false)
    }
  }

  return [busy, submit]
}


/* =========================================
   CANDLE FORM
========================================= */

export function CandleForm({ m }) {
  const [f, setF] = useState({
    design: 1,
    name: '',
    anonymous: false,
    message: ''
  })

  const [busy, go] = useSubmit()

  const set = (key, value) => {
    setF((previous) => ({
      ...previous,
      [key]: value
    }))
  }

  return (
    <form
      className="candle-form"
      onSubmit={(e) => {
        e.preventDefault()

        go(
          () => api.post(`/memorials/${m.id}/candles`, f),
          'Your candle is lit.'
        )
      }}
    >

      <h2>Light a candle for {m.name}</h2>

      <p className="candle-instruction">
        Choose a candle design
      </p>

      {/* CANDLE SELECTION */}

      <div className="opts candle-options">

        {[1, 2, 3].map((d) => (

          <label
            key={d}
            className={`candle-option ${
              f.design === d ? 'selected' : ''
            }`}
          >

            {/* CANDLE PREVIEW */}

            <div className="candle-preview">

              <div className={`candle c${d}`} />

            </div>

            {/* CANDLE DESIGN NAME */}

            <span className="candle-name">
              Design {d}
            </span>

            {/* RADIO BUTTON */}

            <input
              type="radio"
              name="design"
              value={d}
              checked={f.design === d}
              onChange={() => set('design', d)}
              disabled={busy}
              aria-label={`Select candle design ${d}`}
            />

          </label>

        ))}

      </div>


      {/* VISITOR NAME */}

      <label htmlFor="candle-name">
        Your name
      </label>

      <input
        id="candle-name"
        value={f.name}
        onChange={(e) => set('name', e.target.value)}
        disabled={busy || f.anonymous}
        placeholder="Enter your name"
      />


      {/* ANONYMOUS OPTION */}

      <label className="candle-anonymous">

        <input
          className="chk"
          type="checkbox"
          checked={f.anonymous}
          onChange={(e) => set('anonymous', e.target.checked)}
          disabled={busy}
        />

        Stay anonymous

      </label>


      {/* MESSAGE */}

      <label htmlFor="candle-message">
        Prayer or message for the family
      </label>

      <textarea
        id="candle-message"
        rows="3"
        value={f.message}
        onChange={(e) => set('message', e.target.value)}
        disabled={busy}
        placeholder="Write a short prayer or message..."
      />


      {/* SUBMIT */}

      <div className="candle-submit">

        <button
          className="btn"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Lighting…' : 'Light Candle'}
        </button>

      </div>

    </form>
  )
}



/* =========================================
   PRAYER FORM
========================================= */

export function PrayerForm({ m }) {
  const [f, setF] = useState({
    type: 'Prayer',
    name: '',
    message: ''
  })

  const [busy, go] = useSubmit()

  const set = (key, value) => {
    setF((previous) => ({
      ...previous,
      [key]: value
    }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()

        go(
          () => api.post(`/memorials/${m.id}/prayers`, f),
          'Your message has been shared.'
        )
      }}
    >

      <h2>Prayer or condolence for {m.name}</h2>

      <label>Type</label>

      <select
        value={f.type}
        onChange={(e) => set('type', e.target.value)}
      >
        {[
          'Prayer',
          'Condolence',
          'Bible verse',
          'Words of comfort'
        ].map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <label>
        Your name (leave blank to stay anonymous)
      </label>

      <input
        value={f.name}
        onChange={(e) => set('name', e.target.value)}
      />

      <label>Message</label>

      <textarea
        rows="4"
        required
        value={f.message}
        onChange={(e) => set('message', e.target.value)}
      />

      <p>
        <button
          className="btn"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Sending…' : 'Send'}
        </button>
      </p>

    </form>
  )
}


/* =========================================
   MEMORY FORM
========================================= */

export function MemoryForm({ m }) {
  const { user } = useApp()

  const [busy, go] = useSubmit()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()

        const fd = new FormData(e.target)

        go(
          () => api.upload(`/memorials/${m.id}/memories`, fd),
          (r) => (
            r.status === 'approved'
              ? 'Memory published.'
              : 'Thank you. Your memory will appear once it is approved.'
          )
        )
      }}
    >

      <h2>Share a memory of {m.name}</h2>

      <label>
        Your name (leave blank to stay anonymous)
      </label>

      <input
        name="name"
        disabled={busy}
      />

      <label>Your memory</label>

      <textarea
        name="story"
        rows="4"
        required
        placeholder="I will always remember your kindness and laughter."
        disabled={busy}
      />

      <label>
        Photo (optional, JPG, PNG or WEBP, up to 3 MB)
      </label>

      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
      />

      <label>Photo caption</label>

      <input
        name="caption"
        disabled={busy}
      />

      <p>
        <button
          className="btn"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Submitting…' : 'Submit memory'}
        </button>
      </p>

      {!user && (
        <small>
          Memories are reviewed by the administrator before they are published.
        </small>
      )}

    </form>
  )
}
