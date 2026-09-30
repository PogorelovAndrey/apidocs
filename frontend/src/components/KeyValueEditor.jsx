import { Plus, Trash2 } from 'lucide-react'

export default function KeyValueEditor({ rows = [], onChange, placeholder = { key: 'Key', value: 'Value' }, showEnabled = true }) {
  function addRow() {
    onChange([...rows, { key: '', value: '', enabled: true }])
  }

  function removeRow(i) {
    onChange(rows.filter((_, idx) => idx !== i))
  }

  function updateRow(i, field, val) {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="grid gap-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              {showEnabled && (
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={e => updateRow(i, 'enabled', e.target.checked)}
                  className="w-4 h-4 accent-orange-500 shrink-0"
                />
              )}
              <input
                type="text"
                value={row.key}
                onChange={e => updateRow(i, 'key', e.target.value)}
                placeholder={placeholder.key}
                className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                           placeholder-gray-400 font-mono"
              />
              <input
                type="text"
                value={row.value}
                onChange={e => updateRow(i, 'value', e.target.value)}
                placeholder={placeholder.value}
                className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                           placeholder-gray-400 font-mono"
              />
              <button
                onClick={() => removeRow(i)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors"
      >
        <Plus size={15} />
        Add row
      </button>
    </div>
  )
}
