import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Layout from '../components/Layout.jsx'
import MethodBadge from '../components/MethodBadge.jsx'
import HttpClient from '../components/HttpClient.jsx'
import HistoryPanel from '../components/HistoryPanel.jsx'
import MethodEditor from '../components/MethodEditor.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { get, put, del } from '../api/client.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Pencil, Trash2, History, Clock } from 'lucide-react'

const TABS = ['Description', 'Parameters', 'Request', 'Response Examples', 'Test']

function ParamTable({ title, rows }) {
  if (!rows || rows.length === 0) return null
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 w-8">On</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">Key</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={r.enabled === false ? 'opacity-40' : ''}>
                <td className="px-3 py-2 border border-gray-200 dark:border-gray-700 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${r.enabled !== false ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                </td>
                <td className="px-3 py-2 border border-gray-200 dark:border-gray-700 font-mono text-blue-500 dark:text-blue-400">{r.key}</td>
                <td className="px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
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

function colorizeJson(jsonStr) {
  return jsonStr
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>')
}

function formatJson(text) {
  try { return JSON.stringify(JSON.parse(text), null, 2) } catch { return text }
}

export default function MethodPage() {
  const { projectId, methodId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [method, setMethod]   = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState('Description')

  const [editorOpen, setEditorOpen]     = useState(false)
  const [saving, setSaving]             = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [historyOpen, setHistoryOpen]   = useState(false)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  useEffect(() => {
    load()
  }, [methodId, projectId])

  async function load() {
    setLoading(true)
    try {
      const [m, projects] = await Promise.all([
        get(`/methods/${methodId}`),
        get('/projects'),
      ])
      setMethod(m)
      const proj = (projects || []).find(p => p.id === projectId)
      setProject(proj || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form) {
    setSaving(true)
    try {
      const updated = await put(`/methods/${methodId}`, form)
      setMethod(updated)
      setEditorOpen(false)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await del(`/methods/${methodId}`)
      navigate(`/projects/${projectId}`)
    } catch (e) {
      setError(e.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Layout breadcrumbs={[{ label: 'Projects', to: '/projects' }]}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (error || !method) {
    return (
      <Layout breadcrumbs={[{ label: 'Projects', to: '/projects' }]}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400">{error || 'Method not found'}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      breadcrumbs={[
        { label: 'Projects', to: '/projects' },
        { label: project?.name || projectId, to: `/projects/${projectId}` },
        { label: method.name },
      ]}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Method header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-start justify-between gap-4 max-w-6xl mx-auto">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <MethodBadge method={method.method} size="lg" />
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{method.name}</h1>
              </div>
              <div className="font-mono text-sm text-gray-500 dark:text-gray-400 truncate bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5 inline-block max-w-full">
                {method.url}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <History size={15} />
                <span className="hidden sm:inline">History</span>
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => setEditorOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400
                               bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Pencil size={15} />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500
                               bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={15} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 border-b-0 max-w-6xl mx-auto overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                  ${tab === t
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">

            {/* Description */}
            {tab === 'Description' && (
              <div className="markdown-body text-gray-700 dark:text-gray-300 max-w-3xl">
                {method.description ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{method.description}</ReactMarkdown>
                ) : (
                  <p className="text-gray-400 italic">No description provided.</p>
                )}
              </div>
            )}

            {/* Parameters */}
            {tab === 'Parameters' && (
              <div className="max-w-3xl">
                {!method.headers?.length && !method.queryParams?.length && !method.pathParams?.length ? (
                  <p className="text-gray-400 italic text-sm">No parameters defined.</p>
                ) : (
                  <>
                    <ParamTable title="Headers" rows={method.headers} />
                    <ParamTable title="Query Parameters" rows={method.queryParams} />
                    <ParamTable title="Path Parameters" rows={method.pathParams} />
                  </>
                )}
              </div>
            )}

            {/* Request */}
            {tab === 'Request' && (
              <div className="max-w-3xl space-y-4">
                {/* Auth */}
                {method.auth?.type && method.auth.type !== 'none' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Authentication</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Type: </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {method.auth.type === 'bearer' ? 'Bearer Token' : method.auth.type === 'apiKey' ? 'API Key' : 'Basic Auth'}
                      </span>
                    </div>
                  </div>
                )}
                {/* Body */}
                {method.body ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Request Body</h3>
                    <div
                      className="bg-gray-950 rounded-lg border border-gray-800 p-4 overflow-auto text-xs font-mono leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: colorizeJson(formatJson(method.body)) }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">No request body.</p>
                )}
              </div>
            )}

            {/* Response Examples */}
            {tab === 'Response Examples' && (
              <div className="max-w-3xl space-y-4">
                {!method.responses?.length ? (
                  <p className="text-gray-400 italic text-sm">No example responses defined.</p>
                ) : (
                  method.responses.map((r, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <StatusBadge status={r.status} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.description}</span>
                      </div>
                      {r.body && (
                        <div
                          className="bg-gray-950 p-4 overflow-auto text-xs font-mono leading-relaxed max-h-64"
                          dangerouslySetInnerHTML={{ __html: colorizeJson(formatJson(r.body)) }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Test */}
            {tab === 'Test' && (
              <HttpClient
                method={{ ...method, projectName: project?.name }}
                onHistoryUpdate={() => setHistoryRefresh(n => n + 1)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Editors / Dialogs */}
      <MethodEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        initial={method}
        loading={saving}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete endpoint?"
        message={`This will permanently delete "${method.name}".`}
        confirmLabel="Delete"
      />

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        refreshTrigger={historyRefresh}
        onSelect={(item) => {
          // Pre-fill — switch to test tab; HttpClient syncs from methodData on re-render
          setTab('Test')
        }}
      />
    </Layout>
  )
}
