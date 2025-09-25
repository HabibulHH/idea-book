import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { RepeatedTask, NonRepeatedTask, AppData } from '@/types'
import { Trash2, Edit, CheckCircle, Calendar, Clock, Repeat, Briefcase } from 'lucide-react'

interface TodayViewProps {
  data: AppData
  setData: (data: AppData) => void
}

export function TodayView({ data, setData }: TodayViewProps) {
  const [showForm, setShowForm] = useState(false)
  const [taskType, setTaskType] = useState<'daily' | 'office'>('daily')
  const [editingTask, setEditingTask] = useState<RepeatedTask | NonRepeatedTask | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  })

  const today = new Date().toISOString().split('T')[0]

  // Get today's tasks - only show tasks that are due today or overdue
  const todaysTasks = [
    // Daily tasks that are active and not completed today
    ...data.repeatedTasks.filter(task => 
      task.isActive && 
      task.lastCompleted !== today
    ),
    // Office tasks due today or overdue
    ...data.nonRepeatedTasks.filter(task =>
      task.status !== 'completed' &&
      (task.deadline === today || (task.deadline && new Date(task.deadline) <= new Date()))
    )
  ]

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (taskType === 'daily') {
      const newTask: RepeatedTask = {
        id: editingTask?.id || Date.now().toString(),
        title: formData.title,
        description: formData.description,
        frequency: formData.frequency,
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
      } else {
        setData({
          ...data,
          repeatedTasks: [...data.repeatedTasks, newTask]
        })
      }
    } else {
      const newTask: NonRepeatedTask = {
        id: editingTask?.id || Date.now().toString(),
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
      } else {
        setData({
          ...data,
          nonRepeatedTasks: [...data.nonRepeatedTasks, newTask]
        })
      }
    }

    resetForm()
  }

  const handleToggleComplete = (task: RepeatedTask | NonRepeatedTask) => {
    if ('frequency' in task) {
      // Daily task
      const today = new Date().toISOString().split('T')[0]
      const updatedTask = {
        ...task,
        lastCompleted: today,
        streak: task.lastCompleted === today ? task.streak : task.streak + 1
      }
      setData({
        ...data,
        repeatedTasks: data.repeatedTasks.map(t => t.id === task.id ? updatedTask : t)
      })
    } else {
      // Office task
      const updatedTask = {
        ...task,
        status: task.status === 'completed' ? 'pending' : 'completed',
        completedAt: task.status === 'completed' ? undefined : new Date().toISOString()
      } as NonRepeatedTask
      setData({
        ...data,
        nonRepeatedTasks: data.nonRepeatedTasks.map(t => t.id === task.id ? updatedTask : t)
      })
    }
  }

  const handleDelete = async (task: RepeatedTask | NonRepeatedTask) => {
    try {
      // Check if ID is a valid UUID before attempting Supabase deletion
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(task.id)
      
      if (isValidUUID) {
        if ('frequency' in task) {
          // Delete from Supabase
          const { deleteRepeatedTaskFromSupabase } = await import('@/lib/storage')
          await deleteRepeatedTaskFromSupabase(task.id)
        } else {
          // Delete from Supabase
          const { deleteNonRepeatedTaskFromSupabase } = await import('@/lib/storage')
          await deleteNonRepeatedTaskFromSupabase(task.id)
        }
      } else {
        console.log('Skipping Supabase deletion for non-UUID task:', task.id)
      }
      
      // Always update local state regardless of Supabase deletion
      if ('frequency' in task) {
        setData({
          ...data,
          repeatedTasks: data.repeatedTasks.filter(t => t.id !== task.id)
        })
      } else {
        setData({
          ...data,
          nonRepeatedTasks: data.nonRepeatedTasks.filter(t => t.id !== task.id)
        })
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      // Still update local state even if Supabase deletion fails
      if ('frequency' in task) {
        setData({
          ...data,
          repeatedTasks: data.repeatedTasks.filter(t => t.id !== task.id)
        })
      } else {
        setData({
          ...data,
          nonRepeatedTasks: data.nonRepeatedTasks.filter(t => t.id !== task.id)
        })
      }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200'
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const isOverdue = (task: NonRepeatedTask) => {
    if (!task.deadline) return false
    return new Date(task.deadline) < new Date() && task.status !== 'completed'
  }

  const getTaskStatus = (task: NonRepeatedTask) => {
    if (isOverdue(task)) return 'overdue'
    return task.status
  }

  const isTaskCompleted = (task: RepeatedTask | NonRepeatedTask) => {
    if ('frequency' in task) {
      // Daily task - check if completed today
      return task.lastCompleted === today
    } else {
      // Office task
      return task.status === 'completed'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Today</h2>
          <p className="text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tasks due today or overdue • Use Daily Tasks and Office Tasks sections for full management
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {todaysTasks.length} {todaysTasks.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      <div className="grid gap-4">
        {/* Quick Add Task Input */}
        {!showForm && !editingTask && (
          <div
            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-text"
            onClick={() => setShowForm(true)}
          >
            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 rounded-full"></div>
            <span className="text-gray-500 dark:text-gray-400">Add a task</span>
          </div>
        )}

        {/* Expanded Form */}
        {(showForm || editingTask) && (
          <Card className="border-green-200 dark:border-green-700 shadow-sm dark:bg-gray-800">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Task Type Selection */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={taskType === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTaskType('daily')}
                    className="flex items-center gap-2"
                  >
                    <Repeat className="h-4 w-4" />
                    Daily Task
                  </Button>
                  <Button
                    type="button"
                    variant={taskType === 'office' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTaskType('office')}
                    className="flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4" />
                    Office Task
                  </Button>
                </div>

                <div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Task name"
                    className="text-lg font-medium border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    rows={2}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                  />
                </div>

                {/* Options Row */}
                <div className="flex items-center gap-2 pt-2">
                  {taskType === 'daily' && (
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as any }))}
                    >
                      <SelectTrigger className="w-auto h-8 text-sm border border-gray-300 focus:border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {taskType === 'office' && (
                    <>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-auto h-8 text-sm border border-gray-300 focus:border-green-500"
                        placeholder="Deadline"
                      />
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                      >
                        <SelectTrigger className="w-auto h-8 text-sm border border-gray-300 focus:border-green-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!formData.title.trim()}>
                    {editingTask ? 'Update' : 'Add task'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Today's Tasks */}
        {todaysTasks.map((task) => (
          <Card key={task.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {!('frequency' in task) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComplete(task)}
                        className="p-0 h-6 w-6"
                      >
                        <CheckCircle
                          className={`h-4 w-4 ${
                            isTaskCompleted(task)
                              ? 'text-green-600 fill-green-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </Button>
                    )}
                    <h3 className={`font-semibold dark:text-white ${
                      isTaskCompleted(task) ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-wrap">{task.description}</div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {'frequency' in task ? (
                      <>
                        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          <Repeat className="h-3 w-3" />
                          {task.frequency}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          <Clock className="h-3 w-3" />
                          Streak: {task.streak}
                        </Badge>
                        {task.lastCompleted && (
                          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                            Last: {new Date(task.lastCompleted).toLocaleDateString()}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <Badge className={getPriorityColor((task as NonRepeatedTask).priority)}>
                          {(task as NonRepeatedTask).priority}
                        </Badge>
                        <Badge className={getStatusColor(getTaskStatus(task as NonRepeatedTask))}>
                          {getTaskStatus(task as NonRepeatedTask)}
                        </Badge>
                        {(task as NonRepeatedTask).deadline && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date((task as NonRepeatedTask).deadline).toLocaleDateString()}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTask(task)
                      setFormData({
                        title: task.title,
                        description: task.description,
                        frequency: 'frequency' in task ? task.frequency : 'daily',
                        deadline: 'frequency' in task ? '' : task.deadline,
                        priority: 'frequency' in task ? 'medium' : task.priority
                      })
                      setTaskType('frequency' in task ? 'daily' : 'office')
                      setShowForm(true)
                    }}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {todaysTasks.length === 0 && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No tasks for today</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Add your first task to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}