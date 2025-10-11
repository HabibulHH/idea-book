import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { RepeatedTask, NonRepeatedTask, RegularTask, AppData } from '@/types'
import { Trash2, Edit, CheckCircle, Calendar, Clock, Repeat, Briefcase } from 'lucide-react'
import { deleteRepeatedTaskFromSupabase, deleteNonRepeatedTaskFromSupabase, deleteRegularTaskFromSupabase } from '@/lib/storage'

interface TaskListProps {
  data: AppData
  setData: (data: AppData) => void
  sortedTasks: (RepeatedTask | NonRepeatedTask | RegularTask)[]
  showForm: boolean
  setShowForm: (show: boolean) => void
  editingTask: RepeatedTask | NonRepeatedTask | RegularTask | null
  setEditingTask: (task: RepeatedTask | NonRepeatedTask | RegularTask | null) => void
  taskType: 'daily' | 'office' | 'regular'
  setTaskType: (type: 'daily' | 'office' | 'regular') => void
  formData: {
    title: string
    description: string
    frequency: 'daily' | 'weekly' | 'monthly'
    deadline: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    projectId: string
    timeSlot: 'morning' | 'day' | 'night' | 'no-time-slot'
  }
  setFormData: (data: any) => void
  handleSubmit: (e: React.FormEvent) => void
  resetForm: () => void
}

