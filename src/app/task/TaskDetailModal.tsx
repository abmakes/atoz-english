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

// Helper functions for badge variants - using theme colors (match TaskCard)
const getPriorityVariant = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-secondary text-secondary-foreground";
    case "low":
      return "bg-primary text-primary-foreground";
    default:
      return "border border-border text-foreground";
  }
};

const getStatusVariant = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "done":
      return "bg-muted text-muted-foreground";
    case "pending":
      return "bg-secondary text-secondary-foreground";
    case "in-progress":
      return "bg-primary text-primary-foreground";
    default:
      return "border border-border text-foreground";
  }
};

export default function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  if (!task) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Apply theme background and text color to modal content */}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background text-foreground border-border">
        <DialogHeader>
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
          <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
          {/* Apply theme muted text color */}
          <DialogDescription className="text-muted-foreground">{task.description}</DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-2">Dependencies</h3>
            {/* Apply theme muted text color */}
            <p className="text-sm text-muted-foreground">
              {task.dependencies === "None" ? "None" : task.dependencies}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Details</h3>
            {/* Apply theme muted text color */}
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {task.details.trim()}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Test Strategy</h3>
            {/* Apply theme muted text color */}
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {task.testStrategy.trim()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 