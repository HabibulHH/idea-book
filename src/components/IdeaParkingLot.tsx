import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AppData } from '@/types';
import { addIdea, deleteIdea, addExecutionPipeline, saveData } from '@/lib/storage';
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
    await saveData(updatedData);
    setNewIdea({ title: '', description: '', priority: 'medium', tags: '' });
    setShowAddForm(false);
  };

  const handleMoveToPipeline = async (ideaId: string) => {
    const updatedData = addExecutionPipeline(data, ideaId);
    setData(updatedData);
    await saveData(updatedData);
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const updatedData = await deleteIdea(data, ideaId);
    setData(updatedData);
    await saveData(updatedData);
  };

  const parkingIdeas = data.ideas.filter(idea => idea.status === 'parking');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-50 shadow-md';
      case 'medium': return 'border-yellow-400 bg-yellow-50 shadow-md';
      case 'low': return 'border-green-400 bg-green-50 shadow-md';
      default: return 'border-gray-300 bg-white shadow-sm';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Idea Parking Lot
            </CardTitle>
            <CardDescription>
              Store and organize your ideas before moving them to execution
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Idea
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold mb-4">Add New Idea</h3>
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
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200"
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
              <div className="flex gap-2">
                <Button onClick={handleAddIdea} disabled={!newIdea.title.trim()}>
                  Add Idea
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
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
                className={`p-4 border rounded-lg ${getPriorityColor(idea.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{idea.title}</h3>
                    {idea.description && (
                      <div className="text-gray-700 mt-1 whitespace-pre-wrap">
                        {idea.description}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(idea.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="capitalize">{idea.priority} priority</span>
                      </div>
                      {idea.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {idea.tags.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleMoveToPipeline(idea.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start Pipeline
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteIdea(idea.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
