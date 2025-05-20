import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface QuestionFormSortingProps {
  initialItems?: string[];
  onSave: (items: string[]) => void;
}

export function QuestionFormSorting({ 
  initialItems = [""], 
  onSave 
}: QuestionFormSortingProps) {
  const [items, setItems] = useState<string[]>(initialItems);

  const addItem = () => {
    setItems([...items, ""]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const reordered = [...items];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    setItems(reordered);
  };

  const handleSave = () => {
    onSave(items);
  };

  return (
    <div className="space-y-4">
      <Label>Items to Sort (drag to set correct order)</Label>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sort-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((item, index) => (
                <Draggable key={index} draggableId={`item-${index}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center gap-2"
                    >
                      <div className="p-2 bg-gray-100 rounded">
                        {index + 1}
                      </div>
                      <Input
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                      />
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      <div className="flex justify-between">
        <Button type="button" onClick={addItem}>
          Add Item
        </Button>
        <Button type="button" onClick={handleSave}>
          Save Sorting Question
        </Button>
      </div>
    </div>
  );
} 