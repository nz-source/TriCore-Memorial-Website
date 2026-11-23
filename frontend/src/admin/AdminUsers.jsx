import { useState } from 'react'
import { api, fmtDate } from '../api'
import { useApp } from '../ctx'
import { useLoad, Table, useAct } from './util'

export default function Users() {
  const { user } = useApp()

  const [rows, reload] = useLoad('/users')
  const [busy, setBusy] = useState(false)

  const act = useAct(reload)

  if (!rows) {
    return <p>Loading administrator accounts...</p>
  }

  // CREATE ADMINISTRATOR ACCOUNT
  const add = async (e) => {
    e.preventDefault()

    if (busy) return

    const form = e.currentTarget

    const b = {
      name: form.n.value.trim(),
      email: form.e.value.trim(),
      password: form.p.value
    }

    if (b.password.length < 8) {
      return
    }

    setBusy(true)

    try {
      await act(
        async () => {
          await api.post('/users', b)
          form.reset()
        },
        'Account created.'
      )
    } finally {
      setBusy(false)
    }
  }

  // FORMAT DATE
  const date = (value) => {
    if (!value) return '-'

    return fmtDate(value.slice(0, 10))
  }

  return (
    <>
      <p>
        Only administrators have accounts.
        Visitors do not need to register.
      </p>

      {/* CREATE ADMIN FORM */}
      <form
        onSubmit={add}
        className="two"
        style={{ maxWidth: 620 }}
      >
        <div>
          <label>Name</label>

          <input
            name="n"
            type="text"
            maxLength={120}
            required
            placeholder="Enter administrator name"
          />
        </div>

        <div>
          <label>Email</label>

          <input
            name="e"
            type="email"
            maxLength={160}
            required
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label>Password (8+ characters)</label>

          <input
            name="p"
            type="password"
            minLength={8}
            required
            placeholder="Enter password"
          />
        </div>

        <p style={{ alignSelf: 'end' }}>
          <button
            className="btn"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Creating...' : 'Create administrator'}
          </button>
        </p>
      </form>

      {/* ADMINISTRATOR TABLE */}
      <Table
        heads={[
          'Name',
          'Email',
          'Role',
          'Created',
          ''
        ]}
      >
        {rows.map((u) => (
          <tr key={u.id}>

            <td>{u.name}</td>

            <td>{u.email}</td>

            <td>Administrator</td>

            <td>{date(u.created_at)}</td>

            <td>
              {Number(u.id) !== Number(user.id) && (
                <button
                  className="btn s d"
                  onClick={() =>
                    act(
                      () => api.del('/users/' + u.id),
                      'Account deleted.',
                      `Delete ${u.email}?`
                    )
                  }
                >
                  Delete
                </button>
              )}
            </td>

          </tr>
        ))}
      </Table>

      {rows.length === 0 && (
        <p>No administrator accounts found.</p>
      )}
    </>
  )
}