import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import MethodBadge from '../components/MethodBadge.jsx'
import MethodEditor from '../components/MethodEditor.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { get, post, del } from '../api/client.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Plus, Search, X, ArrowRight } from 'lucide-react'

const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [project, setProject]   = useState(null)
  const [methods, setMethods]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [search, setSearch]           = useState('')
  const [filterMethod, setFilterMethod] = useState('ALL')

  const [editorOpen, setEditorOpen]     = useState(false)
  const [savingMethod, setSavingMethod] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    load()
  }, [projectId])

  async function load() {
    setLoading(true)
    try {
      const [projects, meths] = await Promise.all([
        get('/projects'),
        get(`/projects/${projectId}/methods`),
      ])
      const proj = (projects || []).find(p => p.id === projectId)
      setProject(proj || null)
      setMethods(meths || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = methods.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.url?.toLowerCase().includes(search.toLowerCase())
    const matchMethod = filterMethod === 'ALL' || m.method === filterMethod
    return matchSearch && matchMethod
  })

  async function handleCreateMethod(form) {
    setSavingMethod(true)
    try {
      const created = await post(`/projects/${projectId}/methods`, form)
      setMethods(prev => [...prev, created])
      setEditorOpen(false)
      navigate(`/projects/${projectId}/methods/${created.id}`)
    } catch (e) {
      alert(e.message)
    } finally {
      setSavingMethod(false)
    }
  }

  async function handleDeleteMethod() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await del(`/methods/${deleteTarget.id}`)
      setMethods(prev => prev.filter(m => m.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout
      breadcrumbs={[
        { label: 'Projects', to: '/projects' },
        { label: project?.name || '…' },
      ]}
    >
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{project?.name || 'Loading…'}</h1>
            {project?.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{project.description}</p>
            )}
            <p className="text-sm text-gray-400 mt-1">{methods.length} endpoint{methods.length !== 1 ? 's' : ''}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setEditorOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600
                         text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus size={16} />
              Add Method
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search endpoints…"
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {HTTP_METHODS.map(m => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors
                  ${filterMethod === m
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 h-16 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Search size={36} className="opacity-30 mb-3" />
            <p className="font-medium">{methods.length === 0 ? 'No endpoints yet' : 'No results'}</p>
            {methods.length === 0 && isAdmin && (
              <p className="text-sm mt-1">Add your first endpoint to get started</p>
            )}
          </div>
        )}

        {/* Method list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(m => (
              <Link
                key={m.id}
                to={`/projects/${projectId}/methods/${m.id}`}
                className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                           rounded-xl hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-sm transition-all group"
              >
                <MethodBadge method={m.method} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                    {m.name}
                  </div>
                  <div className="text-xs text-gray-400 font-mono truncate mt-0.5">{m.url}</div>
                </div>
                <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-orange-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Add method modal */}
      <MethodEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleCreateMethod}
        loading={savingMethod}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMethod}
        loading={deleting}
        title="Delete endpoint?"
        message={`This will permanently delete "${deleteTarget?.name}".`}
        confirmLabel="Delete"
      />
    </Layout>
  )
}
