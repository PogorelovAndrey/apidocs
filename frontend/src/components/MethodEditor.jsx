import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'
import KeyValueEditor from './KeyValueEditor.jsx'
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const AUTH_TYPES = ['none', 'bearer', 'apiKey', 'basic']
const TABS = ['Basic', 'Headers', 'Query Params', 'Path Params', 'Body', 'Auth', 'Responses']

const EMPTY_METHOD = {
  name: '',
  method: 'GET',
  url: '',
  description: '',
  headers: [],
  queryParams: [],
  pathParams: [],
  body: '',
  auth: { type: 'none', token: '', apiKey: '', apiKeyName: 'X-API-Key', username: '', password: '' },
  responses: [],
}

export default function MethodEditor({ open, onClose, onSave, initial = null, loading = false }) {
  const [tab, setTab] = useState('Basic')
  const [form, setForm] = useState(EMPTY_METHOD)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (open) {
      setTab('Basic')
      setForm(initial ? { ...EMPTY_METHOD, ...initial } : EMPTY_METHOD)
      setPreview(false)
    }
  }, [open, initial])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setAuth(field, value) {
    setForm(f => ({ ...f, auth: { ...f.auth, [field]: value } }))
  }

  function addResponse() {
    setForm(f => ({
      ...f,
      responses: [...f.responses, { status: 200, description: 'Success', body: '{}' }]
    }))
  }

  function updateResponse(i, field, val) {
    const next = form.responses.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    setForm(f => ({ ...f, responses: next }))
  }

  function removeResponse(i) {
    setForm(f => ({ ...f, responses: f.responses.filter((_, idx) => idx !== i) }))
  }

  function handleSave() {
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Method' : 'New Method'} size="xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto shrink-0 px-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${tab === t
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4 min-h-[300px]">
        {/* Basic */}
        {tab === 'Basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Get users"
                className="w-full input-base"
              />
            </div>
            <div className="flex gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Method</label>
                <select
                  value={form.method}
                  onChange={e => set('method', e.target.value)}
                  className="input-base font-mono font-bold"
                >
                  {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">URL</label>
                <input
                  type="text"
                  value={form.url}
                  onChange={e => set('url', e.target.value)}
                  placeholder="https://api.example.com/users"
                  className="w-full input-base font-mono"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Markdown)</label>
                <button
                  onClick={() => setPreview(p => !p)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                  {preview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {preview ? (
                <div className="markdown-body text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[120px]">
                  {form.description || <span className="text-gray-400">No description</span>}
                </div>
              ) : (
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={6}
                  placeholder="## Description&#10;Describe this endpoint..."
                  className="w-full input-base font-mono resize-none text-sm"
                />
              )}
            </div>
          </div>
        )}

        {/* Headers */}
        {tab === 'Headers' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Default headers sent with this request</p>
            <KeyValueEditor
              rows={form.headers}
              onChange={val => set('headers', val)}
              placeholder={{ key: 'Header name', value: 'Value' }}
            />
          </div>
        )}

        {/* Query Params */}
        {tab === 'Query Params' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Default query parameters</p>
            <KeyValueEditor
              rows={form.queryParams}
              onChange={val => set('queryParams', val)}
              placeholder={{ key: 'Param name', value: 'Value' }}
            />
          </div>
        )}

        {/* Path Params */}
        {tab === 'Path Params' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Path parameter values</p>
            <KeyValueEditor
              rows={form.pathParams}
              onChange={val => set('pathParams', val)}
              placeholder={{ key: ':param', value: 'Value' }}
            />
          </div>
        )}

        {/* Body */}
        {tab === 'Body' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Request Body (JSON)</label>
            <textarea
              value={form.body}
              onChange={e => set('body', e.target.value)}
              rows={12}
              placeholder={'{\n  "key": "value"\n}'}
              className="w-full input-base font-mono text-sm resize-none"
            />
          </div>
        )}

        {/* Auth */}
        {tab === 'Auth' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Auth Type</label>
              <select
                value={form.auth.type}
                onChange={e => setAuth('type', e.target.value)}
                className="input-base"
              >
                {AUTH_TYPES.map(t => (
                  <option key={t} value={t}>{t === 'none' ? 'None' : t === 'bearer' ? 'Bearer Token' : t === 'apiKey' ? 'API Key' : 'Basic Auth'}</option>
                ))}
              </select>
            </div>
            {form.auth.type === 'bearer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Token</label>
                <input type="text" value={form.auth.token} onChange={e => setAuth('token', e.target.value)} placeholder="Bearer token..." className="w-full input-base font-mono" />
              </div>
            )}
            {form.auth.type === 'apiKey' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Header Name</label>
                  <input type="text" value={form.auth.apiKeyName} onChange={e => setAuth('apiKeyName', e.target.value)} placeholder="X-API-Key" className="w-full input-base font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">API Key Value</label>
                  <input type="text" value={form.auth.apiKey} onChange={e => setAuth('apiKey', e.target.value)} placeholder="your-api-key" className="w-full input-base font-mono" />
                </div>
              </div>
            )}
            {form.auth.type === 'basic' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                  <input type="text" value={form.auth.username} onChange={e => setAuth('username', e.target.value)} className="w-full input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <input type="password" value={form.auth.password} onChange={e => setAuth('password', e.target.value)} className="w-full input-base" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Responses */}
        {tab === 'Responses' && (
          <div className="space-y-4">
            {form.responses.map((r, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                    <input
                      type="number"
                      value={r.status}
                      onChange={e => updateResponse(i, 'status', parseInt(e.target.value) || 200)}
                      className="w-full input-base font-mono text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={r.description}
                      onChange={e => updateResponse(i, 'description', e.target.value)}
                      placeholder="Success"
                      className="w-full input-base text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeResponse(i)}
                    className="p-2 mt-5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Body (JSON)</label>
                  <textarea
                    value={r.body}
                    onChange={e => updateResponse(i, 'body', e.target.value)}
                    rows={4}
                    className="w-full input-base font-mono text-xs resize-none"
                    placeholder="{}"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addResponse}
              className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
            >
              <Plus size={15} />
              Add example response
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
                     bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                     disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !form.name || !form.url}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {initial ? 'Save Changes' : 'Create Method'}
        </button>
      </div>

      {/* Inline input style via style tag - Tailwind @apply equivalent */}
      <style>{`
        .input-base {
          background-color: rgb(249 250 251);
          border: 1px solid rgb(229 231 235);
          color: rgb(17 24 39);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
        }
        .dark .input-base {
          background-color: rgb(31 41 55);
          border-color: rgb(55 65 81);
          color: rgb(243 244 246);
        }
        .input-base:focus {
          border-color: transparent;
          box-shadow: 0 0 0 2px rgb(249 115 22);
        }
        .input-base::placeholder { color: rgb(156 163 175); }
      `}</style>
    </Modal>
  )
}
