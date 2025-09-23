import type { AppData, Idea, ExecutionPipeline, RepeatedTask, NonRepeatedTask } from '@/types';
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

const STORAGE_KEY = 'self-manager-data';
const STORAGE_MIGRATION_KEY = 'self-manager-data-migrated';
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

// Helper function to check if error is a network error
const isNetworkError = (error: any): boolean => {
  return error?.message === 'NETWORK_ERROR' || 
         error?.message?.includes('Failed to fetch') ||
         error?.message?.includes('Network Error');
};

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
    }))
  };
};

export const loadData = async (): Promise<AppData> => {
  let data: AppData | null = null;
  let dataSource = '';

  if (USE_SUPABASE) {
    try {
      data = await loadDataFromSupabase();
      dataSource = 'supabase';
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error loading from Supabase, falling back to localStorage');
        // Fall through to localStorage fallback
      } else {
        console.error('Error loading data from Supabase:', error);
        // Fall through to localStorage fallback
      }
    }
  }

  // If no data from Supabase, try localStorage
  if (!data) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        data = JSON.parse(stored);
        dataSource = 'localStorage';
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  // If we have data, check if it needs migration
  if (data) {
    const migrationKey = `${STORAGE_MIGRATION_KEY}-${dataSource}`;
    const hasBeenMigrated = localStorage.getItem(migrationKey);
    
    if (!hasBeenMigrated) {
      console.log(`Migrating data from ${dataSource} to use UUIDs...`);
      const migratedData = migrateDataToUUIDs(data);
      
      // Save migrated data back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
      localStorage.setItem(migrationKey, 'true');
      
      console.log('Data migration completed');
      return migratedData;
    }
    
    return data;
  }

  // Return default data structure
  return {
    ideas: [],
    executionPipelines: [],
    repeatedTasks: [],
    nonRepeatedTasks: [],
    lastUpdated: new Date().toISOString(),
  };
};

export const saveData = async (data: AppData): Promise<void> => {
  if (USE_SUPABASE) {
    try {
      await saveAllDataToSupabase(data);
      return;
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving to Supabase, falling back to localStorage');
        // Fall through to localStorage fallback
      } else {
        console.error('Error saving data to Supabase:', error);
        // Fall through to localStorage fallback
      }
    }
  }

  try {
    const updatedData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

// Generate a proper UUID v4
export const generateId = (): string => {
  return crypto.randomUUID();
};

// Helper functions for managing different data types
export const addIdea = async (data: AppData, idea: Omit<Idea, 'id' | 'createdAt'>): Promise<AppData> => {
  const newIdea: Idea = {
    ...idea,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  if (USE_SUPABASE) {
    await saveIdea(newIdea);
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
  if (USE_SUPABASE) {
    await deleteIdeaFromSupabase(id);
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

// Individual save functions with network error handling
export const saveIdea = async (idea: Idea): Promise<Idea> => {
  if (USE_SUPABASE) {
    try {
      return await saveIdeaToSupabase(idea);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving idea to Supabase, continuing with local data');
      } else {
        console.error('Error saving idea to Supabase:', error);
      }
    }
  }
  return idea;
};

export const deleteIdeaFromSupabase = async (ideaId: string): Promise<void> => {
  if (USE_SUPABASE) {
    try {
      await deleteIdeaFromSupabaseToSupabase(ideaId);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error deleting idea from Supabase, continuing with local operation');
      } else {
        console.error('Error deleting idea from Supabase:', error);
      }
    }
  }
};

export const saveExecutionPipeline = async (pipeline: ExecutionPipeline): Promise<ExecutionPipeline> => {
  if (USE_SUPABASE) {
    try {
      return await saveExecutionPipelineToSupabase(pipeline);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving pipeline to Supabase, continuing with local data');
      } else {
        console.error('Error saving pipeline to Supabase:', error);
      }
    }
  }
  return pipeline;
};

export const saveRepeatedTask = async (task: RepeatedTask): Promise<RepeatedTask> => {
  if (USE_SUPABASE) {
    try {
      return await saveRepeatedTaskToSupabase(task);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving repeated task to Supabase, continuing with local data');
      } else {
        console.error('Error saving repeated task to Supabase:', error);
      }
    }
  }
  return task;
};

export const deleteRepeatedTaskFromSupabase = async (taskId: string): Promise<void> => {
  if (USE_SUPABASE) {
    try {
      await deleteRepeatedTaskFromSupabaseToSupabase(taskId);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error deleting repeated task from Supabase, continuing with local operation');
      } else {
        console.error('Error deleting repeated task from Supabase:', error);
      }
    }
  }
};

export const saveNonRepeatedTask = async (task: NonRepeatedTask): Promise<NonRepeatedTask> => {
  if (USE_SUPABASE) {
    try {
      return await saveNonRepeatedTaskToSupabase(task);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error saving non-repeated task to Supabase, continuing with local data');
      } else {
        console.error('Error saving non-repeated task to Supabase:', error);
      }
    }
  }
  return task;
};

export const deleteNonRepeatedTaskFromSupabase = async (taskId: string): Promise<void> => {
  if (USE_SUPABASE) {
    try {
      await deleteNonRepeatedTaskFromSupabaseToSupabase(taskId);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error deleting non-repeated task from Supabase, continuing with local operation');
      } else {
        console.error('Error deleting non-repeated task from Supabase:', error);
      }
    }
  }
};
