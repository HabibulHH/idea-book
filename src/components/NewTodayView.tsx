import { useState, useEffect } from 'react'
import { Calendar, Clock, Target, Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AppData, RepeatedTask, NonRepeatedTask, RegularTask } from '@/types'
import { ActivityDashboard } from './ActivityDashboard'
import { TimeSlotPanel } from './TimeSlotPanel'
import { TimeSlotSelector } from './TimeSlotSelector'

interface NewTodayViewProps {
  data: AppData
  setData: (data: AppData) => void
}

interface TaskWithTimeSlot {
  id: string
  title: string
  description?: string
  timeSlot: 'morning' | 'day' | 'night'
  project?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed'
  deadline?: string
  type: 'repeated' | 'nonRepeated' | 'regular'
}

const TIME_SLOTS = {
  morning: { 
    start: '06:00', 
    end: '10:00', 
    label: 'Morning (6-10 AM)', 
    height: 'h-16',
    duration: 4,
    color: 'bg-orange-100 dark:bg-orange-900'
  },
  day: { 
    start: '11:00', 
    end: '19:00', 
    label: 'Day (11 AM - 7 PM)', 
    height: 'h-32',
    duration: 8,
    color: 'bg-blue-100 dark:bg-blue-900'
  },
  night: { 
    start: '20:00', 
    end: '23:00', 
    label: 'Night (8-11 PM)', 
    height: 'h-20',
    duration: 3,
    color: 'bg-purple-100 dark:bg-purple-900'
  }
}

export function NewTodayView({ data, setData }: NewTodayViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'all' | 'morning' | 'day' | 'night'>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projects, setProjects] = useState<string[]>([])

  // Extract unique projects from all tasks
  useEffect(() => {
    const allProjects = new Set<string>()
    
    // Extract projects from repeated tasks
    data.repeatedTasks.forEach(task => {
      if (task.project) allProjects.add(task.project)
    })
    
    // Extract projects from non-repeated tasks
    data.nonRepeatedTasks.forEach(task => {
      if (task.project) allProjects.add(task.project)
    })
    
    // Extract projects from regular tasks
    data.regularTasks.forEach(task => {
      if (task.project) allProjects.add(task.project)
    })
    
    setProjects(Array.from(allProjects))
  }, [data])

  // Get tasks for selected date and filters
  const getFilteredTasks = (): TaskWithTimeSlot[] => {
    const today = selectedDate
    const allTasks: TaskWithTimeSlot[] = []

    // Process repeated tasks
    data.repeatedTasks.forEach(task => {
      if (task.isActive) {
        allTasks.push({
          id: task.id,
          title: task.title,
          description: task.description,
          timeSlot: task.timeSlot || 'day',
          project: task.project,
          priority: task.priority,
          status: task.lastCompleted === today ? 'completed' : 'pending',
          type: 'repeated'
        })
      }
    })

    // Process non-repeated tasks
    data.nonRepeatedTasks.forEach(task => {
      if (task.deadline === today) {
        allTasks.push({
          id: task.id,
          title: task.title,
          description: task.description,
          timeSlot: task.timeSlot || 'day',
          project: task.project,
          priority: task.priority,
          status: task.status === 'completed' ? 'completed' : 'pending',
          deadline: task.deadline,
          type: 'nonRepeated'
        })
      }
    })

    // Process regular tasks
    data.regularTasks.forEach(task => {
      if (task.status !== 'completed') {
        allTasks.push({
          id: task.id,
          title: task.title,
          description: task.description,
          timeSlot: task.timeSlot || 'day',
          project: task.project,
          priority: task.priority,
          status: task.status,
          type: 'regular'
        })
      }
    })

    // Apply filters
    return allTasks.filter(task => {
      const timeSlotMatch = selectedTimeSlot === 'all' || task.timeSlot === selectedTimeSlot
      const projectMatch = selectedProject === 'all' || task.project === selectedProject
      return timeSlotMatch && projectMatch
    })
  }

  const filteredTasks = getFilteredTasks()

  // Group tasks by time slot
  const tasksByTimeSlot = {
    morning: filteredTasks.filter(task => task.timeSlot === 'morning'),
    day: filteredTasks.filter(task => task.timeSlot === 'day'),
    night: filteredTasks.filter(task => task.timeSlot === 'night')
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

  return (
    <div className=" space-y-6">

      {/* Activity Dashboard and Empty Space - Two Columns */}
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-1">
          <TimeSlotSelector
            data={data}
            selectedTimeSlot={selectedTimeSlot}
            onTimeSlotSelect={setSelectedTimeSlot}
            tasksByTimeSlot={tasksByTimeSlot}
            filteredTasks={filteredTasks}
          />
        </div>
        <div className="col-span-1">
          {/* Empty space for future content */}
          <ActivityDashboard data={data} />
        </div>
      </div>


      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-y-auto max-h-screen">
       

        {/* Task Lists */}
        <div className="lg:col-span-3 space-y-6">
          {selectedTimeSlot === 'all' ? (
            // Show all time slots
            Object.entries(TIME_SLOTS).map(([slotKey, slotConfig]) => (
              <div key={slotKey} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {slotConfig.label}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({tasksByTimeSlot[slotKey as keyof typeof tasksByTimeSlot].length} tasks)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tasksByTimeSlot[slotKey as keyof typeof tasksByTimeSlot].map((task) => (
                    <div key={task.id} className={`p-3 rounded-lg border ${slotConfig.color}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {task.description}
                            </p>
                          )}
                          {task.project && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              {task.project}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 text-xs rounded ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Show selected time slot only
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {TIME_SLOTS[selectedTimeSlot as keyof typeof TIME_SLOTS]?.label}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({filteredTasks.length} tasks)
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} className={`p-3 rounded-lg border ${TIME_SLOTS[task.timeSlot].color}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {task.description}
                          </p>
                        )}
                        {task.project && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            {task.project}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Task
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Slot
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6-10 AM)</SelectItem>
                  <SelectItem value="day">Day (11 AM - 7 PM)</SelectItem>
                  <SelectItem value="night">Night (8-11 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Tag
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Enter task description"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button>
              Create Task
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
