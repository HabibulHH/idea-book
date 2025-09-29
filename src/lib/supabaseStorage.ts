import { supabase } from './supabase'
import type { AppData, Idea, ExecutionPipeline, RepeatedTask, NonRepeatedTask, RegularTask } from '@/types'

// Helper function to get current user ID (you'll need to implement authentication)
const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || 'anonymous' // Fallback for now
}

// Helper function to check if a string is a valid UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Migration function to convert old IDs to UUIDs
const migrateDataToUUIDs = (data: AppData): AppData => {
  const idMap = new Map<string, string>();
  
  // Generate new UUIDs for all existing IDs
  const generateNewId = (oldId: string): string => {
    if (isValidUUID(oldId)) {
      return oldId; // Already a valid UUID
    }
    
    if (!idMap.has(oldId)) {
      idMap.set(oldId, crypto.randomUUID());
    }
    return idMap.get(oldId)!;
  };

  return {
    ...data,
    ideas: data.ideas.map(idea => ({
      ...idea,
      id: generateNewId(idea.id)
    })),
    executionPipelines: data.executionPipelines.map(pipeline => ({
      ...pipeline,
      id: generateNewId(pipeline.id),
      ideaId: generateNewId(pipeline.ideaId)
    })),
    repeatedTasks: data.repeatedTasks.map(task => ({
      ...task,
      id: generateNewId(task.id)
    })),
    nonRepeatedTasks: data.nonRepeatedTasks.map(task => ({
      ...task,
      id: generateNewId(task.id)
    })),
    regularTasks: (data.regularTasks || []).map(task => ({
      ...task,
      id: generateNewId(task.id)
    }))
  };
};

// Helper function to check if error is due to network connectivity issues
const isNetworkError = (error: any): boolean => {
  if (!error) return false
  
  // Check for common network error patterns
  const errorMessage = error.message?.toLowerCase() || ''
  const errorDetails = error.details?.toLowerCase() || ''
  
  return (
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('internet disconnected') ||
    errorMessage.includes('connection') ||
    errorDetails.includes('failed to fetch') ||
    errorDetails.includes('network error') ||
    errorDetails.includes('internet disconnected') ||
    error.code === 'NETWORK_ERROR' ||
    error.name === 'TypeError'
  )
}

// Helper function to check if error is due to missing table
const isTableMissingError = (error: any) => error?.code === 'PGRST205'

// Convert database rows to our app types
const convertDbToAppTypes = (dbData: any): AppData => {
  return {
    ideas: dbData.ideas.map((idea: any) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      createdAt: idea.created_at,
      priority: idea.priority,
      tags: idea.tags,
      status: idea.status
    })),
    executionPipelines: dbData.execution_pipelines.map((pipeline: any) => ({
      id: pipeline.id,
      ideaId: pipeline.idea_id,
      currentStage: pipeline.current_stage,
      stages: pipeline.stages,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
      notes: pipeline.notes
    })),
    repeatedTasks: dbData.repeated_tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      frequency: task.frequency,
      isActive: task.is_active,
      lastCompleted: task.last_completed,
      streak: task.streak,
      createdAt: task.created_at
    })),
    nonRepeatedTasks: dbData.non_repeated_tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      createdAt: task.created_at,
      completedAt: task.completed_at
    })),
    regularTasks: (dbData.regular_tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      createdAt: task.created_at,
      completedAt: task.completed_at
    })),
    newsfeedPosts: dbData.newsfeed_posts || [],
    books: dbData.books || [],
    people: dbData.people || [],
    lastUpdated: new Date().toISOString()
  }
}

