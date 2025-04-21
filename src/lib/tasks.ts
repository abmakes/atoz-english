import fs from 'fs';
import path from 'path';

export interface Task {
  id: number;
  title: string;
  status: string;
  dependencies: string;
  priority: string;
  description: string;
  details: string;
  testStrategy: string;
}

export function getTasks(): Task[] {
  const tasksDir = path.join(process.cwd(), 'tasks');
  const taskFiles = fs.readdirSync(tasksDir).filter(file => 
    file.startsWith('task_') && file.endsWith('.txt')
  );
  
  return taskFiles.map(filename => {
    const filePath = path.join(tasksDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const task: Partial<Task> = {};
    
    // Parse the task file content
    const lines = content.split('\n');
    let currentField: keyof Task | null = null;
    
    for (const line of lines) {
      if (line.startsWith('# Task ID:')) {
        task.id = parseInt(line.replace('# Task ID:', '').trim());
      } else if (line.startsWith('# Title:')) {
        task.title = line.replace('# Title:', '').trim();
      } else if (line.startsWith('# Status:')) {
        task.status = line.replace('# Status:', '').trim();
      } else if (line.startsWith('# Dependencies:')) {
        task.dependencies = line.replace('# Dependencies:', '').trim();
      } else if (line.startsWith('# Priority:')) {
        task.priority = line.replace('# Priority:', '').trim();
      } else if (line.startsWith('# Description:')) {
        task.description = line.replace('# Description:', '').trim();
      } else if (line.startsWith('# Details:')) {
        currentField = 'details';
        task.details = '';
      } else if (line.startsWith('# Test Strategy:')) {
        currentField = 'testStrategy';
        task.testStrategy = '';
      } else if (currentField) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          task[currentField] = (task[currentField] || '') + (task[currentField] ? '\n' : '') + line;
        }
      }
    }
    
    return task as Task;
  })
  .sort((a, b) => a.id - b.id); // Sort by ID
} 