import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useApp } from '../ctx'


/* =========================================
   LOAD DATA FROM API
========================================= */

export function useLoad(path) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      setErr('')

      const result = await api.get(path)

      setData(result)

    } catch (e) {
      setErr(e.message || 'Unable to load data.')
    }
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  return [data, load, err]
}


/* =========================================
   REUSABLE TABLE COMPONENT
========================================= */

export const Table = ({
  heads,
  children,
  empty = 'Nothing here yet.'
}) => {
  const hasRows = Array.isArray(children)
    ? children.length > 0
    : Boolean(children)

  return (
    <div className="tw">
      <table>

        <thead>
          <tr>
            {heads.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {hasRows ? children : (
            <tr>
              <td colSpan={heads.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>

      </table>
    </div>
  )
}


/* =========================================
   API ACTION HANDLER
========================================= */

/**
 * Runs an API action, displays a toast notification,
 * and reloads data after a successful operation.
 */

export function useAct(reload) {
  const { toast } = useApp()

  return async (fn, ok, confirmMsg) => {

    // CONFIRM ACTION
    if (confirmMsg && !window.confirm(confirmMsg)) {
      return false
    }

    try {

      // EXECUTE API REQUEST
      await fn()

      // SUCCESS MESSAGE
      if (ok) {
        toast(ok)
      }

      // RELOAD DATA
      if (reload) {
        await reload()
      }

      return true

    } catch (e) {

      // ERROR MESSAGE
      toast(e.message || 'Something went wrong.')

      return false
    }
  }
}
