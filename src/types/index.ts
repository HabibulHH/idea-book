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

export interface NewsfeedPost {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  url?: string;
  url_metadata?: {
    title?: string;
    description?: string;
    image?: string;
    site_name?: string;
  };
  post_type: 'link' | 'note' | 'post';
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  tags?: NewsfeedTag[];
  comments?: NewsfeedComment[];
}

export interface NewsfeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NewsfeedTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface AppData {
  ideas: Idea[];
  executionPipelines: ExecutionPipeline[];
  repeatedTasks: RepeatedTask[];
  nonRepeatedTasks: NonRepeatedTask[];
  newsfeedPosts: NewsfeedPost[];
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
