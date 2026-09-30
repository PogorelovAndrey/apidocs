import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { Sun, Moon, Terminal, LogOut, ChevronRight, User } from 'lucide-react'

export default function Layout({ children, breadcrumbs = [] }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 sticky top-0 z-40 shadow-sm">
        {/* Logo */}
        <Link to="/projects" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <Terminal size={15} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm hidden sm:block">API Docs</span>
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 overflow-hidden flex-1 min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight size={14} className="shrink-0 text-gray-400" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-700 dark:text-gray-200 font-medium truncate">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div className="flex items-center gap-2 ml-1 pl-2 border-l border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-6 h-6 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center">
                <User size={13} />
              </div>
              <span className="text-gray-700 dark:text-gray-300 hidden sm:block">{user?.username}</span>
              {user?.role === 'admin' && (
                <span className="text-xs bg-orange-500/15 text-orange-500 px-1.5 py-0.5 rounded font-medium hidden sm:block">
                  admin
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0">
        {children}
      </main>
    </div>
  )
}
