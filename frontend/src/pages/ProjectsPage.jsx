import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { get, post, put, del } from '../api/client.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Plus, Pencil, Trash2, FolderOpen, BookOpen } from 'lucide-react'

function ProjectCard({ project, isAdmin, onEdit, onDelete, onClick }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5
                    hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-lg dark:hover:shadow-orange-500/5
                    transition-all group cursor-pointer flex flex-col gap-3"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
          <BookOpen size={18} />
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {project.description || 'No description'}
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400">
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 dark:hover:text-orange-400">
          <FolderOpen size={14} />
          Open
        </span>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = create
  const [formName, setFormName]     = useState('')
  const [formDesc, setFormDesc]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    try {
      const data = await get('/projects')
      setProjects(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditTarget(null)
    setFormName('')
    setFormDesc('')
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(project) {
    setEditTarget(project)
    setFormName(project.name)
    setFormDesc(project.description || '')
    setFormError('')
    setModalOpen(true)
  }

  async function handleSave() {
    if (!formName.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editTarget) {
        const updated = await put(`/projects/${editTarget.id}`, { name: formName, description: formDesc })
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const created = await post('/projects', { name: formName, description: formDesc })
        setProjects(prev => [created, ...prev])
      }
      setModalOpen(false)
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await del(`/projects/${deleteTarget.id}`)
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout breadcrumbs={[{ label: 'Projects' }]}>
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600
                         text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus size={16} />
              New Project
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 animate-pulse h-40" />
            ))}
          </div>
        )}

        {/* Grid */}
        {!loading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <BookOpen size={48} className="opacity-30 mb-3" />
            <p className="text-lg font-medium">No projects yet</p>
            {isAdmin && <p className="text-sm mt-1">Create your first project to get started</p>}
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                isAdmin={isAdmin}
                onClick={() => navigate(`/projects/${p.id}`)}
                onEdit={() => openEdit(p)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Project' : 'New Project'}
        size="sm"
      >
        <div className="p-5 space-y-4">
          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              autoFocus
              placeholder="My API Service"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              rows={3}
              placeholder="Optional project description"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600
                         disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editTarget ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete project?"
        message={`This will permanently delete "${deleteTarget?.name}" and all its methods.`}
        confirmLabel="Delete"
      />
    </Layout>
  )
}
