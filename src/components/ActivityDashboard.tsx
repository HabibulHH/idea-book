import { useState, useEffect } from 'react'
import { Calendar, Target, CheckCircle, Activity, TrendingUp } from 'lucide-react'
import type { AppData } from '@/types'

interface ActivityDashboardProps {
  data: AppData
}

interface DayActivity {
  date: string
  completedTasks: number
  totalTasks: number
  level: 0 | 1 | 2 | 3 | 4
}

export function ActivityDashboard({ data }: ActivityDashboardProps) {
  const [activityData, setActivityData] = useState<DayActivity[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedDayTasks, setSelectedDayTasks] = useState<{
    completed: number
    pending: number
  }>({ completed: 0, pending: 0 })
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Generate activity data for the selected month
  useEffect(() => {
    const generateActivityData = () => {
      const activities: DayActivity[] = []
      const year = currentYear
      const month = currentMonth
      
      // Get first day of the month
      const firstDay = new Date(year, month, 1)
      // Get last day of the month
      const lastDay = new Date(year, month + 1, 0)
      
      // Generate data for each day in the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day)
        const dateString = date.toISOString().split('T')[0]
        
        // Calculate completed tasks for this day
        let completedCount = 0
        let totalCount = 0
        
        // Check repeated tasks
        data.repeatedTasks.forEach(task => {
          if (task.isActive) {
            totalCount++
            if (task.lastCompleted === dateString) {
              completedCount++
            }
          }
        })
        
        // Check non-repeated tasks
        data.nonRepeatedTasks.forEach(task => {
          if (task.deadline === dateString) {
            totalCount++
            if (task.status === 'completed') {
              completedCount++
            }
          }
        })
        
        // Check regular tasks (simplified - assume completed if status is completed)
        data.regularTasks.forEach(task => {
          if (task.status === 'completed') {
            totalCount++
            completedCount++
          }
        })
        
        // Calculate activity level (0-4)
        let level: 0 | 1 | 2 | 3 | 4 = 0
        if (completedCount > 0) {
          const completionRate = completedCount / Math.max(totalCount, 1)
          if (completionRate >= 0.8) level = 4
          else if (completionRate >= 0.6) level = 3
          else if (completionRate >= 0.4) level = 2
          else if (completionRate >= 0.2) level = 1
        }
        
        activities.push({
          date: dateString,
          completedTasks: completedCount,
          totalTasks: totalCount,
          level
        })
      }
      
      setActivityData(activities)
    }
    
    generateActivityData()
  }, [data, currentMonth, currentYear])

  // Get tasks for selected date
  useEffect(() => {
    if (!selectedDate) return
    
    const dayActivity = activityData.find(a => a.date === selectedDate)
    if (dayActivity) {
      setSelectedDayTasks({
        completed: dayActivity.completedTasks,
        pending: dayActivity.totalTasks - dayActivity.completedTasks
      })
    }
  }, [selectedDate, activityData])

  const getActivityColor = (level: number) => {
    const colors = {
      0: 'bg-gray-100 dark:bg-gray-800',
      1: 'bg-blue-200 dark:bg-blue-900',
      2: 'bg-blue-300 dark:bg-blue-800',
      3: 'bg-blue-400 dark:bg-blue-700',
      4: 'bg-blue-500 dark:bg-blue-600'
    }
    return colors[level as keyof typeof colors] || colors[0]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // No need for week days since we removed the headers

  const getMonthNames = () => {
    return [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
  }

  // No need to group by month - we'll show one unified grid

  // Calculate stats
  const totalTasks = data.repeatedTasks.filter(t => t.isActive).length + 
                    data.nonRepeatedTasks.length + 
                    data.regularTasks.length

  const todayActivity = activityData.find(a => a.date === new Date().toISOString().split('T')[0])
  const completedToday = todayActivity?.completedTasks || 0

  const activeDays = activityData.filter(a => a.completedTasks > 0).length

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-600 to-slate-500 p-6 text-white shadow-lg">
      {/* Background decorative elements */}
      <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5"></div>
      
      <div className="relative z-10">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Activity Dashboard
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-xs text-white/80">Less</div>
              <div className="flex space-x-1">
                {[0, 1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    className={`w-2 h-2 rounded-sm ${
                      level === 0 ? 'bg-white/20' :
                      level === 1 ? 'bg-white/40' :
                      level === 2 ? 'bg-white/60' :
                      level === 3 ? 'bg-white/80' :
                      'bg-white'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-white/80">More</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left Section - Activity Stats */}
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-white">
                {completedToday}
              </div>
              <div className="text-sm text-white/80">
                Completed Today
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-lg font-semibold text-white">
                  {totalTasks}
                </div>
                <div className="text-xs text-white/70">
                  Total Tasks
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {activeDays}
                </div>
                <div className="text-xs text-white/70">
                  Active Days
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Activity Calendar */}
          <div className="space-y-3">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11)
                    setCurrentYear(currentYear - 1)
                  } else {
                    setCurrentMonth(currentMonth - 1)
                  }
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                ←
              </button>
              
              <h3 className="text-sm font-medium text-white">
                {getMonthNames()[currentMonth]} {currentYear}
              </h3>
              
              <button
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0)
                    setCurrentYear(currentYear + 1)
                  } else {
                    setCurrentMonth(currentMonth + 1)
                  }
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                →
              </button>
            </div>

            {/* Activity Grid */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const firstDay = new Date(currentYear, currentMonth, 1)
                const lastDay = new Date(currentYear, currentMonth + 1, 0)
                const startDayOfWeek = firstDay.getDay()
                const daysInMonth = lastDay.getDate()
                
                const gridItems = []
                
                // Add empty cells for days before the first day of the month
                for (let i = 0; i < startDayOfWeek; i++) {
                  gridItems.push(
                    <div key={`empty-${i}`} className="w-2 h-2" />
                  )
                }
                
                // Add activity dots for each day in the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(currentYear, currentMonth, day)
                  const dateString = date.toISOString().split('T')[0]
                  const activity = activityData.find(a => a.date === dateString)
                  
                  gridItems.push(
                    <button
                      key={dateString}
                      onClick={() => setSelectedDate(dateString)}
                      className={`w-2 h-2 rounded-sm transition-all duration-200 hover:scale-125 ${
                        activity?.level === 0 ? 'bg-white/20' :
                        activity?.level === 1 ? 'bg-white/40' :
                        activity?.level === 2 ? 'bg-white/60' :
                        activity?.level === 3 ? 'bg-white/80' :
                        'bg-white'
                      } ${
                        selectedDate === dateString ? 'ring-1 ring-white' : ''
                      }`}
                      title={`${formatDate(dateString)}: ${activity?.completedTasks || 0}/${activity?.totalTasks || 0} tasks completed`}
                    />
                  )
                }
                
                return gridItems
              })()}
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDate && (
          <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="h-4 w-4 text-white" />
              <h3 className="text-sm font-medium text-white">
                {formatDate(selectedDate)}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-sm text-white/80">
                  Completed: {selectedDayTasks.completed}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-white" />
                <span className="text-sm text-white/80">
                  Pending: {selectedDayTasks.pending}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
