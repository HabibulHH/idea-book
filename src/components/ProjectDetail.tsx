import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, Target, FolderOpen, Edit, Trash2, CheckCircle, Clock, AlertCircle, Play, Pause, Square, ArrowLeft, GripVertical } from 'lucide-react'
import type { Project, ProjectMilestone, ProjectStage, ProjectBulkTask } from '@/types'
import { projectService } from '@/lib/projectService'

interface ProjectDetailProps {
  project: Project
  onBack: () => void
  onUpdate: (project: Project) => void
}

export function ProjectDetail({ project, onBack, onUpdate }: ProjectDetailProps) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [stages, setStages] = useState<ProjectStage[]>([])
  const [bulkTasks, setBulkTasks] = useState<ProjectBulkTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [showStageModal, setShowStageModal] = useState(false)
  const [showBulkTaskModal, setShowBulkTaskModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form states
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    targetDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'overdue'
  })

  const [stageForm, setStageForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  const [bulkTaskForm, setBulkTaskForm] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  })

  useEffect(() => {
    loadProjectData()
  }, [project.id])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      const [milestonesData, stagesData, bulkTasksData] = await Promise.all([
        projectService.getMilestones(project.id),
        projectService.getStages(project.id),
        projectService.getBulkTasks(project.id)
      ])
      
      setMilestones(milestonesData)
      setStages(stagesData)
      setBulkTasks(bulkTasksData)
    } catch (error) {
      console.error('Error loading project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMilestone = async () => {
    try {
      const data = await projectService.createMilestone({
        projectId: project.id,
        name: milestoneForm.name,
        description: milestoneForm.description,
        targetDate: milestoneForm.targetDate || undefined,
        status: milestoneForm.status,
        orderIndex: milestones.length
      })

      setMilestones(prev => [...prev, data])
      setShowMilestoneModal(false)
      resetMilestoneForm()
    } catch (error) {
      console.error('Error creating milestone:', error)
    }
  }

  const handleCreateStage = async () => {
    try {
      const data = await projectService.createStage({
        projectId: project.id,
        name: stageForm.name,
        description: stageForm.description,
        color: stageForm.color,
        orderIndex: stages.length,
        isCompleted: false
      })

      setStages(prev => [...prev, data])
      setShowStageModal(false)
      resetStageForm()
    } catch (error) {
      console.error('Error creating stage:', error)
    }
  }

  const handleCreateBulkTask = async () => {
    try {
      const data = await projectService.createBulkTask({
        projectId: project.id,
        title: bulkTaskForm.title,
        description: bulkTaskForm.description,
        frequency: bulkTaskForm.frequency,
        priority: bulkTaskForm.priority,
        isActive: true
      })

      setBulkTasks(prev => [...prev, data])
      setShowBulkTaskModal(false)
      resetBulkTaskForm()
    } catch (error) {
      console.error('Error creating bulk task:', error)
    }
  }

  const handleGenerateTasks = async () => {
    try {
      await projectService.generateTasksFromBulkTasks(project.id)
      alert('Tasks generated successfully! Check your Tasks section.')
    } catch (error) {
      console.error('Error generating tasks:', error)
    }
  }

  const resetMilestoneForm = () => {
    setMilestoneForm({
      name: '',
      description: '',
      targetDate: '',
      status: 'pending'
    })
  }

  const resetStageForm = () => {
    setStageForm({
      name: '',
      description: '',
      color: '#3B82F6'
    })
  }

  const resetBulkTaskForm = () => {
    setBulkTaskForm({
      title: '',
      description: '',
      frequency: 'daily',
      priority: 'medium'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800">
            {project.status}
          </Badge>
          <Badge className="bg-yellow-100 text-yellow-800">
            {project.priority}
          </Badge>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Milestones</p>
                <p className="text-2xl font-bold">{milestones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Stages</p>
                <p className="text-2xl font-bold">{stages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Bulk Tasks</p>
                <p className="text-2xl font-bold">{bulkTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="milestones" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="stages">Stages</TabsTrigger>
          <TabsTrigger value="bulk-tasks">Bulk Tasks</TabsTrigger>
        </TabsList>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Milestones</h2>
            <Button onClick={() => setShowMilestoneModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          <div className="grid gap-4">
            {milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{milestone.name}</h3>
                      {milestone.description && (
                        <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                      )}
                      {milestone.targetDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          Target: {new Date(milestone.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stages Tab */}
        <TabsContent value="stages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stages</h2>
            <Button onClick={() => setShowStageModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stage
            </Button>
          </div>

          <div className="grid gap-4">
            {stages.map((stage) => (
              <Card key={stage.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <div>
                        <h3 className="font-semibold">{stage.name}</h3>
                        {stage.description && (
                          <p className="text-gray-600 text-sm">{stage.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={stage.isCompleted ? "default" : "outline"}>
                        {stage.isCompleted ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bulk Tasks Tab */}
        <TabsContent value="bulk-tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Bulk Tasks</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGenerateTasks}>
                Generate Tasks
              </Button>
              <Button onClick={() => setShowBulkTaskModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bulk Task
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {bulkTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline">
                        {task.frequency}
                      </Badge>
                      <Badge variant={task.isActive ? "default" : "secondary"}>
                        {task.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add Milestone</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter milestone name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter milestone description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <Input
                  type="date"
                  value={milestoneForm.targetDate}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, targetDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={milestoneForm.status}
                  onValueChange={(value: any) => setMilestoneForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMilestoneModal(false)
                  resetMilestoneForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateMilestone}>
                Create Milestone
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add Stage</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  value={stageForm.name}
                  onChange={(e) => setStageForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter stage name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={stageForm.description}
                  onChange={(e) => setStageForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter stage description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <Input
                  type="color"
                  value={stageForm.color}
                  onChange={(e) => setStageForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStageModal(false)
                  resetStageForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateStage}>
                Create Stage
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Task Modal */}
      {showBulkTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add Bulk Task</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  value={bulkTaskForm.title}
                  onChange={(e) => setBulkTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={bulkTaskForm.description}
                  onChange={(e) => setBulkTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <Select
                    value={bulkTaskForm.frequency}
                    onValueChange={(value: any) => setBulkTaskForm(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <Select
                    value={bulkTaskForm.priority}
                    onValueChange={(value: any) => setBulkTaskForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkTaskModal(false)
                  resetBulkTaskForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateBulkTask}>
                Create Bulk Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
