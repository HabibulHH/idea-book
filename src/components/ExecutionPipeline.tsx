import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AppData } from '@/types';
import { EXECUTION_STAGES } from '@/types';
import { updatePipelineStage, updateIdea, saveExecutionPipeline, saveIdea } from '@/lib/storage';
import { ArrowRight, CheckCircle, Circle, FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface ExecutionPipelineProps {
  data: AppData;
  setData: (data: AppData) => void;
}

export default function ExecutionPipeline({ data, setData }: ExecutionPipelineProps) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const pipelines = data.executionPipelines.map(pipeline => {
    const idea = data.ideas.find(idea => idea.id === pipeline.ideaId);
    return { ...pipeline, idea };
  }).filter(pipeline => pipeline.idea);

  const handleStageUpdate = async (pipelineId: string, newStage: number) => {
    const updatedData = updatePipelineStage(data, pipelineId, newStage);
    setData(updatedData);
    
    // Save the specific pipeline to database
    const pipeline = updatedData.executionPipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      await saveExecutionPipeline(pipeline);
    }
  };

  const handleCompletePipeline = async (ideaId: string) => {
    const updatedData = updateIdea(data, ideaId, { status: 'completed' });
    setData(updatedData);
    
    // Save the specific idea to database
    const idea = updatedData.ideas.find(i => i.id === ideaId);
    if (idea) {
      await saveIdea(idea);
    }
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
    
    // Save the specific pipeline to database
    const pipeline = updatedData.executionPipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      await saveExecutionPipeline(pipeline);
    }
    
    setEditingNotes(null);
    setNotes('');
  };

  const toggleCardExpansion = (pipelineId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pipelineId)) {
        newSet.delete(pipelineId);
      } else {
        newSet.add(pipelineId);
      }
      return newSet;
    });
  };

  const getStageStatus = (stageOrder: number, currentStage: number) => {
    if (stageOrder < currentStage) return 'completed';
    if (stageOrder === currentStage) return 'current';
    return 'pending';
  };

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Sticky Header */}
      <div className="flex-shrink-0 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Execution Pipeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your ideas through the 6-stage execution process
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide min-h-0">
        {pipelines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No ideas in execution pipeline yet</p>
            <p className="text-sm">Move ideas from the parking lot to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pipelines.map((pipeline) => {
              const isExpanded = expandedCards.has(pipeline.id);
              return (
                <div key={pipeline.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  {/* Always visible header with title and pipeline stages */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
                    onClick={() => toggleCardExpansion(pipeline.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-gray-900">{pipeline.idea?.title}</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCardExpansion(pipeline.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Pipeline Stages - Always Visible */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">Progress</h4>
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
                                <span className="text-xs mt-1 text-center max-w-16 text-gray-600">{stage.name}</span>
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

                    {/* Stage Controls - Always Visible */}
                    <div className="flex gap-2">
                      {pipeline.currentStage > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageUpdate(pipeline.id, pipeline.currentStage - 1);
                          }}
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                        >
                          Previous Stage
                        </Button>
                      )}
                      {pipeline.currentStage < EXECUTION_STAGES.length && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageUpdate(pipeline.id, pipeline.currentStage + 1);
                          }}
                          className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                          Next Stage
                        </Button>
                      )}
                      {pipeline.currentStage === EXECUTION_STAGES.length && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompletePipeline(pipeline.ideaId);
                          }}
                        >
                          Complete Pipeline
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expandable content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      {/* Description */}
                      {pipeline.idea?.description && (
                        <div className="text-gray-600 mt-4 mb-4 whitespace-pre-wrap">
                          {pipeline.idea.description}
                        </div>
                      )}

                      {/* Basic Info */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Started {new Date(pipeline.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Stage {pipeline.currentStage} of {EXECUTION_STAGES.length}</span>
                        </div>
                      </div>

                      {/* Notes Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium flex items-center gap-1 text-gray-800">
                            <FileText className="h-4 w-4" />
                            Notes
                          </h4>
                          {editingNotes !== pipeline.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotesEdit(pipeline.id, pipeline.notes)}
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
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
                              className="w-full p-2 border border-gray-300 rounded-md bg-white focus:border-gray-500 focus:ring-2 focus:ring-gray-200 min-h-20"
                              placeholder="Add notes about this stage..."
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleNotesSave(pipeline.id)}
                                className="bg-gray-900 hover:bg-gray-800 text-white"
                              >
                                Save Notes
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setEditingNotes(null);
                                  setNotes('');
                                }}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-20">
                            {pipeline.notes ? (
                              <p className="text-sm whitespace-pre-wrap text-gray-700">{pipeline.notes}</p>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                No notes added yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}