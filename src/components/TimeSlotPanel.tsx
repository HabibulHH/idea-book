import { Clock, Target, CheckCircle } from 'lucide-react'

interface TimeSlotPanelProps {
  selectedTimeSlot: 'all' | 'morning' | 'day' | 'night'
  onTimeSlotSelect: (slot: 'all' | 'morning' | 'day' | 'night') => void
  tasksByTimeSlot: {
    morning: any[]
    day: any[]
    night: any[]
  }
}

const TIME_SLOTS = {
  morning: { 
    start: '06:00', 
    end: '10:00', 
    label: 'Morning', 
    sublabel: '6-10 AM',
    height: 'h-16',
    duration: 4,
    color: 'bg-orange-100 dark:bg-orange-900',
    borderColor: 'border-orange-200 dark:border-orange-700',
    textColor: 'text-orange-800 dark:text-orange-200'
  },
  day: { 
    start: '11:00', 
    end: '19:00', 
    label: 'Day', 
    sublabel: '11 AM - 7 PM',
    height: 'h-32',
    duration: 8,
    color: 'bg-blue-100 dark:bg-blue-900',
    borderColor: 'border-blue-200 dark:border-blue-700',
    textColor: 'text-blue-800 dark:text-blue-200'
  },
  night: { 
    start: '20:00', 
    end: '23:00', 
    label: 'Night', 
    sublabel: '8-11 PM',
    height: 'h-20',
    duration: 3,
    color: 'bg-purple-100 dark:bg-purple-900',
    borderColor: 'border-purple-200 dark:border-purple-700',
    textColor: 'text-purple-800 dark:text-purple-200'
  }
}

export function TimeSlotPanel({ selectedTimeSlot, onTimeSlotSelect, tasksByTimeSlot }: TimeSlotPanelProps) {
  const getCompletionRate = (tasks: any[]) => {
    if (tasks.length === 0) return 0
    const completed = tasks.filter(task => task.status === 'completed').length
    return Math.round((completed / tasks.length) * 100)
  }

  const getPriorityCount = (tasks: any[], priority: string) => {
    return tasks.filter(task => task.priority === priority).length
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Time Slots
        </h3>
      </div>

      {/* All Time Slots Option */}
      <button
        onClick={() => onTimeSlotSelect('all')}
        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
          selectedTimeSlot === 'all'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">All Time Slots</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {tasksByTimeSlot.morning.length + tasksByTimeSlot.day.length + tasksByTimeSlot.night.length} total tasks
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {getCompletionRate([...tasksByTimeSlot.morning, ...tasksByTimeSlot.day, ...tasksByTimeSlot.night])}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">complete</div>
          </div>
        </div>
      </button>

      {/* Individual Time Slots */}
      {Object.entries(TIME_SLOTS).map(([slotKey, slotConfig]) => {
        const tasks = tasksByTimeSlot[slotKey as keyof typeof tasksByTimeSlot]
        const completionRate = getCompletionRate(tasks)
        const urgentCount = getPriorityCount(tasks, 'urgent')
        const highCount = getPriorityCount(tasks, 'high')
        
        return (
          <button
            key={slotKey}
            onClick={() => onTimeSlotSelect(slotKey as 'morning' | 'day' | 'night')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedTimeSlot === slotKey
                ? `${slotConfig.borderColor} ${slotConfig.color}`
                : `${slotConfig.borderColor} hover:opacity-80`
            }`}
          >
            {/* Time Slot Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-left">
                <div className={`font-medium ${slotConfig.textColor}`}>
                  {slotConfig.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {slotConfig.sublabel}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${slotConfig.textColor}`}>
                  {completionRate}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">complete</div>
              </div>
            </div>

            {/* Visual Time Slot Representation */}
            <div className={`w-full ${slotConfig.height} ${slotConfig.color} rounded-md border ${slotConfig.borderColor} relative overflow-hidden`}>
              {/* Progress bar overlay */}
              <div 
                className="absolute top-0 left-0 h-full bg-green-400 dark:bg-green-600 opacity-60 transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
              
              {/* Time indicators */}
              <div className="absolute top-1 left-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {slotConfig.start}
              </div>
              <div className="absolute bottom-1 right-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {slotConfig.end}
              </div>
              
              {/* Duration indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">
                {slotConfig.duration}h
              </div>
            </div>

            {/* Task Stats */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tasks:</span>
                <span className="font-medium text-gray-900 dark:text-white">{tasks.length}</span>
              </div>
              
              {urgentCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 dark:text-red-400">Urgent:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{urgentCount}</span>
                </div>
              )}
              
              {highCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-600 dark:text-orange-400">High:</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">{highCount}</span>
                </div>
              )}
            </div>

            {/* Priority Indicators */}
            {(urgentCount > 0 || highCount > 0) && (
              <div className="mt-2 flex space-x-1">
                {urgentCount > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" title={`${urgentCount} urgent tasks`} />
                )}
                {highCount > 0 && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" title={`${highCount} high priority tasks`} />
                )}
              </div>
            )}
          </button>
        )
      })}

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <Target className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Today's Summary</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {tasksByTimeSlot.morning.length + tasksByTimeSlot.day.length + tasksByTimeSlot.night.length}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {[...tasksByTimeSlot.morning, ...tasksByTimeSlot.day, ...tasksByTimeSlot.night]
                .filter(task => task.status === 'completed').length}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Overall Progress:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {getCompletionRate([...tasksByTimeSlot.morning, ...tasksByTimeSlot.day, ...tasksByTimeSlot.night])}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
