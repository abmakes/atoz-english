import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Task } from "@/lib/tasks";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

// Helper functions for badge variants
const getPriorityVariant = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "default";
    default:
      return "outline";
  }
};

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "done":
      return "default";
    case "pending":
      return "secondary";
    case "in-progress":
      return "destructive";
    default:
      return "outline";
  }
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card 
      className="flex flex-col h-full cursor-pointer hover:shadow-md transition-shadow" 
      onClick={() => onClick(task)}
    >
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="text-sm">
            Task {task.id}
          </Badge>
          <div className="flex gap-2">
            <Badge variant={getPriorityVariant(task.priority)}>
              {task.priority}
            </Badge>
            <Badge variant={getStatusVariant(task.status)}>
              {task.status}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg">{task.title}</CardTitle>
        <CardDescription className="line-clamp-2">{task.description}</CardDescription>
      </CardHeader>
    </Card>
  );
} 