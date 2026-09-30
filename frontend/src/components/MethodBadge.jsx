const METHOD_STYLES = {
  GET:    'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  POST:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PUT:    'bg-amber-500/15 text-amber-500 border-amber-500/30',
  PATCH:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5 min-w-[46px]',
  md: 'text-xs px-2 py-1 min-w-[54px]',
  lg: 'text-sm px-2.5 py-1 min-w-[60px]',
}

export default function MethodBadge({ method, size = 'md' }) {
  const m = (method || 'GET').toUpperCase()
  const style = METHOD_STYLES[m] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  const sz = SIZE_CLASSES[size] || SIZE_CLASSES.md
  return (
    <span className={`inline-flex items-center justify-center font-bold font-mono rounded border ${style} ${sz} shrink-0`}>
      {m}
    </span>
  )
}
