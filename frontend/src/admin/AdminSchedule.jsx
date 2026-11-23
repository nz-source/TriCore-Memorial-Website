
import { useState } from 'react'

import { api } from '../api'
import { useApp } from '../ctx'
import { useLoad, Table, useAct } from './util'

import { MemorialForm } from './AdminMemorials'


/* =========================================
   GET EXISTING SCHEDULE
========================================= */

function pick(m) {
  return {
    wake_date: m.wake_date || '',
    viewing_hours: m.viewing_hours || '',
    wake_location: m.wake_location || '',
    funeral_church: m.funeral_church || '',
    funeral_date: m.funeral_date || '',
    funeral_time: (m.funeral_time || '').slice(0, 5),
    presider: m.presider || ''
  }
}


/* =========================================
   SCHEDULE ROW
========================================= */

function Row({ m, reload }) {
  const [f, setF] = useState(() => pick(m))

  const act = useAct(reload)

  /* UPDATE INPUT */

  const update = (key, value) => {
    setF((prev) => ({
      ...prev,
      [key]: value
    }))
  }


  /* INPUT FIELD */

  const field = (key, type = 'text', width = 150) => (
    <input
      type={type}
      value={f[key]}
      onChange={(e) => update(key, e.target.value)}
      aria-label={key}
      style={{ minWidth: width }}
    />
  )


  /* VALIDATE SCHEDULE */

  const validate = () => {
    if (
      f.wake_date &&
      f.funeral_date &&
      f.funeral_date < f.wake_date
    ) {
      return 'Funeral date cannot be before the wake date.'
    }

    return null
  }


  /* RENDER SCHEDULE ROW */

  return (
    <tr>

      <td>{m.name}</td>

      <td>
        {field('wake_date', 'date', 130)}
      </td>

      <td>
        {field('viewing_hours')}
      </td>

      <td>
        {field('wake_location')}
      </td>

      <td>
        {field('funeral_church')}
      </td>

      <td>
        {field('funeral_date', 'date', 130)}
      </td>

      <td>
        {field('funeral_time', 'time', 110)}
      </td>

      <td>
        {field('presider')}
      </td>


      {/* ACTION BUTTONS */}

      <td style={{ whiteSpace: 'nowrap' }}>

        {/* SAVE SCHEDULE */}

        <button
          type="button"
          className="btn s"
          onClick={() =>
            act(
              async () => {
                const error = validate()

                if (error) {
                  throw new Error(error)
                }

                await api.put(
                  `/memorials/${m.id}/schedule`,
                  f
                )
              },
              'Schedule saved for ' + m.name + '.'
            )
          }
        >
          Save
        </button>

        {' '}


        {/* CLEAR SCHEDULE */}

        <button
          type="button"
          className="btn s d"
          onClick={() =>
            act(
              () =>
                api.del(
                  `/memorials/${m.id}/schedule`
                ),
              'Schedule cleared.',
              `Clear the wake and funeral schedule for ${m.name}?`
            )
          }
        >
          Clear
        </button>

        {' '}


        {/* DELETE MEMORIAL */}

        <button
          type="button"
          className="btn s d"
          onClick={() =>
            act(
              () =>
                api.del(
                  `/memorials/${m.id}`
                ),
              'Memorial deleted.',
              `Delete ${m.name} and everything shared on this memorial?`
            )
          }
        >
          Delete memorial
        </button>

      </td>

    </tr>
  )
}


/* =========================================
   WAKE AND FUNERAL SCHEDULE
========================================= */

export default function Schedule() {
  const { setModal } = useApp()

  const [rows, reload] = useLoad('/admin/memorials')


  /* LOADING STATE */

  if (!rows) {
    return <p>Loading schedules...</p>
  }


  /* SCHEDULE PAGE */

  return (
    <>

      {/* PAGE DESCRIPTION */}

      <p>
        Set, change or clear the wake and funeral schedule
        of each memorial, then choose Save.
        Rows are ordered by funeral date.
      </p>


      {/* ADD NEW MEMORIAL */}

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


      {/* SCHEDULE TABLE */}

      <Table
        heads={[
          'Name',
          'Wake date',
          'Viewing hours',
          'Wake location',
          'Church',
          'Funeral date',
          'Time',
          'Presider',
          ''
        ]}
      >

        {rows.map((m) => (
          <Row
            key={m.id}
            m={m}
            reload={reload}
          />
        ))}

      </Table>

    </>
  )
}
