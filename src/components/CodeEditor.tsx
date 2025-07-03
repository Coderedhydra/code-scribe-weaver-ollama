import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Scissors, 
  FileText, 
  Save, 
  Undo, 
  Redo, 
  Search,
  Replace,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  fileName?: string;
}

interface HistoryState {
  content: string;
  cursor: number;
}

export function CodeEditor({ value, onChange, language = 'javascript', fileName = 'main.js' }: CodeEditorProps) {
  const [selectedText, setSelectedText] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([{ content: value, cursor: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-save functionality
  useEffect(() => {
    if (!isModified) return;
    
    const autoSaveTimeout = setTimeout(() => {
      handleSave();
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [value, isModified]);

  // Track modifications
  useEffect(() => {
    const lastHistoryEntry = history[historyIndex];
    if (lastHistoryEntry && value !== lastHistoryEntry.content) {
      setIsModified(true);
    }
  }, [value, history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToHistory = useCallback((content: string, cursor: number) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ content, cursor });
      return newHistory.slice(-50); // Keep only last 50 entries
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const historyEntry = history[newIndex];
      setHistoryIndex(newIndex);
      onChange(historyEntry.content);
      setIsModified(false);
      toast({ description: 'Undone' });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const historyEntry = history[newIndex];
      setHistoryIndex(newIndex);
      onChange(historyEntry.content);
      setIsModified(false);
      toast({ description: 'Redone' });
    }
  };

  const handleTextSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selected = value.substring(start, end);
      setSelectedText(selected);
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = selectedText || value;
      await navigator.clipboard.writeText(textToCopy);
      toast({ 
        description: selectedText ? 'Selected text copied!' : 'All code copied!',
        duration: 2000
      });
    } catch (error) {
      setError('Failed to copy to clipboard');
      toast({ 
        variant: 'destructive', 
        description: 'Failed to copy. Please try again.' 
      });
    }
  };

  const handleCut = async () => {
    if (!selectedText || !textareaRef.current) return;
    
    try {
      await navigator.clipboard.writeText(selectedText);
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newValue = value.substring(0, start) + value.substring(end);
      onChange(newValue);
      addToHistory(newValue, start);
      setSelectedText('');
      setIsModified(true);
      toast({ description: 'Text cut to clipboard!' });
    } catch (error) {
      setError('Failed to cut text');
      toast({ 
        variant: 'destructive', 
        description: 'Failed to cut text. Please try again.' 
      });
    }
  };

  const handleSave = async () => {
    if (!isModified) return;
    
    setIsSaving(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsModified(false);
      setLastSaved(new Date());
      setError(null);
      toast({ 
        description: 'File saved successfully!',
        duration: 2000
      });
    } catch (error) {
      setError('Failed to save file');
      toast({ 
        variant: 'destructive', 
        description: 'Failed to save file. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ description: `Downloaded ${fileName}` });
    } catch (error) {
      setError('Failed to download file');
      toast({ 
        variant: 'destructive', 
        description: 'Failed to download file.' 
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
      setError('File too large. Maximum size is 1MB.');
      toast({ 
        variant: 'destructive', 
        description: 'File too large. Maximum size is 1MB.' 
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onChange(content);
      addToHistory(content, 0);
      setIsModified(true);
      toast({ description: `Loaded ${file.name}` });
    };
    reader.onerror = () => {
      setError('Failed to read file');
      toast({ 
        variant: 'destructive', 
        description: 'Failed to read file.' 
      });
    };
    reader.readAsText(file);
  };

  const handleSearch = () => {
    if (!searchTerm || !textareaRef.current) return;
    
    const index = value.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + searchTerm.length);
      toast({ description: `Found "${searchTerm}"` });
    } else {
      toast({ description: `"${searchTerm}" not found` });
    }
  };

  const handleReplace = () => {
    if (!searchTerm || !textareaRef.current) return;
    
    const newValue = value.replace(new RegExp(searchTerm, 'g'), replaceTerm);
    if (newValue !== value) {
      onChange(newValue);
      addToHistory(newValue, 0);
      setIsModified(true);
      toast({ description: `Replaced "${searchTerm}" with "${replaceTerm}"` });
    } else {
      toast({ description: `"${searchTerm}" not found` });
    }
  };

  const getFileIcon = () => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconColor = {
      'js': 'text-code-orange',
      'ts': 'text-code-blue',
      'html': 'text-destructive',
      'css': 'text-code-purple',
      'json': 'text-terminal-green'
    }[ext || ''] || 'text-primary';
    
    return <FileText className={`w-4 h-4 ${iconColor}`} />;
  };

  const lineNumbers = value.split('\n').map((_, index) => index + 1);
  const wordCount = value.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = value.length;

  return (
    <Card className="flex flex-col h-full bg-editor-bg border-border animate-fade-in">
      {error && (
        <Alert className="m-2 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary">
        <div className="flex items-center gap-2">
          {getFileIcon()}
          <span className="text-sm font-medium text-foreground">{fileName}</span>
          {isModified && (
            <Badge variant="secondary" className="text-xs animate-pulse-glow">
              Modified
            </Badge>
          )}
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSearch(!showSearch)}
            className="h-8 w-8 p-0 hover-scale"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="h-8 w-8 p-0 hover-scale"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="h-8 w-8 p-0 hover-scale"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy}
            className="h-8 w-8 p-0 hover-scale"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCut}
            disabled={!selectedText}
            className="h-8 w-8 p-0 hover-scale"
          >
            <Scissors className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 p-0 hover-scale"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className="h-8 w-8 p-0 hover-scale"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSave}
            disabled={!isModified || isSaving}
            className="h-8 w-8 p-0 hover-scale"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="p-3 border-b border-border bg-secondary animate-slide-in-right">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 h-8 text-sm"
            />
            <Input
              placeholder="Replace..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="flex-1 h-8 text-sm"
            />
            <Button size="sm" onClick={handleSearch} className="h-8">
              Find
            </Button>
            <Button size="sm" onClick={handleReplace} variant="secondary" className="h-8">
              <Replace className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col bg-secondary border-r border-border min-w-12">
          {lineNumbers.map((num) => (
            <div 
              key={num}
              className="px-2 py-0.5 text-xs text-editor-lineNumber text-right font-mono select-none hover:bg-muted transition-colors"
            >
              {num}
            </div>
          ))}
        </div>
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value !== value) {
              addToHistory(e.target.value, e.target.selectionStart);
            }
          }}
          onSelect={handleTextSelect}
          className="flex-1 bg-transparent text-foreground font-mono text-sm leading-5 p-3 resize-none outline-none selection:bg-editor-selection transition-all"
          placeholder="// Start coding here..."
          spellCheck={false}
        />
      </div>

      <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-secondary text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Lines: {lineNumbers.length}</span>
          <span>Words: {wordCount}</span>
          <span>Characters: {charCount}</span>
        </div>
        <div className="flex items-center gap-2">
          {isModified ? (
            <div className="flex items-center gap-1 text-terminal-green">
              <AlertCircle className="w-3 h-3" />
              <span>Unsaved changes</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".js,.ts,.html,.css,.json,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </Card>
  );
}