export function TaskList({
  data,
  setData,
  sortedTasks,
  showForm,
  setShowForm,
  editingTask,
  setEditingTask,
  taskType,
  setTaskType,
  formData,
  setFormData,
  handleSubmit,
  resetForm,
}: TaskListProps) {
  const today = new Date().toISOString().split('T')[0]

  const handleToggleComplete = (task: RepeatedTask | NonRepeatedTask | RegularTask) => {
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
    } else if ('deadline' in task) {
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
    } else {
      // Regular task
      const updatedTask = {
        ...task,
        status: task.status === 'completed' ? 'pending' : 'completed',
        completedAt: task.status === 'completed' ? undefined : new Date().toISOString()
      } as RegularTask
      setData({
        ...data,
        regularTasks: (data.regularTasks || []).map(t => t.id === task.id ? updatedTask : t)
      })
    }
  }

  const handleDelete = async (task: RepeatedTask | NonRepeatedTask | RegularTask) => {
    try {
      console.log('Deleting task:', task)
      console.log('Task has frequency:', 'frequency' in task)
      console.log('Task has deadline:', 'deadline' in task)
      console.log('Task type (if exists):', (task as any).taskType)
      
      
      // Check if ID is a valid UUID before attempting Supabase deletion
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(task.id)
      console.log('Is valid UUID:', isValidUUID)
      
      // Determine task type more reliably
      const isRepeatedTask = 'frequency' in task
      const isNonRepeatedTask = 'deadline' in task
      const isRegularTask = !isRepeatedTask && !isNonRepeatedTask
      
      console.log('Task type detection:', { isRepeatedTask, isNonRepeatedTask, isRegularTask })
      
      if (isValidUUID) {
        if (isRepeatedTask) {
          console.log('Deleting repeated task from Supabase')
          // Delete from Supabase
          await deleteRepeatedTaskFromSupabase(task.id)
        } else if (isNonRepeatedTask) {
          console.log('Deleting non-repeated task from Supabase')
          // Delete from Supabase
          await deleteNonRepeatedTaskFromSupabase(task.id)
        } else if (isRegularTask) {
          console.log('Deleting regular task from Supabase')
          // Delete regular task from Supabase
          await deleteRegularTaskFromSupabase(task.id)
        }
      } else {
        console.log('Skipping Supabase deletion for non-UUID task:', task.id)
      }
      
      // Always update local state regardless of Supabase deletion
      if (isRepeatedTask) {
        console.log('Updating local state for repeated task')
        setData({
          ...data,
          repeatedTasks: data.repeatedTasks.filter(t => t.id !== task.id)
        })
      } else if (isNonRepeatedTask) {
        console.log('Updating local state for non-repeated task')
        setData({
          ...data,
          nonRepeatedTasks: data.nonRepeatedTasks.filter(t => t.id !== task.id)
        })
      } else if (isRegularTask) {
        console.log('Updating local state for regular task')
        setData({
          ...data,
          regularTasks: (data.regularTasks || []).filter(t => t.id !== task.id)
        })
      }
      
    } catch (error) {
      console.error('Error deleting task:', error)
      // Still update local state even if Supabase deletion fails
      const isRepeatedTask = 'frequency' in task
      const isNonRepeatedTask = 'deadline' in task
      const isRegularTask = !isRepeatedTask && !isNonRepeatedTask
      
      if (isRepeatedTask) {
        console.log('Error: Updating local state for repeated task')
        setData({
          ...data,
          repeatedTasks: data.repeatedTasks.filter(t => t.id !== task.id)
        })
      } else if (isNonRepeatedTask) {
        console.log('Error: Updating local state for non-repeated task')
        setData({
          ...data,
          nonRepeatedTasks: data.nonRepeatedTasks.filter(t => t.id !== task.id)
        })
      } else if (isRegularTask) {
        console.log('Error: Updating local state for regular task')
        setData({
          ...data,
          regularTasks: (data.regularTasks || []).filter(t => t.id !== task.id)
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

  const isTaskCompleted = (task: RepeatedTask | NonRepeatedTask | RegularTask) => {
    if ('frequency' in task) {
      // Daily task - check if completed today
      return task.lastCompleted === today
    } else if ('deadline' in task) {
      // Office task
      return task.status === 'completed'
    } else {
      // Regular task
      return task.status === 'completed'
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide min-h-0 fade-in">
      <div className="grid gap-4">
        {/* Quick Add Task Input */}
        {!showForm && !editingTask && (
          <div
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-text transition-all duration-200 hover-lift hover-scale"
            onClick={() => setShowForm(true)}
          >
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full transition-all duration-200 hover:border-green-500"></div>
            <span className="text-gray-500 transition-colors duration-200 hover:text-gray-700">Add a task</span>
          </div>
        )}

        {/* Expanded Form */}
        {(showForm || editingTask) && (
          <Card className="border-green-200 shadow-sm bg-white">
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
                  <Button
                    type="button"
                    variant={taskType === 'regular' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTaskType('regular')}
                    className="flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4" />
                    Regular Task
                  </Button>
                </div>

                <div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                    placeholder="Task name"
                    className="text-lg font-medium border border-gray-300 bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    rows={2}
                    className="border border-gray-300 bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                  />
                </div>

                {/* Options Row */}
                <div className="flex items-center gap-2 pt-2">
                  {taskType === 'daily' && (
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData((prev: any) => ({ ...prev, frequency: value as any }))}
                    >
                      <SelectTrigger className="w-auto h-8 text-sm border border-gray-300 focus:border-gray-500">
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
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, deadline: e.target.value }))}
                        className="w-auto h-8 text-sm border border-gray-300 focus:border-green-500"
                        placeholder="Deadline"
                      />
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData((prev: any) => ({ ...prev, priority: value as any }))}
                      >
                        <SelectTrigger className="w-auto h-8 text-sm border border-gray-300 focus:border-gray-500">
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

                  {taskType === 'regular' && (
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData((prev: any) => ({ ...prev, priority: value as any }))}
                    >
                      <SelectTrigger className="w-auto h-8 text-sm border border-gray-300 focus:border-gray-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Project and Time Slot Selection */}
                <div className="flex items-center gap-2 pt-2">
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData((prev: any) => ({ ...prev, projectId: value }))}
                  >
                    <SelectTrigger className="w-auto h-8 text-sm border border-gray-300 focus:border-gray-500">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-project">No Project</SelectItem>
                      {data.projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.timeSlot}
                    onValueChange={(value) => setFormData((prev: any) => ({ ...prev, timeSlot: value }))}
                  >
                    <SelectTrigger className="w-auto h-8 text-sm border border-gray-300 focus:border-gray-500">
                      <SelectValue placeholder="Time Slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-time-slot">No Time Slot</SelectItem>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm} className="hover-bounce">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!formData.title.trim()} className="hover-bounce">
                    {editingTask ? 'Update' : 'Add task'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Today's Tasks */}
        {sortedTasks.map((task) => (
          <Card key={task.id} className="bg-white border-gray-200 shadow-sm hover-lift transition-all duration-200 fade-in">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {('deadline' in task || (!('frequency' in task) && !('deadline' in task))) && (
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
                    <h3 className={`font-semibold text-gray-900 ${
                      isTaskCompleted(task) ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{task.description}</div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {'frequency' in task ? (
                      <>
                        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 text-gray-700">
                          <Repeat className="h-3 w-3" />
                          {task.frequency}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 text-gray-700">
                          <Clock className="h-3 w-3" />
                          Streak: {task.streak}
                        </Badge>
                        {task.lastCompleted && (
                          <Badge className="bg-green-100 text-green-800">
                            Last: {new Date(task.lastCompleted).toLocaleDateString()}
                          </Badge>
                        )}
                      </>
                    ) : 'deadline' in task ? (
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
                    ) : (
                      <>
                        <Badge className={getPriorityColor((task as RegularTask).priority)}>
                          {(task as RegularTask).priority}
                        </Badge>
                        <Badge className={getStatusColor((task as RegularTask).status)}>
                          {(task as RegularTask).status}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 text-gray-700">
                          <Briefcase className="h-3 w-3" />
                          Regular
                        </Badge>
                      </>
                    )}

                    {/* Project and Time Slot Badges */}
                    {task.projectId && (
                      <Badge variant="outline" className="flex items-center gap-1 border-blue-300 text-blue-700">
                        <Briefcase className="h-3 w-3" />
                        {data.projects?.find(p => p.id === task.projectId)?.name || 'Project'}
                      </Badge>
                    )}
                    {task.timeSlot && (
                      <Badge variant="outline" className="flex items-center gap-1 border-purple-300 text-purple-700">
                        <Clock className="h-3 w-3" />
                        {task.timeSlot}
                      </Badge>
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
                        deadline: 'frequency' in task ? '' : ('deadline' in task ? task.deadline : ''),
                        priority: 'frequency' in task ? 'medium' : ('priority' in task ? task.priority : 'medium')
                      })
                      if ('frequency' in task) {
                        setTaskType('daily')
                      } else if ('deadline' in task) {
                        setTaskType('office')
                      } else {
                        setTaskType('regular')
                      }
                      setShowForm(true)
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedTasks.length === 0 && (
          <Card className="bg-white border-gray-200 hover-lift transition-all duration-200 fade-in">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400 transition-transform duration-200 hover:scale-110" />
              <p className="text-gray-500 mb-2">No tasks for today</p>
              <p className="text-sm text-gray-400">Add your first task to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
