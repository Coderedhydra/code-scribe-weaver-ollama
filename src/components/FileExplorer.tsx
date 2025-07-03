import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  File, 
  Plus, 
  FolderOpen, 
  FileText, 
  Image, 
  Settings,
  Trash2,
  Edit,
  Download,
  Upload,
  MoreHorizontal,
  Search,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  size?: number;
  lastModified?: Date;
}

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
}

export function FileExplorer({ onFileSelect, selectedFile }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'index.html',
          type: 'file',
          content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
          size: 123,
          lastModified: new Date()
        },
        {
          id: '3',
          name: 'style.css',
          type: 'file',
          content: 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
          size: 89,
          lastModified: new Date()
        },
        {
          id: '4',
          name: 'script.js',
          type: 'file',
          content: 'console.log("Hello from JavaScript!");\n\n// Your code here',
          size: 56,
          lastModified: new Date()
        }
      ]
    }
  ]);
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1']));
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFileName = (name: string): string | null => {
    if (!name.trim()) return 'File name cannot be empty';
    if (name.includes('/') || name.includes('\\')) return 'Invalid characters in file name';
    if (name.length > 255) return 'File name too long';
    if (/^\./.test(name)) return 'File name cannot start with a dot';
    return null;
  };

  const findFileById = useCallback((id: string, nodes: FileNode[] = files): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFileById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }, [files]);

  const updateFileInTree = useCallback((targetId: string, updater: (file: FileNode) => FileNode, nodes: FileNode[] = files): FileNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) {
        return updater(node);
      }
      if (node.children) {
        return { ...node, children: updateFileInTree(targetId, updater, node.children) };
      }
      return node;
    });
  }, [files]);

  const deleteFileFromTree = useCallback((targetId: string, nodes: FileNode[] = files): FileNode[] => {
    return nodes.filter(node => {
      if (node.id === targetId) return false;
      if (node.children) {
        node.children = deleteFileFromTree(targetId, node.children);
      }
      return true;
    });
  }, [files]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getFileIcon = (fileName: string, type: string) => {
    if (type === 'folder') {
      return expandedFolders.has(fileName) ? FolderOpen : Folder;
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return FileText;
      case 'css':
        return Settings;
      case 'js':
      case 'ts':
        return FileText;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return Image;
      default:
        return File;
    }
  };

  const createNewFile = () => {
    const validation = validateFileName(newFileName);
    if (validation) {
      setError(validation);
      toast({ variant: 'destructive', description: validation });
      return;
    }
    
    // Check for duplicate names
    const isDuplicate = files[0]?.children?.some(child => child.name === newFileName);
    if (isDuplicate) {
      setError('File with this name already exists');
      toast({ variant: 'destructive', description: 'File with this name already exists' });
      return;
    }

    const newFile: FileNode = {
      id: Date.now().toString(),
      name: newFileName,
      type: 'file',
      content: '// New file\n',
      size: 13,
      lastModified: new Date()
    };

    setFiles(prev => {
      const updated = [...prev];
      if (updated[0] && updated[0].children) {
        updated[0].children.push(newFile);
      }
      return updated;
    });

    setNewFileName('');
    setShowNewFile(false);
    setError(null);
    onFileSelect(newFile);
    toast({ description: `Created ${newFileName}` });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    uploadedFiles.forEach(file => {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          variant: 'destructive',
          description: `${file.name} is too large (max 1MB)`
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile: FileNode = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: 'file',
          content,
          size: file.size,
          lastModified: new Date(file.lastModified)
        };

        setFiles(prev => {
          const updated = [...prev];
          if (updated[0] && updated[0].children) {
            updated[0].children.push(newFile);
          }
          return updated;
        });

        toast({ description: `Uploaded ${file.name}` });
      };
      reader.readAsText(file);
    });

    // Reset input
    event.target.value = '';
  };

  const startEdit = (file: FileNode) => {
    setEditingFile(file.id);
    setEditName(file.name);
  };

  const confirmEdit = () => {
    if (!editingFile) return;
    
    const validation = validateFileName(editName);
    if (validation) {
      toast({ variant: 'destructive', description: validation });
      return;
    }

    setFiles(prev => updateFileInTree(editingFile, file => ({ ...file, name: editName }), prev));
    setEditingFile(null);
    setEditName('');
    toast({ description: 'File renamed' });
  };

  const deleteFile = (fileId: string) => {
    const fileToDelete = findFileById(fileId);
    if (!fileToDelete) return;

    setFiles(prev => deleteFileFromTree(fileId, prev));
    
    if (selectedFile?.id === fileId) {
      // Select another file if the current one is deleted
      const remainingFiles = files[0]?.children?.filter(f => f.id !== fileId);
      if (remainingFiles && remainingFiles.length > 0) {
        onFileSelect(remainingFiles[0]);
      }
    }
    
    toast({ description: `Deleted ${fileToDelete.name}` });
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedFile(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedFile || draggedFile === targetId) return;

    // For now, just show a toast - full drag & drop would need more complex logic
    toast({ description: 'Drag & drop reordering coming soon!' });
    setDraggedFile(null);
  };

  const filteredFiles = useCallback((nodes: FileNode[]): FileNode[] => {
    if (!searchTerm) return nodes;
    
    return nodes.filter(node => {
      if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      if (node.children) {
        const filteredChildren = filteredFiles(node.children);
        return filteredChildren.length > 0;
      }
      return false;
    }).map(node => {
      if (node.children) {
        return { ...node, children: filteredFiles(node.children) };
      }
      return node;
    });
  }, [searchTerm]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    const nodesToRender = filteredFiles(nodes);
    
    return nodesToRender.map(node => (
      <div key={node.id} className="animate-fade-in">
        <div 
          className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-secondary rounded transition-all group ${
            selectedFile?.id === node.id ? 'bg-primary/20 text-primary' : 'text-foreground'
          } ${draggedFile === node.id ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            } else {
              onFileSelect(node);
            }
          }}
          draggable={node.type === 'file'}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.id)}
        >
          {(() => {
            const Icon = getFileIcon(node.name, node.type);
            return <Icon className="w-4 h-4 flex-shrink-0" />;
          })()}
          
          {editingFile === node.id ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') confirmEdit();
                if (e.key === 'Escape') setEditingFile(null);
              }}
              onBlur={confirmEdit}
              className="h-6 text-xs bg-background border-border flex-1"
              autoFocus
            />
          ) : (
            <>
              <span className="text-sm truncate flex-1">{node.name}</span>
              {node.type === 'file' && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-muted-foreground">{formatFileSize(node.size)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                      <DropdownMenuItem onClick={() => startEdit(node)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const blob = new Blob([node.content || ''], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = node.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteFile(node.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </>
          )}
        </div>
        {node.type === 'folder' && expandedFolders.has(node.id) && node.children && (
          <div>
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const fileCount = files[0]?.children?.length || 0;

  return (
    <Card className="flex flex-col h-full bg-card border-border animate-fade-in">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Explorer</span>
          <Badge variant="outline" className="text-xs">
            {fileCount} files
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewFile(true)}
            className="h-6 w-6 p-0 hover-scale"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 w-6 p-0 hover-scale"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-8 text-sm bg-background border-border"
          />
        </div>
      </div>

      {error && (
        <Alert className="m-2 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-1">
          {renderFileTree(files)}
          
          {showNewFile && (
            <div className="flex items-center gap-2 px-2 py-1 animate-slide-in-right" style={{ paddingLeft: '40px' }}>
              <File className="w-4 h-4 text-muted-foreground" />
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') createNewFile();
                  if (e.key === 'Escape') setShowNewFile(false);
                }}
                onBlur={() => setShowNewFile(false)}
                placeholder="filename.js"
                className="h-6 text-xs bg-background border-border flex-1"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".js,.ts,.html,.css,.json,.txt,.md"
        onChange={handleFileUpload}
        className="hidden"
      />
    </Card>
  );
}