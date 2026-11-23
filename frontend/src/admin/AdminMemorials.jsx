
import { useState } from 'react'

import {
  api,
  img,
  CEMETERY
} from '../api'

import { useApp } from '../ctx'

import {
  useLoad,
  Table,
  useAct
} from './util'


/* =========================================
   REUSABLE INPUT FIELD
========================================= */

const In = ({
  l,
  n,
  v,
  t = 'text',
  ...r
}) => (
  <div>
    <label htmlFor={n}>{l}</label>

    <input
      id={n}
      name={n}
      type={t}
      defaultValue={v ?? ''}
      {...r}
    />
  </div>
)


/* =========================================
   FORMAT TIME
========================================= */

const T = (v) => (
  v ? String(v).slice(0, 5) : ''
)


/* =========================================
   CHECK BOOLEAN VALUES
========================================= */

const isEnabled = (value) => (
  value === 1 ||
  value === '1' ||
  value === true
)


/* =========================================
   DEFAULT MEMORIAL VALUES
========================================= */

const DEFAULT_MEMORIAL = {
  cemetery_type: 'catholic',
  visibility: 'public',
  allow_candles: 1,
  allow_prayers: 1,
  allow_memories: 1
}


/* =========================================
   MEMORIAL FORM
   CREATE AND EDIT MEMORIAL
========================================= */

