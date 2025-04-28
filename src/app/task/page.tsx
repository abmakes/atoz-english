"use client";

import { useState, useEffect } from "react";
import { Task } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TaskCard from "./TaskCard";
import TaskDetailModal from "./TaskDetailModal";
import { getTasksAction } from "./actions";

export default function TasksPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const statusFilter = searchParams.status?.toLowerCase();
  
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const data = await getTasksAction();
        setTasks(data);
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTasks();
  }, []);
  
  // Filter tasks by status if a filter is applied
  const filteredTasks = statusFilter
    ? tasks.filter(task => task.status.toLowerCase() === statusFilter)
    : tasks;

  // State for modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const allStatuses = [...new Set(tasks.map(task => task.status.toLowerCase()))];

  return (
    <>
      {/* Simple navigation */}
      <div className="border-b border-border bg-background py-3 px-6 shadow-sm mb-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-primary hover:text-primary/80 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    
      <main className="container mx-auto py-6 px-4 text-foreground">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Project Tasks</h1>
          
          <div className="flex gap-2">
            <Link href="/task">
              <Button 
                variant={!statusFilter ? "default" : "outline"} 
                className="text-sm"
              >
                All
              </Button>
            </Link>
            {allStatuses.map(status => (
              <Link key={status} href={`/task?status=${status}`}>
                <Button 
                  variant={statusFilter === status ? "default" : "outline"} 
                  className="text-sm capitalize"
                >
                  {status}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={handleTaskClick}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  No tasks matching the selected filter.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Task Detail Modal */}
        <TaskDetailModal 
          task={selectedTask}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </main>
    </>
  );
} 