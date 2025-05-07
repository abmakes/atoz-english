import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Task } from "@/lib/tasks";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

// Helper functions for badge variants - using theme colors
const getPriorityVariant = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case "high":
      // Assuming --destructive maps to black/dark text suitable for a light bg
      return "bg-red-500 text-black"; // destructive might need adjustment
    case "medium":
      // Assuming --secondary maps to a darker color
      return "bg-yellow-500 text-black"; 
    case "low":
      // Use default button style (likely primary bg/text)
      return "bg-blue-500 text-black";
    default:
      // Outline with border color
      return "border border-border text-foreground"; 
  }
};

const getStatusVariant = (status: string): string => {
  switch (status.toLowerCase()) {
    case "done":
      // Use a muted/neutral look for done
      return "bg-green-500 text-black"; 
    case "pending":
      // Use secondary for pending
      return "bg-yellow-500 text-black"; 
    case "in-progress":
      // Use primary for active/in-progress
      return "bg-blue-500 text-black";
    default:
      return "border border-border text-foreground"; 
  }
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card 
      // Apply theme card background and text color
      className="flex flex-col h-full cursor-pointer hover:shadow-md transition-shadow bg-white border-border"
      onClick={() => onClick(task)}
    >
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          {/* Use border color for outline badge */}
          <Badge variant="outline" className="text-sm border-border text-foreground">
            Task {task.id}
          </Badge>
          <div className="flex gap-2">
            {/* Apply the dynamic class string directly */}
            <Badge className={getPriorityVariant(task.priority)}>
              {task.priority}
            </Badge>
            <Badge className={getStatusVariant(task.status)}>
              {task.status}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg">{task.title}</CardTitle>
        {/* Use muted text color for description */}
        <CardDescription className="line-clamp-2 text-muted-foreground">{task.description}</CardDescription>
      </CardHeader>
    </Card>
  );
} 