export function MemorialForm({ m, onSaved }) {

  const { setModal, toast } = useApp()

  const [busy, setBusy] = useState(false)

  const memorial = {
    ...DEFAULT_MEMORIAL,
    ...(m || {})
  }


  /* SUBMIT MEMORIAL */

  const submit = async (e) => {

    e.preventDefault()

    if (busy) return

    const form = e.currentTarget

    const fd = new FormData(form)


    /* GET STATUS FROM SUBMIT BUTTON */

    const status =
      e.nativeEvent?.submitter?.value || 'draft'

    fd.set('status', status)


    /* EXPLICITLY SAVE CHECKBOX VALUES */

    ;['candles', 'prayers', 'memories'].forEach((key) => {

      const checked = form.elements[
        `allow_${key}`
      ]?.checked

      fd.set(
        `allow_${key}`,
        checked ? '1' : '0'
      )

    })


    setBusy(true)

    try {

      const endpoint = memorial.id
        ? `/memorials/${memorial.id}`
        : '/memorials'


      /* SAVE MEMORIAL */

      await api.upload(endpoint, fd)


      toast(
        status === 'published'
          ? 'Memorial published.'
          : 'Draft saved.'
      )


      /* CLOSE MODAL */

      setModal(null)


      /* REFRESH DATA */

      onSaved?.()

    } catch (error) {

      toast(
        error.message ||
        'Unable to save memorial.'
      )

    } finally {

      setBusy(false)

    }

  }


  return (

    <form onSubmit={submit}>

      <h2>
        {memorial.id ? 'Edit' : 'Add new'} memorial
      </h2>


      {/* =====================================
          1. PERSONAL DETAILS
      ===================================== */}

      <fieldset>

        <legend>1. Personal details</legend>

        <div className="two">

          <In
            l="Full name"
            n="name"
            v={memorial.name}
            required
            maxLength={255}
          />


          {/* PORTRAIT */}

          <div>

            <label htmlFor="portrait">
              Portrait
            </label>

            <input
              id="portrait"
              type="file"
              name="portrait"
              accept="image/jpeg,image/png,image/webp"
            />

            {memorial.portrait && (
              <small>
                Current portrait: {memorial.portrait}
              </small>
            )}

          </div>


          <In
            l="Birth date"
            n="birth_date"
            t="date"
            v={memorial.birth_date}
            required
          />


          <In
            l="Passing date"
            n="death_date"
            t="date"
            v={memorial.death_date}
            required
          />

        </div>


        {/* BIOGRAPHY */}

        <label htmlFor="bio">
          Biography
        </label>

        <textarea
          id="bio"
          name="bio"
          rows="3"
          defaultValue={memorial.bio ?? ''}
        />


        <In
          l="Family information"
          n="family_info"
          v={memorial.family_info}
        />

      </fieldset>


      {/* =====================================
          2. WAKE INFORMATION
      ===================================== */}

      <fieldset>

        <legend>2. Wake information</legend>

        <div className="two">

          <In
            l="Location"
            n="wake_location"
            v={memorial.wake_location}
          />

          <In
            l="Address"
            n="wake_address"
            v={memorial.wake_address}
          />

          <In
            l="Wake date"
            n="wake_date"
            t="date"
            v={memorial.wake_date}
          />

          <In
            l="Visiting hours"
            n="viewing_hours"
            v={memorial.viewing_hours}
          />

        </div>

      </fieldset>


      {/* =====================================
          3. FUNERAL SERVICE
      ===================================== */}

      <fieldset>

        <legend>3. Funeral service</legend>

        <div className="two">

          <In
            l="Church or chapel"
            n="funeral_church"
            v={memorial.funeral_church}
          />

          <In
            l="Presiding priest or minister"
            n="presider"
            v={memorial.presider}
          />

          <In
            l="Date"
            n="funeral_date"
            t="date"
            v={memorial.funeral_date}
          />

          <In
            l="Time"
            n="funeral_time"
            t="time"
            v={T(memorial.funeral_time)}
          />

        </div>

      </fieldset>


      {/* =====================================
          4. BURIAL INFORMATION
      ===================================== */}

      <fieldset>

        <legend>4. Burial information</legend>

        <div className="two">

          {/* CEMETERY TYPE */}

          <div>

            <label htmlFor="cemetery_type">
              Cemetery type
            </label>

            <select
              id="cemetery_type"
              name="cemetery_type"
              defaultValue={
                memorial.cemetery_type || 'catholic'
              }
            >

              {Object.entries(CEMETERY).map(([k, v]) => (

                <option key={k} value={k}>
                  {v}
                </option>

              ))}

            </select>

          </div>


          <In
            l="Cemetery name"
            n="cemetery_name"
            v={memorial.cemetery_name}
          />

          <In
            l="Address"
            n="cemetery_address"
            v={memorial.cemetery_address}
          />

          <In
            l="Grave section or ID"
            n="grave_id"
            v={memorial.grave_id}
          />

          <In
            l="Map link (optional)"
            n="map_link"
            t="url"
            v={memorial.map_link}
          />


          {/* GRAVE PHOTO */}

          <div>

            <label htmlFor="grave_photo">
              Grave photo
            </label>

            <input
              id="grave_photo"
              type="file"
              name="grave_photo"
              accept="image/jpeg,image/png,image/webp"
            />

            {memorial.grave_photo && (
              <small>
                Current grave photo: {memorial.grave_photo}
              </small>
            )}

          </div>

        </div>

      </fieldset>


      {/* =====================================
          5. MEMORIAL GALLERY
      ===================================== */}

      <fieldset>

        <legend>5. Memorial gallery</legend>

        <label htmlFor="gallery">
          Wake and family photos
        </label>

        <input
          id="gallery"
          type="file"
          name="gallery[]"
          accept="image/jpeg,image/png,image/webp"
          multiple
        />

        <small>
          You can upload multiple photos.
          Existing gallery photos will remain when editing.
        </small>

        <small>
          Guest memories appear under Memory Wall for approval.
        </small>

      </fieldset>


      {/* =====================================
          6. PRIVACY SETTINGS
      ===================================== */}

      <fieldset>

        <legend>6. Privacy</legend>

        <label htmlFor="visibility">
          Memorial visibility
        </label>

        <select
          id="visibility"
          name="visibility"
          defaultValue={
            memorial.visibility || 'public'
          }
        >

          <option value="public">
            Public
          </option>

          <option value="private">
            Private (administrators only)
          </option>

        </select>


        <p>Guests may:</p>

        {['candles', 'prayers', 'memories'].map((key) => (

          <label
            key={key}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.3rem',
              marginRight: '1rem',
              color: '#fff'
            }}
          >

            <input
              className="chk"
              type="checkbox"
              name={`allow_${key}`}
              value="1"
              defaultChecked={isEnabled(
                memorial[`allow_${key}`]
              )}
            />

            {key.charAt(0).toUpperCase() + key.slice(1)}

          </label>

        ))}

      </fieldset>


      {/* =====================================
          7. PUBLISH MEMORIAL
      ===================================== */}

      <fieldset>

        <legend>7. Publish</legend>

        <button
          className="btn o"
          type="submit"
          value="draft"
          disabled={busy}
        >
          {busy ? 'Saving...' : 'Save draft'}
        </button>

        {' '}

        <button
          className="btn"
          type="submit"
          value="published"
          disabled={busy}
        >
          {busy ? 'Saving...' : 'Publish memorial'}
        </button>

      </fieldset>

    </form>

  )
}


/* =========================================
   MEMORIAL MANAGEMENT
========================================= */

