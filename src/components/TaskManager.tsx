import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { RepeatedTask, NonRepeatedTask } from '@/types'
import { Trash2, Edit, CheckCircle, Calendar, Clock, Repeat } from 'lucide-react'
import { useLoading } from '@/hooks/useLoading'

interface TaskManagerProps {
  type: 'repeated' | 'oneTime'
  tasks: any[]
  onUpdateTasks: (tasks: any[]) => void
}

export function TaskManager({ type, tasks, onUpdateTasks }: TaskManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<RepeatedTask | NonRepeatedTask | null>(null)
  const { isLoadingKey, withLoading } = useLoading()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await withLoading(async () => {
      if (type === 'repeated') {
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
          onUpdateTasks((tasks as RepeatedTask[]).map(t => t.id === editingTask.id ? newTask : t))
        } else {
          onUpdateTasks([...(tasks as RepeatedTask[]), newTask])
        }
      } else {
        const newTask: NonRepeatedTask = {
          id: editingTask?.id || Date.now().toString(),
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
          priority: formData.priority,
          status: editingTask ? (editingTask as NonRepeatedTask).status : 'pending',
          createdAt: editingTask?.createdAt || new Date().toISOString(),
          completedAt: editingTask ? (editingTask as NonRepeatedTask).completedAt : undefined
        }

        if (editingTask) {
          onUpdateTasks((tasks as NonRepeatedTask[]).map(t => t.id === editingTask.id ? newTask : t))
        } else {
          onUpdateTasks([...(tasks as NonRepeatedTask[]), newTask])
        }
      }

      resetForm()
    }, 'submit-task')
  }

  const handleEdit = (task: RepeatedTask | NonRepeatedTask) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      frequency: type === 'repeated' ? (task as RepeatedTask).frequency : 'daily',
      deadline: type === 'oneTime' ? (task as NonRepeatedTask).deadline : '',
      priority: type === 'oneTime' ? (task as NonRepeatedTask).priority : 'medium'
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await withLoading(async () => {
      onUpdateTasks(tasks.filter(t => t.id !== id))
    }, `delete-${id}`)
  }

  const handleToggleComplete = async (task: RepeatedTask | NonRepeatedTask) => {
    await withLoading(async () => {
      if (type === 'repeated') {
        const repeatedTask = task as RepeatedTask
        const today = new Date().toISOString().split('T')[0]
        const updatedTask = {
          ...repeatedTask,
          lastCompleted: today,
          streak: repeatedTask.lastCompleted === today ? repeatedTask.streak : repeatedTask.streak + 1
        }
        onUpdateTasks((tasks as RepeatedTask[]).map(t => t.id === task.id ? updatedTask : t))
      } else {
        const oneTimeTask = task as NonRepeatedTask
        const updatedTask = {
          ...oneTimeTask,
          status: oneTimeTask.status === 'completed' ? 'pending' : 'completed',
          completedAt: oneTimeTask.status === 'completed' ? undefined : new Date().toISOString()
        }
        onUpdateTasks((tasks as NonRepeatedTask[]).map(t => t.id === task.id ? updatedTask : t))
      }
    }, `toggle-${task.id}`)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {type === 'repeated' ? 'Daily Recurring Tasks' : 'One-Time Tasks'}
        </h2>
        <div className="text-sm text-gray-500">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      <div className="grid gap-4">
        {/* Quick Add Task Input */}
        {!showForm && !editingTask && (
          <div
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-text"
            onClick={() => setShowForm(true)}
          >
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
            <span className="text-gray-500">Add a task</span>
          </div>
        )}

        {/* Expanded Form */}
        {(showForm || editingTask) && (
          <Card className="border-green-200 shadow-sm slide-in">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Task name"
                    className="text-lg font-medium border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
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
                    className="border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                  />
                </div>

                {/* Options Row */}
                <div className="flex items-center gap-2 pt-2">
                  {type === 'repeated' && (
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

                  {type === 'oneTime' && (
                    <>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-auto h-8 text-sm border border-gray-300 focus:border-green-500"
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
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!formData.title.trim()}
                    loading={isLoadingKey('submit-task')}
                  >
                    {editingTask ? 'Update' : 'Add task'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`slide-in hover-lift bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
              isLoadingKey(`toggle-${task.id}`) || isLoadingKey(`delete-${task.id}`)
                ? 'opacity-70 pointer-events-none loading-fade'
                : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {type === 'oneTime' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComplete(task)}
                        className="p-0 h-6 w-6"
                        loading={isLoadingKey(`toggle-${task.id}`)}
                      >
                        {!isLoadingKey(`toggle-${task.id}`) && (
                          <CheckCircle
                            className={`h-4 w-4 ${
                              (task as NonRepeatedTask).status === 'completed'
                                ? 'text-green-600 fill-green-600'
                                : 'text-gray-400'
                            }`}
                          />
                        )}
                      </Button>
                    )}
                    <h3 className={`font-semibold dark:text-white ${
                      type === 'oneTime' && (task as NonRepeatedTask).status === 'completed'
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-wrap">{task.description}</div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {type === 'repeated' && (
                      <>
                        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          <Repeat className="h-3 w-3" />
                          {(task as RepeatedTask).frequency}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          <Clock className="h-3 w-3" />
                          Streak: {(task as RepeatedTask).streak}
                        </Badge>
                        {(task as RepeatedTask).lastCompleted && (
                          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                            Last: {new Date((task as RepeatedTask).lastCompleted!).toLocaleDateString()}
                          </Badge>
                        )}
                      </>
                    )}

                    {type === 'oneTime' && (
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
                    onClick={() => handleEdit(task)}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    loading={isLoadingKey(`delete-${task.id}`)}
                  >
                    {!isLoadingKey(`delete-${task.id}`) && (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {tasks.length === 0 && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No {type === 'repeated' ? 'daily recurring' : 'one-time'} tasks yet. Create your first one!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}