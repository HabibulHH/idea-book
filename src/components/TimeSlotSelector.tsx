import { Sun, Moon, ListTodo, Clock } from 'lucide-react'
import type { AppData } from '@/types'

interface TimeSlotSelectorProps {
  data: AppData
  selectedTimeSlot: 'all' | 'morning' | 'day' | 'night'
  onTimeSlotSelect: (slot: 'all' | 'morning' | 'day' | 'night') => void
  tasksByTimeSlot: {
    morning: any[]
    day: any[]
    night: any[]
  }
  filteredTasks: any[]
}

export function TimeSlotSelector({ 
  data, 
  selectedTimeSlot, 
  onTimeSlotSelect, 
  tasksByTimeSlot, 
  filteredTasks 
}: TimeSlotSelectorProps) {
  const timeSlotCards = [
    {
      key: 'morning',
      label: 'Morning',
      icon: Sun,
      iconColor: 'text-yellow-500',
      tasks: tasksByTimeSlot.morning,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      key: 'day',
      label: 'Day',
      icon: Sun,
      iconColor: 'text-orange-500',
      tasks: tasksByTimeSlot.day,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      key: 'night',
      label: 'Night',
      icon: Moon,
      iconColor: 'text-blue-500',
      tasks: tasksByTimeSlot.night,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      key: 'all',
      label: 'Total',
      icon: ListTodo,
      iconColor: 'text-purple-500',
      tasks: filteredTasks,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]

  const getPercentage = (tasks: any[]) => {
    if (filteredTasks.length === 0) return 0
    return Math.round((tasks.length / filteredTasks.length) * 100)
  }

  return (
    <div className="grid grid-cols-2 gap-1">
      {timeSlotCards.map((card) => {
        const Icon = card.icon
        const isSelected = selectedTimeSlot === card.key
        const percentage = card.key === 'all' ? 100 : getPercentage(card.tasks)
        
        return (
          <div
            key={card.key}
            onClick={() => onTimeSlotSelect(card.key as 'all' | 'morning' | 'day' | 'night')}
            className={`
              bg-white dark:bg-gray-800 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
              ${isSelected 
                ? `${card.bgColor} ${card.borderColor} border-2 shadow-md` 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {card.label}
                </h3>
              </div>
              <span className="text-sm text-gray-500">
                {card.tasks.length} tasks
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.key === 'all' ? card.tasks.length : `${percentage}%`}
              </div>
              <p className="text-sm text-gray-500">
                {card.key === 'all' ? 'total tasks today' : 'of daily tasks'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
