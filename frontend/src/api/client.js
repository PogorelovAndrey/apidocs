const BASE_URL = '/api'

function getToken() {
  return localStorage.getItem('api_docs_token')
}

function handleUnauthorized() {
  localStorage.removeItem('api_docs_token')
  window.location.href = '/login'
}

async function request(method, path, body) {
  const headers = {
    'Content-Type': 'application/json',
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = {
    method,
    headers,
  }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(`${BASE_URL}${path}`, options)

  if (res.status === 401) {
    handleUnauthorized()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = err.message || err.error || msg
    } catch {
      // ignore parse error
    }
    throw new Error(msg)
  }

  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

export const get  = (path)              => request('GET',    path)
export const post = (path, body)        => request('POST',   path, body)
export const put  = (path, body)        => request('PUT',    path, body)
export const del  = (path)              => request('DELETE', path)