export function MemorialMgmt() {

  const { setModal } = useApp()

  const [rows, reload] = useLoad('/admin/memorials')

  const act = useAct(reload)

  if (!rows) {
    return <p>Loading memorials...</p>
  }

  return (

    <>

      <p>

        <button
          type="button"
          className="btn"
          onClick={() =>
            setModal(
              <MemorialForm onSaved={reload} />
            )
          }
        >
          Add New Memorial
        </button>

      </p>


      <Table
        heads={[
          'Name',
          'Cemetery',
          'Visibility',
          'Status',
          ''
        ]}
      >

        {rows.map((m) => (

          <tr key={m.id}>

            <td>{m.name}</td>

            <td>
              {CEMETERY[m.cemetery_type] ||
                m.cemetery_type}
            </td>

            <td>{m.visibility}</td>

            <td>{m.status}</td>

            <td>

              <button
                type="button"
                className="btn s o"
                onClick={() =>
                  setModal(
                    <MemorialForm
                      m={m}
                      onSaved={reload}
                    />
                  )
                }
              >
                Edit
              </button>

              {' '}

              <button
                type="button"
                className="btn s d"
                onClick={() =>
                  act(
                    () => api.del(`/memorials/${m.id}`),
                    'Memorial deleted.',
                    `Delete ${m.name} and everything shared on this memorial?`
                  )
                }
              >
                Delete
              </button>

            </td>

          </tr>

        ))}

      </Table>

    </>

  )
}


/* =========================================
   CEMETERY MANAGEMENT
========================================= */

export function Cemeteries() {

  const { setModal } = useApp()

  const [rows, reload] = useLoad('/admin/memorials')

  if (!rows) {
    return <p>Loading cemetery records...</p>
  }

  return (

    <Table
      heads={[
        'Name',
        'Type',
        'Cemetery',
        'Address',
        'Grave',
        'Photo',
        ''
      ]}
    >

      {rows.map((m) => (

        <tr key={m.id}>

          <td>{m.name}</td>

          <td>
            {CEMETERY[m.cemetery_type] ||
              m.cemetery_type}
          </td>

          <td>{m.cemetery_name || '-'}</td>

          <td>{m.cemetery_address || '-'}</td>

          <td>{m.grave_id || '-'}</td>

          <td>

            {m.grave_photo ? (

              <img
                src={img(m.grave_photo)}
                alt="Grave location"
                width="50"
              />

            ) : (
              '-'
            )}

          </td>

          <td>

            <button
              type="button"
              className="btn s o"
              onClick={() =>
                setModal(
                  <MemorialForm
                    m={m}
                    onSaved={reload}
                  />
                )
              }
            >
              Edit
            </button>

          </td>

        </tr>

      ))}

    </Table>

  )
}


/* =========================================
   PRIVACY AND SECURITY
========================================= */

export function Privacy() {

  const [rows, reload] = useLoad('/admin/memorials')

  const act = useAct(reload)

  if (!rows) {
    return <p>Loading privacy settings...</p>
  }


  /* UPDATE PRIVACY SETTINGS */

  const updatePrivacy = (m, patch) => {

    act(
      () => api.put(
        `/memorials/${m.id}/privacy`,
        patch
      ),
      'Privacy updated.'
    )

  }


  return (

    <>

      <p>
        Visibility is separate from cemetery type.
        Private memorials can be opened by administrators only.
      </p>


      <Table
        heads={[
          'Name',
          'Cemetery',
          'Visibility',
          'Candles',
          'Prayers',
          'Memories'
        ]}
      >

        {rows.map((m) => (

          <tr key={m.id}>

            <td>{m.name}</td>

            <td>
              {CEMETERY[m.cemetery_type] ||
                m.cemetery_type}
            </td>


            {/* VISIBILITY */}

            <td>

              <select
                value={m.visibility || 'public'}
                onChange={(e) =>
                  updatePrivacy(m, {
                    visibility: e.target.value
                  })
                }
              >

                <option value="public">
                  public
                </option>

                <option value="private">
                  private
                </option>

              </select>

            </td>


            {/* GUEST PERMISSIONS */}

            {['candles', 'prayers', 'memories'].map((key) => (

              <td key={key}>

                <input
                  className="chk"
                  type="checkbox"
                  aria-label={key}
                  checked={isEnabled(
                    m[`allow_${key}`]
                  )}
                  onChange={(e) =>
                    updatePrivacy(m, {
                      [`allow_${key}`]:
                        e.target.checked ? 1 : 0
                    })
                  }
                />

              </td>

            ))}

          </tr>

        ))}

      </Table>

    </>

  )

}
