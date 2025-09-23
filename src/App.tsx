import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import IdeaParkingLot from '@/components/IdeaParkingLot'
import ExecutionPipeline from '@/components/ExecutionPipeline'
import { TaskManager } from '@/components/TaskManager'
import { TodayView } from '@/components/TodayView'
import type { AppData } from '@/types'
import data from '@/data.json'
import { loadData, saveData } from '@/lib/storage'
import { Lightbulb, ArrowRight, Calendar, Briefcase, Download, Upload, Sun } from 'lucide-react'
import { useLoading } from '@/hooks/useLoading'

function App() {
  const [appData, setAppData] = useState<AppData>(data as AppData)
  const [activeSection, setActiveSection] = useState('today')
  const { isLoadingKey, withLoading } = useLoading()

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
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'pipeline', label: 'Pipeline', icon: ArrowRight },
    { id: 'daily', label: 'Daily Tasks', icon: Calendar },
    { id: 'office', label: 'Office Tasks', icon: Briefcase },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'today':
        return <TodayView data={appData} setData={setAppData} />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Self Manager
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Organize your workflow
          </p>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 ease-in-out hover-lift ${
                    activeSection === item.id
                      ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Data Management */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Data</h3>
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="transition-all duration-300 ease-in-out">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
