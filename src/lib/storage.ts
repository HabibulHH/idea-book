import type { AppData, Idea, ExecutionPipeline, RepeatedTask, NonRepeatedTask, RegularTask } from '@/types';
import {
  loadDataFromSupabase,
  saveIdea as saveIdeaToSupabase,
  deleteIdeaFromSupabase as deleteIdeaFromSupabaseToSupabase,
  saveExecutionPipeline as saveExecutionPipelineToSupabase,
  saveRepeatedTask as saveRepeatedTaskToSupabase,
  deleteRepeatedTaskFromSupabase as deleteRepeatedTaskFromSupabaseToSupabase,
  saveNonRepeatedTask as saveNonRepeatedTaskToSupabase,
  deleteNonRepeatedTaskFromSupabase as deleteNonRepeatedTaskFromSupabaseToSupabase,
  saveAllDataToSupabase
} from './supabaseStorage';

// Generate a proper UUID v4
export const generateId = (): string => {
  return crypto.randomUUID();
};

export const loadData = async (): Promise<AppData> => {
  try {
    return await loadDataFromSupabase();
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    // Return default data structure if Supabase fails
    return {
      ideas: [],
      executionPipelines: [],
      repeatedTasks: [],
      nonRepeatedTasks: [],
      regularTasks: [],
      newsfeedPosts: [],
      books: [],
      people: [],
      projects: []
    };
  }
};

export const saveData = async (data: AppData): Promise<void> => {
  try {
    await saveAllDataToSupabase(data);
  } catch (error) {
    console.error('Error saving data to Supabase:', error);
    throw error; // Re-throw to let the UI handle the error
  }
};

// Helper functions for managing different data types
export const addIdea = async (data: AppData, idea: Omit<Idea, 'id' | 'createdAt'>): Promise<AppData> => {
  const newIdea: Idea = {
    ...idea,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  try {
    await saveIdeaToSupabase(newIdea);
  } catch (error) {
    console.error('Error saving idea to Supabase:', error);
    throw error;
  }

  return {
    ...data,
    ideas: [...data.ideas, newIdea],
  };
};

export const updateIdea = (data: AppData, id: string, updates: Partial<Idea>): AppData => {
  return {
    ...data,
    ideas: data.ideas.map(idea => 
      idea.id === id ? { ...idea, ...updates } : idea
    ),
  };
};

export const deleteIdea = async (data: AppData, id: string): Promise<AppData> => {
  try {
    await deleteIdeaFromSupabaseToSupabase(id);
  } catch (error) {
    console.error('Error deleting idea from Supabase:', error);
    throw error;
  }
  
  return {
    ...data,
    ideas: data.ideas.filter(idea => idea.id !== id),
    executionPipelines: data.executionPipelines.filter(pipeline => pipeline.ideaId !== id),
  };
};

export const addExecutionPipeline = (data: AppData, ideaId: string): AppData => {
  const newPipeline: ExecutionPipeline = {
    id: generateId(),
    ideaId,
    currentStage: 1,
    stages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: '',
  };
  
  return {
    ...data,
    executionPipelines: [...data.executionPipelines, newPipeline],
    ideas: data.ideas.map(idea => 
      idea.id === ideaId ? { ...idea, status: 'in-pipeline' as const } : idea
    ),
  };
};

export const updatePipelineStage = (data: AppData, pipelineId: string, stage: number): AppData => {
  return {
    ...data,
    executionPipelines: data.executionPipelines.map(pipeline =>
      pipeline.id === pipelineId 
        ? { ...pipeline, currentStage: stage, updatedAt: new Date().toISOString() }
        : pipeline
    ),
  };
};

export const addRepeatedTask = (data: AppData, task: Omit<RepeatedTask, 'id' | 'createdAt' | 'streak'>): AppData => {
  const newTask: RepeatedTask = {
    ...task,
    id: generateId(),
    createdAt: new Date().toISOString(),
    streak: 0,
  };
  
  return {
    ...data,
    repeatedTasks: [...data.repeatedTasks, newTask],
  };
};

export const completeRepeatedTask = (data: AppData, taskId: string): AppData => {
  return {
    ...data,
    repeatedTasks: data.repeatedTasks.map(task =>
      task.id === taskId
        ? { 
            ...task, 
            lastCompleted: new Date().toISOString(),
            streak: task.streak + 1
          }
        : task
    ),
  };
};

export const addNonRepeatedTask = (data: AppData, task: Omit<NonRepeatedTask, 'id' | 'createdAt'>): AppData => {
  const newTask: NonRepeatedTask = {
    ...task,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  return {
    ...data,
    nonRepeatedTasks: [...data.nonRepeatedTasks, newTask],
  };
};

export const updateNonRepeatedTask = (data: AppData, taskId: string, updates: Partial<NonRepeatedTask>): AppData => {
  return {
    ...data,
    nonRepeatedTasks: data.nonRepeatedTasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ),
  };
};

// Individual save functions
export const saveIdea = async (idea: Idea): Promise<Idea> => {
  try {
    return await saveIdeaToSupabase(idea);
  } catch (error) {
    console.error('Error saving idea to Supabase:', error);
    throw error;
  }
};

export const deleteIdeaFromSupabase = async (ideaId: string): Promise<void> => {
  try {
    await deleteIdeaFromSupabaseToSupabase(ideaId);
  } catch (error) {
    console.error('Error deleting idea from Supabase:', error);
    throw error;
  }
};

export const saveExecutionPipeline = async (pipeline: ExecutionPipeline): Promise<ExecutionPipeline> => {
  try {
    return await saveExecutionPipelineToSupabase(pipeline);
  } catch (error) {
    console.error('Error saving pipeline to Supabase:', error);
    throw error;
  }
};

export const saveRepeatedTask = async (task: RepeatedTask): Promise<RepeatedTask> => {
  try {
    return await saveRepeatedTaskToSupabase(task);
  } catch (error) {
    console.error('Error saving repeated task to Supabase:', error);
    throw error;
  }
};

export const deleteRepeatedTaskFromSupabase = async (taskId: string): Promise<void> => {
  try {
    await deleteRepeatedTaskFromSupabaseToSupabase(taskId);
  } catch (error) {
    console.error('Error deleting repeated task from Supabase:', error);
    throw error;
  }
};

export const saveNonRepeatedTask = async (task: NonRepeatedTask): Promise<NonRepeatedTask> => {
  try {
    return await saveNonRepeatedTaskToSupabase(task);
  } catch (error) {
    console.error('Error saving non-repeated task to Supabase:', error);
    throw error;
  }
};

export const deleteNonRepeatedTaskFromSupabase = async (taskId: string): Promise<void> => {
  try {
    await deleteNonRepeatedTaskFromSupabaseToSupabase(taskId);
  } catch (error) {
    console.error('Error deleting non-repeated task from Supabase:', error);
    throw error;
  }
};

export const saveRegularTask = async (task: RegularTask): Promise<RegularTask> => {
  try {
    const { supabase } = await import('./supabase');
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    
    const dbTask = {
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      created_at: task.createdAt,
      completed_at: task.completedAt
    };

    const { error } = await supabase
      .from('regular_tasks')
      .upsert(dbTask)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return task;
  } catch (error) {
    console.error('Error saving regular task to Supabase:', error);
    throw error;
  }
};

export const deleteRegularTaskFromSupabase = async (taskId: string): Promise<void> => {
  try {
    const { supabase } = await import('./supabase');
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    
    const { error } = await supabase
      .from('regular_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting regular task from Supabase:', error);
    throw error;
  }
};