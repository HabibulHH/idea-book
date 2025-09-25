import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import IdeaParkingLot from '@/components/IdeaParkingLot'
import ExecutionPipeline from '@/components/ExecutionPipeline'
import { TaskManager } from '@/components/TaskManager'
import { TodayView } from '@/components/TodayView'
import { NewsFeed } from '@/components/NewsFeed'
import { Books } from '@/components/Books'
import People from '@/components/People'
import { Login } from '@/components/Login'
import { ConfigModal } from '@/components/ConfigModal'
import type { AppData } from '@/types'
import data from '@/data.json'
import { loadData, saveData } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { Lightbulb, ArrowRight, Calendar, Briefcase, Download, Upload, Sun, User, Menu, Moon, Newspaper, BookOpen, Settings, Users } from 'lucide-react'
import { useLoading } from '@/hooks/useLoading'

function App() {
  const [appData, setAppData] = useState<AppData>(data as AppData)
  const [activeSection, setActiveSection] = useState('today')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const { isLoadingKey, withLoading } = useLoading()

  // Check Supabase auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setIsAuthenticated(true)
          setUser(session.user)
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      }
    )

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true)
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.classList.add('no-scroll')
    } else {
      document.body.classList.remove('no-scroll')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('no-scroll')
    }
  }, [isMobileSidebarOpen])

  const handleLogin = () => {
    // This will be called by the Login component after successful Supabase auth
    // The auth state change listener will handle setting isAuthenticated
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setUser(null)
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const handleNavigation = (sectionId: string) => {
    setActiveSection(sectionId)
    setIsMobileSidebarOpen(false) // Close mobile sidebar when navigating
  }

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Load data from Supabase on app start
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const loadedData = await loadData()
        setAppData(loadedData)
      } catch (error) {
        console.error('Error loading data:', error)
        // Fall back to default data if loading fails
        setAppData(data as AppData)
      }
    }
    loadAppData()
  }, [])

  const exportData = async () => {
    await withLoading(async () => {
      const dataStr = JSON.stringify(appData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'self-management-data.json'
      a.click()
      URL.revokeObjectURL(url)
    }, 'save-data')
  }

  // Auto-save data when it changes
  useEffect(() => {
    const autoSave = async () => {
      try {
        await saveData(appData)
      } catch (error) {
        console.error('Error auto-saving data:', error)
      }
    }

    // Don't auto-save on initial load (when lastUpdated is from data.json)
    if (appData.lastUpdated !== (data as AppData).lastUpdated) {
      autoSave()
    }
  }, [appData])

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await withLoading(async () => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = async (e) => {
            try {
              const newData = JSON.parse(e.target?.result as string)
              // Save imported data to Supabase
              await saveData(newData)
              setAppData(newData)
              resolve()
            } catch (error) {
              console.error('Error loading data:', error)
              reject(error)
            }
          }
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsText(file)
        })
      }, 'load-data')
    }
  }

  useEffect(() => {
    setAppData(prev => ({ ...prev, lastUpdated: new Date().toISOString() }))
  }, [appData.ideas, appData.executionPipelines, appData.repeatedTasks, appData.nonRepeatedTasks])

  const navigationItems = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'newsfeed', label: 'Newsfeed', icon: Newspaper },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'people', label: 'People', icon: Users },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'pipeline', label: 'Pipeline', icon: ArrowRight },
    { id: 'daily', label: 'Daily Tasks', icon: Calendar },
    { id: 'office', label: 'Office Tasks', icon: Briefcase },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'today':
        return <TodayView data={appData} setData={setAppData} />
      case 'newsfeed':
        return <NewsFeed data={appData} setData={setAppData} />
      case 'books':
        return <Books />
      case 'people':
        return <People />
      case 'ideas':
        return <IdeaParkingLot data={appData} setData={setAppData} />
      case 'pipeline':
        return <ExecutionPipeline data={appData} setData={setAppData} />
      case 'daily':
        return (
          <TaskManager
            type="repeated"
            tasks={appData.repeatedTasks}
            onUpdateTasks={(tasks) => setAppData(prev => ({ ...prev, repeatedTasks: tasks }))}
          />
        )
      case 'office':
        return (
          <TaskManager
            type="oneTime"
            tasks={appData.nonRepeatedTasks}
            onUpdateTasks={(tasks) => setAppData(prev => ({ ...prev, nonRepeatedTasks: tasks }))}
          />
        )
      default:
        return <TodayView data={appData} setData={setAppData} />
    }
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button
            onClick={toggleMobileSidebar}
            variant="ghost"
            size="sm"
            className="p-2 text-gray-600 dark:text-gray-300"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Self Manager</h1>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-screen
        lg:relative lg:translate-x-0 lg:z-auto
        fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex-1">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Self Manager
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organize your workflow
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 ease-in-out hover-lift ${
                    activeSection === item.id
                      ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Data Management */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Data</h3>
            <div className="space-y-2">
              <Button
                onClick={exportData}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                loading={isLoadingKey('save-data')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <label className="block relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                  loading={isLoadingKey('load-data')}
                >
                  <span>
                    {isLoadingKey('load-data') ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </>
                    )}
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  disabled={isLoadingKey('load-data')}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Profile Section - Bottom Left */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
          
          {/* Theme Toggle */}
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className="w-full mb-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            {isDarkMode ? (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Dark Mode
              </>
            )}
          </Button>
          
          {/* Configuration */}
          <Button
            onClick={() => setShowConfigModal(true)}
            variant="outline"
            size="sm"
            className="w-full mb-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0 ml-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="transition-all duration-300 ease-in-out">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigModal 
        isOpen={showConfigModal} 
        onClose={() => setShowConfigModal(false)} 
      />
    </div>
  )
}

export default App
