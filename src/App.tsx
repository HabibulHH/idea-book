import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { Login } from '@/components/Login'
import { ConfigModal } from '@/components/ConfigModal'
import { ChatInterface } from '@/components/ChatInterface'
import { AppRoutes } from '@/routes'
import type { AppData } from '@/types'
import data from '@/data.json'
import { loadData } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import { Lightbulb, ArrowRight, Sun, User, Menu, Moon, Newspaper, BookOpen, Settings, Users, ChevronLeft, AlignJustify, Calendar, FolderOpen } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

function App() {
  const [appData, setAppData] = useState<AppData>({
    ...data as AppData,
    regularTasks: (data as AppData).regularTasks || []
  })
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false)
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Check Supabase auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.log('Session error:', error)
        setIsAuthenticated(false)
        setUser(null)
      } else if (session?.user) {
        console.log('User authenticated:', session.user.id)
        setIsAuthenticated(true)
        setUser(session.user)
      } else {
        console.log('No active session')
        setIsAuthenticated(false)
        setUser(null)
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

  const toggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)
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
        setIsInitialLoading(true)
        const loadedData = await loadData()
        
        // Deduplicate tasks to prevent duplicates
        const deduplicatedData = {
          ...loadedData,
          nonRepeatedTasks: loadedData.nonRepeatedTasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          ),
          repeatedTasks: loadedData.repeatedTasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          ),
          regularTasks: (loadedData.regularTasks || []).filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          )
        }
        
        // Additional cleanup: remove tasks with identical content (title + description)
        const cleanedData = {
          ...deduplicatedData,
          nonRepeatedTasks: deduplicatedData.nonRepeatedTasks.filter((task, index, self) => 
            index === self.findIndex(t => 
              t.title === task.title && 
              t.description === task.description && 
              t.deadline === task.deadline
            )
          ),
          repeatedTasks: deduplicatedData.repeatedTasks.filter((task, index, self) => 
            index === self.findIndex(t => 
              t.title === task.title && 
              t.description === task.description && 
              t.frequency === task.frequency
            )
          )
        }
        
        // Convert old numeric IDs to UUIDs for tasks that need it
        const migratedData = {
          ...cleanedData,
          nonRepeatedTasks: cleanedData.nonRepeatedTasks.map(task => ({
            ...task,
            id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(task.id) 
              ? task.id 
              : crypto.randomUUID()
          })),
          repeatedTasks: cleanedData.repeatedTasks.map(task => ({
            ...task,
            id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(task.id) 
              ? task.id 
              : crypto.randomUUID()
          }))
        }
        
        setAppData(migratedData)
        
      } catch (error) {
        console.error('Error loading data:', error)
        // Fall back to default data if loading fails
        setAppData(data as AppData)
      } finally {
        setIsInitialLoading(false)
      }
    }
    loadAppData()
  }, [])



  const navigationItems = [
    { id: 'newtoday', label: 'Today', icon: Calendar, path: '/newtoday' },
    { id: 'tasks', label: 'Tasks', icon: Sun, path: '/tasks' },
    { id: 'newsfeed', label: 'Newsfeed', icon: Newspaper, path: '/newsfeed' },
    { id: 'books', label: 'Books', icon: BookOpen, path: '/books' },
    { id: 'people', label: 'People', icon: Users, path: '/people' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, path: '/projects' },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb, path: '/ideas' },
    { id: 'pipeline', label: 'Pipeline', icon: ArrowRight, path: '/pipeline' },
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsMobileSidebarOpen(false)
  }

  const getCurrentSection = () => {
    const path = location.pathname
    const item = navigationItems.find(item => item.path === path)
    return item ? item.id : 'tasks'
  }

  // Show loading screen while initializing
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button
            onClick={toggleMobileSidebar}
            variant="ghost"
            size="sm"
            className="p-2 text-gray-600"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Self Manager</h1>
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

      {/* Left Sidebar */}
      <div className={`
        bg-gray-50 border-r border-gray-200 shadow-sm flex flex-col h-screen
        lg:relative lg:translate-x-0 lg:z-auto
        fixed top-0 left-0 z-50 transform transition-all duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isLeftSidebarCollapsed ? 'lg:w-24' : 'lg:w-64'}
        slide-in-left
      `}>
        <div className="p-6 flex-1">
          {/* Branding Section */}
          <div className="mb-6 fade-in">
            {isLeftSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <img 
                  src="/favicon.ico" 
                  alt="Self Manager" 
                  className="w-8 h-8 hover-scale transition-smooth"
                />
                {/* Expand Button - Show when collapsed */}
                <Button
                  onClick={toggleLeftSidebar}
                  variant="ghost"
                  size="sm"
                  className="p-2 h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full hover-bounce"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-3">
                  <img 
                    src="/favicon.ico" 
                    alt="Self Manager" 
                    className="w-8 h-8 hover-scale transition-smooth"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                      Self Manager
                    </h1>
                    <p className="text-sm text-gray-600">
                      Organize yourself
                    </p>
                  </div>
                </div>
                {/* Collapse Button - Show when expanded */}
                <Button
                  onClick={toggleLeftSidebar}
                  variant="ghost"
                  size="sm"
                  className="absolute top-0 right-0 p-2 h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full hover-bounce"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 ease-in-out hover-lift hover-scale ${
                    getCurrentSection() === item.id
                      ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${
                    isLeftSidebarCollapsed ? 'justify-center px-2 py-3' : ''
                  } fade-in-delay-${Math.min(index + 1, 3)}`}
                  title={isLeftSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 hover:scale-110 ${isLeftSidebarCollapsed ? 'mx-auto' : ''}`} />
                  {!isLeftSidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Profile Section - Bottom Left */}
        <div className="p-6 border-t border-gray-200 bg-white slide-in-up">
          {isLeftSidebarCollapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hover-scale transition-smooth">
                <User className="h-4 w-4 text-green-600" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3 fade-in">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hover-scale transition-smooth">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">Logged in</p>
                </div>
              </div>
              
              {/* Theme Toggle */}
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="sm"
                className="w-full mb-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover-bounce"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-180" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-12" />
                    Dark Mode
                  </>
                )}
              </Button>
              
              {/* Configuration */}
              <Button
                onClick={() => setShowConfigModal(true)}
                variant="outline"
                size="sm"
                className="w-full mb-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover-bounce"
              >
                <Settings className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-90" />
                Configuration
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover-bounce"
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 h-screen overflow-hidden transition-all duration-300 ease-in-out ${
        isLeftSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-0'
      } ${!isRightSidebarCollapsed ? 'lg:mr-80' : ''}`}>
        <div className="h-full p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="h-full transition-all duration-300 ease-in-out fade-in">
            <AppRoutes data={appData} setData={setAppData} user={user} />
          </div>
        </div>
      </div>

      {/* Right Sidebar Toggle Button */}
      <button
        onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        className="fixed top-4 right-4 z-40 lg:block hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200 hover-scale hover-bounce"
      >
        {isRightSidebarCollapsed ? (
          <ChevronLeft className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
        ) : (
          <Menu className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
        )}
      </button>

      {/* Right Sidebar */}
      <div className={`
        w-80 bg-gray-50 border-l border-gray-200 shadow-sm flex flex-col h-screen
        fixed top-0 right-0 z-30 transform transition-transform duration-300 ease-in-out
        ${isRightSidebarCollapsed ? 'translate-x-full' : 'translate-x-0'}
        lg:block hidden slide-in-right
      `}>
        <div className="flex flex-col h-full">
          {/* Task Count Summary - Sticky */}
          <div className="flex-shrink-0 p-6 pb-4 fade-in">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Task Overview
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-to-br from-yellow-400 via-orange-300 to-yellow-200 p-3 rounded-lg border border-yellow-300 text-center hover-scale transition-smooth fade-in-delay-1">
                <p className="text-xs font-medium text-yellow-900">Daily</p>
                <p className="text-lg font-bold text-yellow-800">
                  {appData.repeatedTasks.filter(task => task.isActive).length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-400 via-blue-300 to-blue-200 p-3 rounded-lg border border-blue-300 text-center hover-scale transition-smooth fade-in-delay-2">
                <p className="text-xs font-medium text-blue-900">Office</p>
                <p className="text-lg font-bold text-blue-800">
                  {appData.nonRepeatedTasks.filter(task => task.status !== 'completed').length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-400 via-gray-300 to-gray-200 p-3 rounded-lg border border-gray-300 text-center hover-scale transition-smooth fade-in-delay-3">
                <p className="text-xs font-medium text-gray-900">Regular</p>
                <p className="text-lg font-bold text-gray-800">
                  {(appData.regularTasks || []).filter(task => task.status !== 'completed').length}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Interface - Scrollable */}
          <div className="flex-1 min-h-0  pb-2">
            <ChatInterface data={appData} />
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
