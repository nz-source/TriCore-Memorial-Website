
/* =========================================
   API CONFIGURATION
========================================= */

export const API =
  import.meta.env.VITE_API_URL ||
  'http://localhost/TriCore_Memorial_Website/backend/index.php'

// Public uploads folder beside index.php
const UPLOADS = new URL('uploads/', API).href


/* =========================================
   IMAGE PATH
========================================= */

export const img = (file) => {
  if (!file) return null

  return UPLOADS + encodeURIComponent(file)
}


/* =========================================
   API REQUEST HANDLER
========================================= */

async function req(path, { method = 'GET', body, form } = {}) {

  // Parse requested route and query parameters
  const incoming = new URL(path, window.location.origin)

  // PHP backend entry point
  const endpoint = new URL(API)

  // Clean route
  const route = incoming.pathname.replace(/^\/+|\/+$/g, '')

  // Send route to PHP
  endpoint.searchParams.set('route', route)

  // Preserve additional query parameters
  incoming.searchParams.forEach((value, key) => {
    endpoint.searchParams.set(key, value)
  })

  const options = {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  }

  // File uploads
  if (form) {
    options.body = form
  }

  // JSON requests
  else if (body !== undefined && body !== null) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(endpoint.href, options)

  } catch (error) {
    console.error('API connection error:', error)

    throw new Error(
      'Cannot connect to PHP API. Check Apache, API URL, and CORS settings.'
    )
  }

  // Read response
  const text = await response.text()

  let data = null

  if (text) {
    try {
      data = JSON.parse(text)

    } catch {
      console.error('Invalid PHP response:', text)

      throw new Error(
        `Invalid API response (${response.status}). Check PHP errors.`
      )
    }
  }

  // Handle HTTP errors
  if (!response.ok) {
    throw new Error(
      data?.error || `Request failed (${response.status})`
    )
  }

  return data
}


/* =========================================
   API METHODS
========================================= */

export const api = {

  get: (path) =>
    req(path),

  post: (path, body) =>
    req(path, {
      method: 'POST',
      body
    }),

  put: (path, body) =>
    req(path, {
      method: 'PUT',
      body
    }),

  del: (path) =>
    req(path, {
      method: 'DELETE'
    }),

  upload: (path, form) =>
    req(path, {
      method: 'POST',
      form
    })

}


/* =========================================
   DATE AND TIME HELPERS
========================================= */

export const fmtDate = (date) => (
  date
    ? new Date(date + 'T00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : ''
)


export const fmtTime = (time) => (
  time
    ? new Date('1970-01-01T' + time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    : ''
)


/* =========================================
   AGE CALCULATION
========================================= */

export const age = (birthDate, endDate) => (
  birthDate && endDate
    ? Math.floor(
        (new Date(endDate) - new Date(birthDate)) / 31557600000
      )
    : ''
)


/* =========================================
   CEMETERY TYPES
========================================= */

export const CEMETERY = {
  catholic: 'Catholic Cemetery',
  private: 'Private Cemetery',
  public: 'Public Cemetery'
}
