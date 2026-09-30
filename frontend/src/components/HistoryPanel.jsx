import { useState, useEffect } from 'react'
import { X, Trash2, Clock, ChevronRight } from 'lucide-react'
import { get, del } from '../api/client.js'
import MethodBadge from './MethodBadge.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

function StatusBadge({ status }) {
  if (!status) return null
  const color = status >= 200 && status < 300
    ? 'text-emerald-500' : status >= 400 ? 'text-red-400' : 'text-amber-500'
  return <span className={`text-xs font-bold font-mono ${color}`}>{status}</span>
}

export default function HistoryPanel({ open, onClose, onSelect, refreshTrigger }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadHistory() {
    setLoading(true)
    try {
      const data = await get('/history?limit=50&offset=0')
      setItems(data.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) loadHistory()
  }, [open, refreshTrigger])

  async function deleteItem(id) {
    await del(`/history/${id}`)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function clearAll() {
    await del('/history')
    setItems([])
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Request History</h3>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-400 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
              <Clock size={28} className="opacity-40" />
              <span>No history yet</span>
            </div>
          )}
          {!loading && items.map(item => (
            <div
              key={item.id}
              className="group flex items-start gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              onClick={() => { onSelect?.(item); onClose() }}
            >
              <MethodBadge method={item.request?.method} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                  {item.methodName || item.request?.url}
                </div>
                <div className="text-xs text-gray-400 truncate font-mono mt-0.5">
                  {item.request?.url}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={item.response?.status} />
                  {item.response?.time && (
                    <span className="text-xs text-gray-400">{item.response.time}ms</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{formatTime(item.timestamp)}</span>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteItem(item.id) }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
