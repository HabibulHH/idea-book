import { supabase } from './supabase'
import type { Project, ProjectMilestone, ProjectStage, ProjectBulkTask } from '@/types'

export const projectService = {
  // Projects
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_milestones(*),
        project_stages(*),
        project_bulk_tasks(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data?.map(project => ({
      ...project,
      milestones: project.project_milestones || [],
      stages: project.project_stages || [],
      bulkTasks: project.project_bulk_tasks || []
    })) || []
  },

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: projectData.name,
        description: projectData.description,
        priority: projectData.priority,
        status: projectData.status,
        start_date: projectData.startDate || null,
        end_date: projectData.endDate || null,
        tags: projectData.tags || []
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Milestones
  async getMilestones(projectId: string): Promise<ProjectMilestone[]> {
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createMilestone(milestoneData: Omit<ProjectMilestone, 'id' | 'createdAt'>): Promise<ProjectMilestone> {
    const { data, error } = await supabase
      .from('project_milestones')
      .insert(milestoneData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateMilestone(id: string, updates: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    const { data, error } = await supabase
      .from('project_milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteMilestone(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Stages
  async getStages(projectId: string): Promise<ProjectStage[]> {
    const { data, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createStage(stageData: Omit<ProjectStage, 'id' | 'createdAt'>): Promise<ProjectStage> {
    const { data, error } = await supabase
      .from('project_stages')
      .insert(stageData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateStage(id: string, updates: Partial<ProjectStage>): Promise<ProjectStage> {
    const { data, error } = await supabase
      .from('project_stages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteStage(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_stages')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Bulk Tasks
  async getBulkTasks(projectId: string): Promise<ProjectBulkTask[]> {
    const { data, error } = await supabase
      .from('project_bulk_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async createBulkTask(bulkTaskData: Omit<ProjectBulkTask, 'id' | 'createdAt'>): Promise<ProjectBulkTask> {
    const { data, error } = await supabase
      .from('project_bulk_tasks')
      .insert(bulkTaskData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateBulkTask(id: string, updates: Partial<ProjectBulkTask>): Promise<ProjectBulkTask> {
    const { data, error } = await supabase
      .from('project_bulk_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteBulkTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_bulk_tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Generate tasks from bulk tasks
  async generateTasksFromBulkTasks(projectId: string): Promise<void> {
    const bulkTasks = await this.getBulkTasks(projectId)
    const activeBulkTasks = bulkTasks.filter(task => task.isActive)

    for (const bulkTask of activeBulkTasks) {
      // Create repeated tasks based on frequency
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) continue

      const taskData = {
        user_id: user.id,
        title: bulkTask.title,
        description: bulkTask.description || '',
        frequency: bulkTask.frequency,
        priority: bulkTask.priority,
        project_id: projectId,
        is_active: true,
        streak: 0
      }

      await supabase
        .from('repeated_tasks')
        .insert(taskData)
    }
  }
}