// Load all data from Supabase
export const loadDataFromSupabase = async (): Promise<AppData> => {
  try {
    const userId = await getCurrentUserId()

    const [ideasResult, pipelinesResult, repeatedTasksResult, nonRepeatedTasksResult, regularTasksResult] = await Promise.all([
      supabase.from('ideas').select('*').eq('user_id', userId),
      supabase.from('execution_pipelines').select('*').eq('user_id', userId),
      supabase.from('repeated_tasks').select('*').eq('user_id', userId),
      supabase.from('non_repeated_tasks').select('*').eq('user_id', userId),
      supabase.from('regular_tasks').select('*').eq('user_id', userId)
    ])

    // Check for network errors and handle gracefully
    if (ideasResult.error && isNetworkError(ideasResult.error)) {
      console.warn('Network error loading ideas, using fallback data')
      throw new Error('NETWORK_ERROR')
    }
    if (pipelinesResult.error && isNetworkError(pipelinesResult.error)) {
      console.warn('Network error loading pipelines, using fallback data')
      throw new Error('NETWORK_ERROR')
    }
    if (repeatedTasksResult.error && isNetworkError(repeatedTasksResult.error)) {
      console.warn('Network error loading repeated tasks, using fallback data')
      throw new Error('NETWORK_ERROR')
    }
    if (nonRepeatedTasksResult.error && isNetworkError(nonRepeatedTasksResult.error)) {
      console.warn('Network error loading non-repeated tasks, using fallback data')
      throw new Error('NETWORK_ERROR')
    }

    // Check for table not found errors (PGRST205) and handle gracefully
    if (ideasResult.error && !isTableMissingError(ideasResult.error)) throw ideasResult.error
    if (pipelinesResult.error && !isTableMissingError(pipelinesResult.error)) throw pipelinesResult.error
    if (repeatedTasksResult.error && !isTableMissingError(repeatedTasksResult.error)) throw repeatedTasksResult.error
    if (nonRepeatedTasksResult.error && !isTableMissingError(nonRepeatedTasksResult.error)) throw nonRepeatedTasksResult.error

    return convertDbToAppTypes({
      ideas: ideasResult.data || [],
      execution_pipelines: pipelinesResult.data || [],
      repeated_tasks: repeatedTasksResult.data || [],
      non_repeated_tasks: nonRepeatedTasksResult.data || []
    })
  } catch (error) {
    console.error('Error loading data from Supabase:', error)
    // Return default empty data structure
    return {
      ideas: [],
      executionPipelines: [],
      repeatedTasks: [],
      nonRepeatedTasks: [],
      newsfeedPosts: [],
      books: [],
      people: [],
      lastUpdated: new Date().toISOString()
    }
  }
}

// Save idea to Supabase
export const saveIdea = async (idea: Idea): Promise<Idea> => {
  try {
    const userId = await getCurrentUserId()

    const dbIdea = {
      id: idea.id,
      user_id: userId,
      title: idea.title,
      description: idea.description,
      created_at: idea.createdAt,
      priority: idea.priority,
      tags: idea.tags,
      status: idea.status
    }

    const { error } = await supabase
      .from('ideas')
      .upsert(dbIdea)
      .select()
      .single()

    if (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving idea, data will be saved locally')
        throw new Error('NETWORK_ERROR')
      }
      throw error
    }
    return idea
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Network error saving idea, continuing with local data')
      return idea
    }
    throw error
  }
}

// Delete idea from Supabase
export const deleteIdeaFromSupabase = async (ideaId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', ideaId)

    if (error) {
      if (isNetworkError(error)) {
        console.warn('Network error deleting idea, operation will be retried later')
        throw new Error('NETWORK_ERROR')
      }
      throw error
    }
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Network error deleting idea, continuing with local operation')
      return
    }
    throw error
  }
}

// Save execution pipeline to Supabase
export const saveExecutionPipeline = async (pipeline: ExecutionPipeline): Promise<ExecutionPipeline> => {
  try {
    const userId = await getCurrentUserId()

    const dbPipeline = {
      id: pipeline.id,
      user_id: userId,
      idea_id: pipeline.ideaId,
      current_stage: pipeline.currentStage,
      stages: pipeline.stages,
      created_at: pipeline.createdAt,
      updated_at: pipeline.updatedAt,
      notes: pipeline.notes
    }

    const { error } = await supabase
      .from('execution_pipelines')
      .upsert(dbPipeline)
      .select()
      .single()

    if (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving pipeline, data will be saved locally')
        throw new Error('NETWORK_ERROR')
      }
      throw error
    }
    return pipeline
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Network error saving pipeline, continuing with local data')
      return pipeline
    }
    throw error
  }
}

// Save repeated task to Supabase
export const saveRepeatedTask = async (task: RepeatedTask): Promise<RepeatedTask> => {
  try {
    const userId = await getCurrentUserId()

    const dbTask = {
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description,
      frequency: task.frequency,
      is_active: task.isActive,
      last_completed: task.lastCompleted,
      streak: task.streak,
      created_at: task.createdAt
    }

    const { error } = await supabase
      .from('repeated_tasks')
      .upsert(dbTask)
      .select()
      .single()

    if (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving repeated task, data will be saved locally')
        throw new Error('NETWORK_ERROR')
      }
      throw error
    }
    return task
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Network error saving repeated task, continuing with local data')
      return task
    }
    throw error
  }
}

// Delete repeated task from Supabase
export const deleteRepeatedTaskFromSupabase = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('repeated_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      if (isNetworkError(error)) {
        console.warn('Network error deleting repeated task, operation will be retried later')
        throw new Error('NETWORK_ERROR')
      }
      throw error
    }
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Network error deleting repeated task, continuing with local operation')
      return
    }
    throw error
  }
}

