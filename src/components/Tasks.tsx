import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RepeatedTask, NonRepeatedTask, RegularTask, AppData } from '@/types'
import { Repeat, Briefcase } from 'lucide-react'
import { TaskList } from './TaskList'
import { saveRepeatedTask, saveNonRepeatedTask, saveRegularTask } from '@/lib/storage'
import { WeatherHeader } from './WeatherHeader'

interface TasksProps {
  data: AppData
  setData: (data: AppData) => void
}

export function Tasks({ data, setData }: TasksProps) {
  const [showForm, setShowForm] = useState(false)
  const [taskType, setTaskType] = useState<'daily' | 'office' | 'regular'>('daily')
  const [editingTask, setEditingTask] = useState<RepeatedTask | NonRepeatedTask | RegularTask | null>(null)
  const [sortBy, setSortBy] = useState<'priority' | 'created' | 'deadline' | 'type'>('priority')
  const [filterBy, setFilterBy] = useState<'all' | 'daily' | 'office' | 'regular'>('all')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  })

  const today = new Date().toISOString().split('T')[0]

  // Get all tasks with type information
  const allTasks = [
    // Daily tasks that are active and not completed today
    ...data.repeatedTasks.filter(task => 
      task.isActive && 
      task.lastCompleted !== today
    ).map(task => ({ ...task, taskType: 'daily' as const })),
    // Office tasks due today or overdue
    ...data.nonRepeatedTasks.filter(task =>
      task.status !== 'completed' &&
      (task.deadline === today || (task.deadline && new Date(task.deadline) <= new Date()))
    ).map(task => ({ ...task, taskType: 'office' as const })),
    // Regular tasks that are active
    ...(data.regularTasks || []).filter(task => 
      task.status !== 'completed'
    ).map(task => ({ ...task, taskType: 'regular' as const }))
  ]

  // Filter tasks by type
  const filteredTasks = filterBy === 'all' 
    ? allTasks 
    : allTasks.filter(task => task.taskType === filterBy)

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        const aPriority = 'priority' in a ? priorityOrder[a.priority] || 0 : 0
        const bPriority = 'priority' in b ? priorityOrder[b.priority] || 0 : 0
        return bPriority - aPriority
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'deadline':
        const aDeadline = 'deadline' in a ? new Date(a.deadline).getTime() : Infinity
        const bDeadline = 'deadline' in b ? new Date(b.deadline).getTime() : Infinity
        return aDeadline - bDeadline
      case 'type':
        return a.taskType.localeCompare(b.taskType)
      default:
        return 0
    }
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'daily',
      deadline: '',
      priority: 'medium'
    })
    setShowForm(false)
    setEditingTask(null)
    setTaskType('daily')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (taskType === 'daily') {
      const newTask: RepeatedTask = {
        id: editingTask?.id || crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        frequency: formData.frequency,
        priority: formData.priority,
        isActive: true,
        streak: editingTask ? (editingTask as RepeatedTask).streak : 0,
        lastCompleted: editingTask ? (editingTask as RepeatedTask).lastCompleted : undefined,
        createdAt: editingTask?.createdAt || new Date().toISOString()
      }

      if (editingTask) {
        setData({
          ...data,
          repeatedTasks: data.repeatedTasks.map(t => t.id === editingTask.id ? newTask : t)
        })
        // Save the updated task to database
        await saveRepeatedTask(newTask)
      } else {
        setData({
          ...data,
          repeatedTasks: [...data.repeatedTasks, newTask]
        })
        // Save the new task to database
        await saveRepeatedTask(newTask)
      }
    } else if (taskType === 'office') {
      const newTask: NonRepeatedTask = {
        id: editingTask?.id || crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline || today,
        priority: formData.priority,
        status: editingTask ? (editingTask as NonRepeatedTask).status : 'pending',
        createdAt: editingTask?.createdAt || new Date().toISOString(),
        completedAt: editingTask ? (editingTask as NonRepeatedTask).completedAt : undefined
      }

      if (editingTask) {
        setData({
          ...data,
          nonRepeatedTasks: data.nonRepeatedTasks.map(t => t.id === editingTask.id ? newTask : t)
        })
        // Save the updated task to database
        await saveNonRepeatedTask(newTask)
      } else {
        setData({
          ...data,
          nonRepeatedTasks: [...data.nonRepeatedTasks, newTask]
        })
        // Save the new task to database
        await saveNonRepeatedTask(newTask)
      }
    } else if (taskType === 'regular') {
      const newTask: RegularTask = {
        id: editingTask?.id || crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: editingTask ? (editingTask as RegularTask).status : 'pending',
        createdAt: editingTask?.createdAt || new Date().toISOString(),
        completedAt: editingTask ? (editingTask as RegularTask).completedAt : undefined
      }

      if (editingTask) {
        setData({
          ...data,
          regularTasks: (data.regularTasks || []).map(t => t.id === editingTask.id ? newTask : t)
        })
        // Save the updated task to database
        await saveRegularTask(newTask)
      } else {
        setData({
          ...data,
          regularTasks: [...(data.regularTasks || []), newTask]
        })
        // Save the new task to database
        await saveRegularTask(newTask)
      }
    }

    resetForm()
  }

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Weather Header with DateTime */}
      <div className="flex-shrink-0 mb-6">
        <WeatherHeader />
      </div>

      {/* Task Summary and Controls */}
      <div className="flex-shrink-0 space-y-4 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Today</h2>
            <p className="text-sm text-gray-500 mt-1">
              All your tasks in one place • Create, manage, and complete tasks
            </p>
          </div>
          <div className="text-sm text-gray-500 text-right">
            <div className="font-medium">{sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}</div>
          </div>
        </div>

        {/* Sorting and Filtering Controls */}
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <div className="flex gap-1">
              <Button
                variant={filterBy === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('all')}
                className="flex items-center gap-1"
              >
                All Tasks
              </Button>
              <Button
                variant={filterBy === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('daily')}
                className="flex items-center gap-1"
              >
                <Repeat className="h-3 w-3" />
                Daily
              </Button>
              <Button
                variant={filterBy === 'office' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('office')}
                className="flex items-center gap-1"
              >
                <Briefcase className="h-3 w-3" />
                Office
              </Button>
              <Button
                variant={filterBy === 'regular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('regular')}
                className="flex items-center gap-1"
              >
                <Briefcase className="h-3 w-3" />
                Regular
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Scrollable Task List Section */}
      <div className="flex-1 overflow-hidden">
        <TaskList
          data={data}
          setData={setData}
          sortedTasks={sortedTasks}
          showForm={showForm}
          setShowForm={setShowForm}
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          taskType={taskType}
          setTaskType={setTaskType}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          resetForm={resetForm}
        />
      </div>
    </div>
  )
}
