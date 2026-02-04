import { useRef } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Upload, Plus } from 'lucide-react';

interface SidebarProps {
  models: string[];
  currentModel: string;
  onModelChange: (model: string) => void;
  rubric: string[];
  onAddRubric: (item: string) => void;
  onRemoveRubric: (item: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export const Sidebar = ({
  models,
  currentModel,
  onModelChange,
  rubric,
  onAddRubric,
  onRemoveRubric,
  onAnalyze,
  isAnalyzing,
  onFileSelect,
  selectedFile,
}: SidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rubricInputRef = useRef<HTMLInputElement>(null);

  const handleRubricSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && rubricInputRef.current?.value) {
      onAddRubric(rubricInputRef.current.value);
      rubricInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="font-display text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          <div className="w-3 h-3 bg-accent" />
          Compass
        </div>
        <div className="mono-label mt-2">ver 2.5.0 // stable</div>
      </div>

      {/* Controls */}
      <div className="p-6 flex flex-col gap-8 flex-grow overflow-y-auto">
        {/* File Input */}
        <div className="flex flex-col gap-3">
          <div className="mono-label">Input Source</div>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="h-24 border border-dashed border-border-light hover:border-accent hover:bg-[rgba(255,51,0,0.05)] cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
            />
            <Upload size={16} className="text-text-muted group-hover:text-accent transition-colors" />
            <div className="mono-label group-hover:text-accent">
              {selectedFile ? selectedFile.name : "+ Import Media"}
            </div>
          </div>
        </div>

        {/* Model Select */}
        <div className="flex flex-col gap-3">
          <div className="mono-label">Model Config</div>
          <select 
            className="bg-black border border-border text-text-main p-3 font-mono text-xs outline-none w-full focus:border-accent transition-colors appearance-none"
            value={currentModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Rubric */}
        <div className="flex flex-col gap-3">
          <div className="mono-label">Rubric Dimensions</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {rubric.map(r => (
              <Badge key={r} label={r} onRemove={() => onRemoveRubric(r)} />
            ))}
          </div>
          <div className="relative">
            <Input 
              ref={rubricInputRef}
              placeholder="Add dimension..." 
              onKeyDown={handleRubricSubmit}
              className="pr-8"
            />
            <Plus size={14} className="absolute right-3 top-3 text-text-muted" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border bg-surface z-10">
        <Button 
          variant="primary" 
          fullWidth 
          onClick={onAnalyze} 
          disabled={isAnalyzing || !selectedFile}
        >
          {isAnalyzing ? "Processing..." : "Initialize Analysis"}
        </Button>
      </div>
    </div>
  );
};
