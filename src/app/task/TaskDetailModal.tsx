import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/lib/tasks";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper functions for badge variants
const getPriorityVariant = (priority: string) => {
  switch (priority?.toLowerCase()) {
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
  switch (status?.toLowerCase()) {
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

export default function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  if (!task) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
          <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
          <DialogDescription>{task.description}</DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-2">Dependencies</h3>
            <p className="text-sm text-muted-foreground">
              {task.dependencies === "None" ? "None" : task.dependencies}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Details</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {task.details.trim()}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Test Strategy</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {task.testStrategy.trim()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 