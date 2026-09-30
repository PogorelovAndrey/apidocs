import { useState, useEffect, useRef } from 'react'
import { Send, Clock, ChevronDown, ChevronUp, History } from 'lucide-react'
import KeyValueEditor from './KeyValueEditor.jsx'
import { post as apiPost } from '../api/client.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'apiKey', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
]

function formatJson(text) {
  try {
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return text
  }
}

function colorizeJson(jsonStr) {
  return jsonStr
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>')
}

function StatusBadge({ status }) {
  if (!status) return null
  const color = status >= 200 && status < 300
    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
    : status >= 400
    ? 'bg-red-500/15 text-red-400 border-red-500/30'
    : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${color}`}>
      {status}
    </span>
  )
}

export default function HttpClient({ method: methodData, onHistoryUpdate }) {
  const { user } = useAuth()

  const [reqMethod, setReqMethod] = useState(methodData?.method || 'GET')
  const [reqUrl, setReqUrl]       = useState(methodData?.url || '')
  const [tab, setTab]             = useState('Headers')
  const [headers, setHeaders]     = useState(methodData?.headers || [])
  const [query, setQuery]         = useState(methodData?.queryParams || [])
  const [bodyText, setBodyText]   = useState(methodData?.body || '')
  const [auth, setAuth]           = useState(methodData?.auth || { type: 'none', token: '', apiKey: '', apiKeyName: 'X-API-Key', username: '', password: '' })

  const [sending, setSending]         = useState(false)
  const [response, setResponse]       = useState(null)
  const [headersOpen, setHeadersOpen] = useState(false)

  // Sync when methodData changes
  useEffect(() => {
    if (methodData) {
      setReqMethod(methodData.method || 'GET')
      setReqUrl(methodData.url || '')
      setHeaders(methodData.headers || [])
      setQuery(methodData.queryParams || [])
      setBodyText(methodData.body || '')
      setAuth(methodData.auth || { type: 'none', token: '', apiKey: '', apiKeyName: 'X-API-Key', username: '', password: '' })
    }
  }, [methodData?.id])

  function setAuthField(field, val) {
    setAuth(a => ({ ...a, [field]: val }))
  }

  function buildUrl() {
    const enabledQuery = query.filter(q => q.enabled !== false && q.key)
    if (!enabledQuery.length) return reqUrl
    const params = new URLSearchParams()
    enabledQuery.forEach(q => params.append(q.key, q.value))
    return `${reqUrl}${reqUrl.includes('?') ? '&' : '?'}${params.toString()}`
  }

  function buildHeaders() {
    const h = {}
    headers.filter(r => r.enabled !== false && r.key).forEach(r => { h[r.key] = r.value })
    // Auth
    if (auth.type === 'bearer' && auth.token) {
      h['Authorization'] = `Bearer ${auth.token}`
    } else if (auth.type === 'apiKey' && auth.apiKey) {
      h[auth.apiKeyName || 'X-API-Key'] = auth.apiKey
    } else if (auth.type === 'basic' && auth.username) {
      h['Authorization'] = `Basic ${btoa(`${auth.username}:${auth.password}`)}`
    }
    if (['POST', 'PUT', 'PATCH'].includes(reqMethod) && bodyText) {
      h['Content-Type'] = h['Content-Type'] || 'application/json'
    }
    return h
  }

  async function sendRequest() {
    setSending(true)
    setResponse(null)
    const url = buildUrl()
    const reqHeaders = buildHeaders()
    const start = Date.now()

    try {
      const fetchOptions = {
        method: reqMethod,
        headers: reqHeaders,
      }
      if (['POST', 'PUT', 'PATCH'].includes(reqMethod) && bodyText.trim()) {
        fetchOptions.body = bodyText
      }

      const res = await fetch(url, fetchOptions)
      const time = Date.now() - start
      const resText = await res.text()
      const resHeaders = {}
      res.headers.forEach((v, k) => { resHeaders[k] = v })

      const result = {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: resText,
        time,
      }
      setResponse(result)

      // Save to history
      try {
        const entry = {
          methodId: methodData?.id,
          methodName: methodData?.name || url,
          projectName: methodData?.projectName || '',
          request: { method: reqMethod, url, headers: reqHeaders, body: bodyText || null },
          response: result,
          timestamp: new Date().toISOString(),
          userId: user?.id,
        }
        await apiPost('/history', entry)
        onHistoryUpdate?.()
      } catch {
        // history save failure is non-critical
      }
    } catch (err) {
      const time = Date.now() - start
      setResponse({ error: err.message, time })
    } finally {
      setSending(false)
    }
  }

  const TABS = ['Headers', 'Query', 'Body', 'Auth']

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* URL bar */}
      <div className="flex gap-2 mb-4">
        <select
          value={reqMethod}
          onChange={e => setReqMethod(e.target.value)}
          className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-bold font-mono
                     focus:outline-none focus:ring-2 focus:ring-orange-500 shrink-0"
        >
          {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m}>{m}</option>)}
        </select>
        <input
          type="url"
          value={reqUrl}
          onChange={e => setReqUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendRequest()}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     placeholder-gray-400 min-w-0"
        />
        <button
          onClick={sendRequest}
          disabled={sending || !reqUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600
                     text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors shrink-0"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Send size={15} />}
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>

      {/* Request tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${tab === t
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="mb-4 min-h-[120px]">
        {tab === 'Headers' && (
          <KeyValueEditor rows={headers} onChange={setHeaders} placeholder={{ key: 'Header', value: 'Value' }} />
        )}
        {tab === 'Query' && (
          <KeyValueEditor rows={query} onChange={setQuery} placeholder={{ key: 'Param', value: 'Value' }} />
        )}
        {tab === 'Body' && (
          <textarea
            value={bodyText}
            onChange={e => setBodyText(e.target.value)}
            rows={8}
            placeholder={'{\n  "key": "value"\n}'}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                       text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm font-mono
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       placeholder-gray-400 resize-none"
          />
        )}
        {tab === 'Auth' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auth Type</label>
              <select
                value={auth.type}
                onChange={e => setAuthField('type', e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {AUTH_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {auth.type === 'bearer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token</label>
                <input type="text" value={auth.token} onChange={e => setAuthField('token', e.target.value)} placeholder="Bearer token..." className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            )}
            {auth.type === 'apiKey' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Header Name</label>
                  <input type="text" value={auth.apiKeyName} onChange={e => setAuthField('apiKeyName', e.target.value)} placeholder="X-API-Key" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Value</label>
                  <input type="text" value={auth.apiKey} onChange={e => setAuthField('apiKey', e.target.value)} placeholder="your-api-key" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            )}
            {auth.type === 'basic' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input type="text" value={auth.username} onChange={e => setAuthField('username', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input type="password" value={auth.password} onChange={e => setAuthField('password', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response panel */}
      {response && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
          {/* Response meta */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Response</span>
            {response.error ? (
              <span className="text-xs text-red-400 font-medium">Network Error: {response.error}</span>
            ) : (
              <>
                <StatusBadge status={response.status} />
                <span className="text-xs text-gray-400">{response.statusText}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                  <Clock size={12} />
                  {response.time}ms
                </span>
              </>
            )}
          </div>

          {/* Response headers */}
          {response.headers && Object.keys(response.headers).length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setHeadersOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2 transition-colors"
              >
                {headersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                Response Headers ({Object.keys(response.headers).length})
              </button>
              {headersOpen && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs font-mono">
                      <span className="text-blue-400 shrink-0">{k}:</span>
                      <span className="text-gray-600 dark:text-gray-300 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Response body */}
          {response.body !== undefined && (
            <div
              className="bg-gray-950 rounded-lg border border-gray-800 p-4 overflow-auto max-h-96 text-xs font-mono leading-relaxed"
              dangerouslySetInnerHTML={{ __html: colorizeJson(formatJson(response.body)) }}
            />
          )}
        </div>
      )}
    </div>
  )
}
