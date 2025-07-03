import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Scissors, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export function CodeEditor({ value, onChange, language = 'javascript' }: CodeEditorProps) {
  const [selectedText, setSelectedText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleTextSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = value.substring(start, end);
      setSelectedText(selected);
    }
  };

  const handleCopy = async () => {
    if (selectedText) {
      await navigator.clipboard.writeText(selectedText);
      toast({ description: 'Copied to clipboard' });
    } else {
      await navigator.clipboard.writeText(value);
      toast({ description: 'All code copied' });
    }
  };

  const handleCut = async () => {
    if (selectedText && textareaRef.current) {
      await navigator.clipboard.writeText(selectedText);
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newValue = value.substring(0, start) + value.substring(end);
      onChange(newValue);
      setSelectedText('');
      toast({ description: 'Cut to clipboard' });
    }
  };

  const lineNumbers = value.split('\n').map((_, index) => index + 1);

  return (
    <Card className="flex flex-col h-full bg-editor-bg border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-terminal-green" />
          <span className="text-sm text-foreground">main.{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCut}
            disabled={!selectedText}
            className="h-7 px-2 text-xs"
          >
            <Scissors className="w-3 h-3 mr-1" />
            Cut
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col bg-muted/20 border-r border-border min-w-12">
          {lineNumbers.map((num) => (
            <div 
              key={num}
              className="px-3 py-0.5 text-xs text-editor-lineNumber text-right font-mono select-none"
            >
              {num}
            </div>
          ))}
        </div>
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleTextSelect}
          className="flex-1 bg-transparent text-foreground font-mono text-sm leading-5 p-3 resize-none outline-none selection:bg-editor-selection"
          placeholder="// Start coding here..."
          spellCheck={false}
        />
      </div>
    </Card>
  );
}