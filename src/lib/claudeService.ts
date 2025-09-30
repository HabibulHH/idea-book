import type { AppData } from '@/types'

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeRequest {
  message: string
  context: {
    tasks: AppData
    currentDate: string
  }
}

export async function callClaudeAPI(request: ClaudeRequest): Promise<string> {
  try {
    // For now, we'll simulate the API call since we need to set up the actual Claude API
    // In production, this would call your backend API that interfaces with Claude
    
    const { message, context } = request
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate a contextual response based on the message
    if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('summarize')) {
      return generateSummaryResponse(context)
    }
    
    if (message.toLowerCase().includes('task') || message.toLowerCase().includes('tasks')) {
      return generateTaskResponse(context, message)
    }
    
    if (message.toLowerCase().includes('idea') || message.toLowerCase().includes('ideas')) {
      return generateIdeaResponse(context, message)
    }
    
    // Default response
    return `I understand you're asking about: "${message}". 

Based on your current data:
- You have ${context.tasks.repeatedTasks.filter(t => t.isActive).length} active daily tasks
- You have ${context.tasks.nonRepeatedTasks.filter(t => t.status !== 'completed').length} pending office tasks
- You have ${(context.tasks.regularTasks || []).filter(t => t.status !== 'completed').length} pending regular tasks
- You have ${context.tasks.ideas.length} ideas in your parking lot
- You have ${context.tasks.people.length} people in your network

How can I help you better organize or prioritize these items?`
  } catch (error) {
    console.error('Error calling Claude API:', error)
    throw new Error('Failed to get response from Claude API')
  }
}

function generateSummaryResponse(context: { tasks: AppData; currentDate: string }): string {
  const { tasks, currentDate } = context
  
  const activeDailyTasks = tasks.repeatedTasks.filter(t => t.isActive)
  const pendingOfficeTasks = tasks.nonRepeatedTasks.filter(t => t.status !== 'completed')
  const pendingRegularTasks = (tasks.regularTasks || []).filter(t => t.status !== 'completed')
  const overdueTasks = tasks.nonRepeatedTasks.filter(t => 
    t.status !== 'completed' && 
    t.deadline && 
    new Date(t.deadline) < new Date(currentDate)
  )
  
  let summary = `# Daily Summary for ${new Date(currentDate).toLocaleDateString()}\n\n`
  
  // Task Overview
  summary += `## Task Overview\n`
  summary += `- **Daily Tasks**: ${activeDailyTasks.length} active\n`
  summary += `- **Office Tasks**: ${pendingOfficeTasks.length} pending\n`
  summary += `- **Regular Tasks**: ${pendingRegularTasks.length} pending\n`
  summary += `- **Overdue Tasks**: ${overdueTasks.length} items\n\n`
  
  // Priority Analysis
  summary += `## Priority Analysis\n`
  if (overdueTasks.length > 0) {
    summary += `🚨 **URGENT**: You have ${overdueTasks.length} overdue tasks that need immediate attention:\n`
    overdueTasks.slice(0, 3).forEach(task => {
      summary += `- ${task.title} (due ${task.deadline})\n`
    })
    summary += `\n`
  }
  
  // High Priority Tasks
  const highPriorityTasks = [...pendingOfficeTasks, ...pendingRegularTasks]
    .filter(t => t.priority === 'urgent' || t.priority === 'high')
    .slice(0, 5)
  
  if (highPriorityTasks.length > 0) {
    summary += `⭐ **High Priority Tasks**:\n`
    highPriorityTasks.forEach(task => {
      summary += `- ${task.title} (${task.priority} priority)\n`
    })
    summary += `\n`
  }
  
  // Ideas and Network
  summary += `## Other Activities\n`
  summary += `- **Ideas**: ${tasks.ideas.length} ideas in parking lot\n`
  summary += `- **Network**: ${tasks.people.length} contacts\n\n`
  
  // Recommendations
  summary += `## Recommendations\n`
  if (overdueTasks.length > 0) {
    summary += `1. **Immediate Action**: Focus on completing overdue tasks first\n`
  }
  if (highPriorityTasks.length > 0) {
    summary += `2. **Focus Areas**: Tackle high-priority tasks during your peak hours\n`
  }
  if (activeDailyTasks.length > 0) {
    summary += `3. **Daily Habits**: Complete your ${activeDailyTasks.length} daily tasks to maintain momentum\n`
  }
  summary += `4. **Review**: Consider moving some ideas from parking lot to execution pipeline\n`
  
  return summary
}

function generateTaskResponse(context: { tasks: AppData; currentDate: string }, message: string): string {
  const { tasks } = context
  
  if (message.toLowerCase().includes('completed') || message.toLowerCase().includes('done')) {
    const completedToday = tasks.nonRepeatedTasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt && 
      t.completedAt.startsWith(context.currentDate)
    )
    
    return `Great work! You've completed ${completedToday.length} tasks today. Keep up the momentum! 🎉`
  }
  
  if (message.toLowerCase().includes('overdue')) {
    const overdueTasks = tasks.nonRepeatedTasks.filter(t => 
      t.status !== 'completed' && 
      t.deadline && 
      new Date(t.deadline) < new Date(context.currentDate)
    )
    
    if (overdueTasks.length === 0) {
      return "Excellent! You have no overdue tasks. You're staying on top of your commitments! ✅"
    }
    
    let response = `You have ${overdueTasks.length} overdue tasks:\n\n`
    overdueTasks.forEach((task, index) => {
      response += `${index + 1}. ${task.title} (due ${task.deadline})\n`
    })
    response += `\nI recommend prioritizing these to get back on track.`
    
    return response
  }
  
  return `I can help you with your tasks! You currently have:
- ${tasks.repeatedTasks.filter(t => t.isActive).length} active daily tasks
- ${tasks.nonRepeatedTasks.filter(t => t.status !== 'completed').length} pending office tasks
- ${(tasks.regularTasks || []).filter(t => t.status !== 'completed').length} pending regular tasks

What specific aspect of your tasks would you like to discuss?`
}

function generateIdeaResponse(context: { tasks: AppData; currentDate: string }, message: string): string {
  const { tasks } = context
  
  if (message.toLowerCase().includes('parking') || message.toLowerCase().includes('parked')) {
    const parkedIdeas = tasks.ideas.filter(i => i.status === 'parking')
    return `You have ${parkedIdeas.length} ideas in your parking lot. Consider reviewing them and moving promising ones to your execution pipeline!`
  }
  
  if (message.toLowerCase().includes('pipeline')) {
    const pipelineIdeas = tasks.ideas.filter(i => i.status === 'in-pipeline')
    return `You have ${pipelineIdeas.length} ideas currently in your execution pipeline. How are they progressing?`
  }
  
  return `You have ${tasks.ideas.length} total ideas. Would you like me to help you prioritize them or suggest which ones to move to execution?`
}
