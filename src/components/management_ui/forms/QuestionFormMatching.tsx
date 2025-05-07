import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/input";

interface MatchingPair {
  left: string;
  right: string;
}

interface QuestionFormMatchingProps {
  initialPairs?: MatchingPair[];
  onSave: (pairs: MatchingPair[]) => void;
}

export function QuestionFormMatching({ 
  initialPairs = [{ left: "", right: "" }], 
  onSave 
}: QuestionFormMatchingProps) {
  const [pairs, setPairs] = useState<MatchingPair[]>(initialPairs);

  const addPair = () => {
    setPairs([...pairs, { left: "", right: "" }]);
  };

  const removePair = (index: number) => {
    const newPairs = [...pairs];
    newPairs.splice(index, 1);
    setPairs(newPairs);
  };

  const updatePair = (index: number, field: 'left' | 'right', value: string) => {
    const newPairs = [...pairs];
    newPairs[index][field] = value;
    setPairs(newPairs);
  };

  const handleSave = () => {
    onSave(pairs);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 font-bold">
        <div>Item to Match</div>
        <div>Matching Item</div>
      </div>
      
      {pairs.map((pair, index) => (
        <div key={index} className="grid grid-cols-2 gap-4 items-center">
          <Input
            value={pair.left}
            onChange={(e) => updatePair(index, 'left', e.target.value)}
            placeholder="Enter left item"
          />
          <div className="flex items-center gap-2">
            <Input
              value={pair.right}
              onChange={(e) => updatePair(index, 'right', e.target.value)}
              placeholder="Enter right item"
            />
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => removePair(index)}
              disabled={pairs.length <= 1}
              className="flex-shrink-0"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      
      <div className="flex justify-between">
        <Button type="button" onClick={addPair}>
          Add Pair
        </Button>
        <Button type="button" onClick={handleSave}>
          Save Matching Question
        </Button>
      </div>
    </div>
  );
} 