// Save non-repeated task to Supabase
export const saveNonRepeatedTask = async (task: NonRepeatedTask): Promise<NonRepeatedTask> => {
  try {
    const userId = await getCurrentUserId()

    const dbTask = {
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      created_at: task.createdAt,
      completed_at: task.completedAt
    }

    const { error } = await supabase
      .from('non_repeated_tasks')
      .upsert(dbTask)
      .select()
      .single()

    if (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving non-repeated task, data will be saved locally')
        throw new Error('NETWORK_ERROR')
      }
      throw error
    }
    return task
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Network error saving non-repeated task, continuing with local data')
      return task
    }
    throw error
  }
}

// Delete non-repeated task from Supabase
export const deleteNonRepeatedTaskFromSupabase = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('non_repeated_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      if (isNetworkError(error)) {
        console.warn('Network error deleting non-repeated task, operation will be retried later')
        throw new Error('NETWORK_ERROR')
      }
      throw error
    }
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Network error deleting non-repeated task, continuing with local operation')
      return
    }
    throw error
  }
}

// Bulk save all data (for import functionality)
export const saveAllDataToSupabase = async (appData: AppData): Promise<void> => {
  try {
    const userId = await getCurrentUserId()

    // Check if data needs migration before saving
    const needsMigration = appData.ideas.some(idea => !isValidUUID(idea.id)) ||
                          appData.executionPipelines.some(pipeline => !isValidUUID(pipeline.id) || !isValidUUID(pipeline.ideaId)) ||
                          appData.repeatedTasks.some(task => !isValidUUID(task.id)) ||
                          appData.nonRepeatedTasks.some(task => !isValidUUID(task.id)) ||
                          (appData.regularTasks || []).some(task => !isValidUUID(task.id));

    let dataToSave = appData;
    if (needsMigration) {
      console.log('Migrating data to UUIDs before saving to Supabase...');
      dataToSave = migrateDataToUUIDs(appData);
    }

    // Use UPSERT instead of DELETE + INSERT to avoid duplicate key errors
    const upsertPromises = []

    if (dataToSave.ideas.length > 0) {
      const dbIdeas = dataToSave.ideas.map(idea => ({
        id: idea.id,
        user_id: userId,
        title: idea.title,
        description: idea.description,
        created_at: idea.createdAt,
        priority: idea.priority,
        tags: idea.tags,
        status: idea.status
      }))
      upsertPromises.push(supabase.from('ideas').upsert(dbIdeas))
    }

    if (dataToSave.executionPipelines.length > 0) {
      const dbPipelines = dataToSave.executionPipelines.map(pipeline => ({
        id: pipeline.id,
        user_id: userId,
        idea_id: pipeline.ideaId,
        current_stage: pipeline.currentStage,
        stages: pipeline.stages,
        created_at: pipeline.createdAt,
        updated_at: pipeline.updatedAt,
        notes: pipeline.notes
      }))
      upsertPromises.push(supabase.from('execution_pipelines').upsert(dbPipelines))
    }

    if (dataToSave.repeatedTasks.length > 0) {
      const dbRepeatedTasks = dataToSave.repeatedTasks.map(task => ({
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description,
        frequency: task.frequency,
        is_active: task.isActive,
        last_completed: task.lastCompleted,
        streak: task.streak,
        created_at: task.createdAt
      }))
      upsertPromises.push(supabase.from('repeated_tasks').upsert(dbRepeatedTasks))
    }

    if (dataToSave.nonRepeatedTasks.length > 0) {
      const dbNonRepeatedTasks = dataToSave.nonRepeatedTasks.map(task => ({
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status,
        created_at: task.createdAt,
        completed_at: task.completedAt
      }))
      upsertPromises.push(supabase.from('non_repeated_tasks').upsert(dbNonRepeatedTasks))
    }

    if ((dataToSave.regularTasks || []).length > 0) {
      const dbRegularTasks = dataToSave.regularTasks.map(task => ({
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        created_at: task.createdAt,
        completed_at: task.completedAt
      }))
      upsertPromises.push(supabase.from('regular_tasks').upsert(dbRegularTasks))
    }

    const results = await Promise.allSettled(upsertPromises)
    results.forEach((result, index) => {
      if (result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error)) {
        const error = result.status === 'rejected' ? result.reason : result.value.error
        if (isNetworkError(error)) {
          console.warn(`Network error during upsert operation ${index}, data will be saved locally`)
        } else if (!isTableMissingError(error)) {
          console.error(`Upsert operation ${index} failed:`, error)
          throw error
        }
      }
    })
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Network connectivity issues detected, data will be saved locally only')
      throw error
    }
    console.error('Error saving all data to Supabase:', error)
    throw error
  }
}