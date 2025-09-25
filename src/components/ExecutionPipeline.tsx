import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AppData } from '@/types';
import { EXECUTION_STAGES } from '@/types';
import { updatePipelineStage, updateIdea, saveData } from '@/lib/storage';
import { ArrowRight, CheckCircle, Circle, FileText, Calendar } from 'lucide-react';

interface ExecutionPipelineProps {
  data: AppData;
  setData: (data: AppData) => void;
}

export default function ExecutionPipeline({ data, setData }: ExecutionPipelineProps) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const pipelines = data.executionPipelines.map(pipeline => {
    const idea = data.ideas.find(idea => idea.id === pipeline.ideaId);
    return { ...pipeline, idea };
  }).filter(pipeline => pipeline.idea);

  const handleStageUpdate = async (pipelineId: string, newStage: number) => {
    const updatedData = updatePipelineStage(data, pipelineId, newStage);
    setData(updatedData);
    await saveData(updatedData);
  };

  const handleCompletePipeline = async (ideaId: string) => {
    const updatedData = updateIdea(data, ideaId, { status: 'completed' });
    setData(updatedData);
    await saveData(updatedData);
  };

  const handleNotesEdit = (pipelineId: string, currentNotes: string) => {
    setEditingNotes(pipelineId);
    setNotes(currentNotes);
  };

  const handleNotesSave = async (pipelineId: string) => {
    const updatedData = {
      ...data,
      executionPipelines: data.executionPipelines.map(pipeline =>
        pipeline.id === pipelineId 
          ? { ...pipeline, notes, updatedAt: new Date().toISOString() }
          : pipeline
      ),
    };
    setData(updatedData);
    await saveData(updatedData);
    setEditingNotes(null);
    setNotes('');
  };

  const getStageStatus = (stageOrder: number, currentStage: number) => {
    if (stageOrder < currentStage) return 'completed';
    if (stageOrder === currentStage) return 'current';
    return 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Execution Pipeline
        </CardTitle>
        <CardDescription>
          Track your ideas through the 6-stage execution process
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pipelines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No ideas in execution pipeline yet</p>
            <p className="text-sm">Move ideas from the parking lot to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pipelines.map((pipeline) => (
              <div key={pipeline.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{pipeline.idea?.title}</h3>
                  {pipeline.idea?.description && (
                    <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                      {pipeline.idea.description}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Started {new Date(pipeline.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Stage {pipeline.currentStage} of {EXECUTION_STAGES.length}</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Stages */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Progress</h4>
                    <div className="text-sm text-gray-500">
                      {Math.round((pipeline.currentStage / EXECUTION_STAGES.length) * 100)}% Complete
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {EXECUTION_STAGES.map((stage, index) => {
                      const status = getStageStatus(stage.order, pipeline.currentStage);
                      return (
                        <div key={stage.id} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                status === 'completed' 
                                  ? 'bg-green-500' 
                                  : status === 'current'
                                  ? stage.color
                                  : 'bg-gray-300'
                              }`}
                            >
                              {status === 'completed' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </div>
                            <span className="text-xs mt-1 text-center max-w-16">{stage.name}</span>
                          </div>
                          {index < EXECUTION_STAGES.length - 1 && (
                            <div className={`w-8 h-0.5 mx-1 ${
                              status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage Controls */}
                <div className="flex gap-2 mb-4">
                  {pipeline.currentStage > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStageUpdate(pipeline.id, pipeline.currentStage - 1)}
                    >
                      Previous Stage
                    </Button>
                  )}
                  {pipeline.currentStage < EXECUTION_STAGES.length && (
                    <Button
                      size="sm"
                      onClick={() => handleStageUpdate(pipeline.id, pipeline.currentStage + 1)}
                    >
                      Next Stage
                    </Button>
                  )}
                  {pipeline.currentStage === EXECUTION_STAGES.length && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleCompletePipeline(pipeline.ideaId)}
                    >
                      Complete Pipeline
                    </Button>
                  )}
                </div>

                {/* Notes Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Notes
                    </h4>
                    {editingNotes !== pipeline.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNotesEdit(pipeline.id, pipeline.notes)}
                      >
                        {pipeline.notes ? 'Edit Notes' : 'Add Notes'}
                      </Button>
                    )}
                  </div>
                  
                  {editingNotes === pipeline.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 min-h-20"
                        placeholder="Add notes about this stage..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleNotesSave(pipeline.id)}>
                          Save Notes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setEditingNotes(null);
                            setNotes('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-20">
                      {pipeline.notes ? (
                        <p className="text-sm whitespace-pre-wrap">{pipeline.notes}</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No notes added yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
