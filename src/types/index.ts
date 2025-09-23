export interface Idea {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  status: 'parking' | 'in-pipeline' | 'completed' | 'archived';
}

export interface ExecutionStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface ExecutionPipeline {
  id: string;
  ideaId: string;
  currentStage: number;
  stages: ExecutionStage[];
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface RepeatedTask {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  lastCompleted?: string;
  streak: number;
  createdAt: string;
}

export interface NonRepeatedTask {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  createdAt: string;
  completedAt?: string;
}

export interface AppData {
  ideas: Idea[];
  executionPipelines: ExecutionPipeline[];
  repeatedTasks: RepeatedTask[];
  nonRepeatedTasks: NonRepeatedTask[];
  lastUpdated: string;
}

export const EXECUTION_STAGES: ExecutionStage[] = [
  { id: '1', name: 'Product', order: 1, color: 'bg-green-500' },
  { id: '2', name: 'UI/UX', order: 2, color: 'bg-green-600' },
  { id: '3', name: 'Code', order: 3, color: 'bg-green-700' },
  { id: '4', name: 'Deploy', order: 4, color: 'bg-emerald-500' },
  { id: '5', name: 'Market', order: 5, color: 'bg-emerald-600' },
  { id: '6', name: 'Sale', order: 6, color: 'bg-emerald-700' },
];
