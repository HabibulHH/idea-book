import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AppData } from '@/types';
import { addIdea, deleteIdea, addExecutionPipeline, saveIdea, saveExecutionPipeline } from '@/lib/storage';
import { Plus, Trash2, Play, Tag, Calendar } from 'lucide-react';

interface IdeaParkingLotProps {
  data: AppData;
  setData: (data: AppData) => void;
}

export default function IdeaParkingLot({ data, setData }: IdeaParkingLotProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    tags: '',
  });

  const handleAddIdea = async () => {
    if (!newIdea.title.trim()) return;

    const tags = newIdea.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const updatedData = await addIdea(data, {
      ...newIdea,
      tags,
      status: 'parking',
    });

    setData(updatedData);
    
    // Save the new idea to database
    const savedIdea = updatedData.ideas.find(i => i.id === updatedData.ideas[updatedData.ideas.length - 1].id);
    if (savedIdea) {
      await saveIdea(savedIdea);
    }
    
    setNewIdea({ title: '', description: '', priority: 'medium', tags: '' });
    setShowAddForm(false);
  };

  const handleMoveToPipeline = async (ideaId: string) => {
    const updatedData = addExecutionPipeline(data, ideaId);
    setData(updatedData);
    
    // Save the idea and pipeline to database
    const idea = updatedData.ideas.find(i => i.id === ideaId);
    const pipeline = updatedData.executionPipelines.find(p => p.ideaId === ideaId);
    
    if (idea) {
      await saveIdea(idea);
    }
    if (pipeline) {
      await saveExecutionPipeline(pipeline);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const updatedData = await deleteIdea(data, ideaId);
    setData(updatedData);
    // deleteIdea already handles database deletion
  };


  const parkingIdeas = data.ideas.filter(idea => idea.status === 'parking');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': 
        return 'border-gray-800 bg-white shadow-sm hover:shadow-md transition-all duration-200';
      case 'medium': 
        return 'border-gray-400 bg-white shadow-sm hover:shadow-md transition-all duration-200';
      case 'low': 
        return 'border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200';
      default: 
        return 'border-gray-300 bg-white shadow-sm hover:shadow-md transition-all duration-200';
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Sticky Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Idea Parking Lot
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Store and organize your ideas before moving them to execution
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Idea
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide min-h-0">
        {showAddForm && (
          <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Add New Idea</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                  placeholder="Enter idea title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newIdea.description}
                  onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                  placeholder="Enter detailed description of your idea..."
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={newIdea.priority}
                  onChange={(e) => setNewIdea({ ...newIdea, priority: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newIdea.tags}
                  onChange={(e) => setNewIdea({ ...newIdea, tags: e.target.value })}
                  placeholder="e.g., web app, mobile, AI"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleAddIdea} 
                  disabled={!newIdea.title.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Idea
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 font-medium px-4 py-2 transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

          <div className="space-y-4">
            {parkingIdeas.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No ideas in parking lot yet</p>
                <p className="text-sm">Add your first idea to get started!</p>
              </div>
            ) : (
              parkingIdeas.map((idea) => (
              <div
                key={idea.id}
                className={`border rounded-lg ${getPriorityColor(idea.priority)} group`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {idea.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleMoveToPipeline(idea.id)}
                        className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 transition-all duration-200"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Pipeline
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300 hover:border-gray-400 font-medium px-3 py-2 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {idea.description && (
                    <div className="text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">
                      {idea.description}
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                        idea.priority === 'high' ? 'bg-gray-900 text-white' :
                        idea.priority === 'medium' ? 'bg-gray-600 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {idea.priority} priority
                      </div>
                    </div>
                    {idea.tags.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Tag className="h-4 w-4" />
                        <span className="font-medium">{idea.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
