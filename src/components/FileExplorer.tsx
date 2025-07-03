import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, File, Plus, FolderOpen, FileText, Image, Settings } from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
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
          content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>'
        },
        {
          id: '3',
          name: 'style.css',
          type: 'file',
          content: 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}'
        },
        {
          id: '4',
          name: 'script.js',
          type: 'file',
          content: 'console.log("Hello from JavaScript!");\n\n// Your code here'
        }
      ]
    }
  ]);
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1']));
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);

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
    if (!newFileName.trim()) return;
    
    const newFile: FileNode = {
      id: Date.now().toString(),
      name: newFileName,
      type: 'file',
      content: '// New file\n'
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
    onFileSelect(newFile);
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div 
          className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-secondary rounded transition-colors ${
            selectedFile?.id === node.id ? 'bg-primary/20 text-primary' : 'text-foreground'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            } else {
              onFileSelect(node);
            }
          }}
        >
          {(() => {
            const Icon = getFileIcon(node.name, node.type);
            return <Icon className="w-4 h-4 flex-shrink-0" />;
          })()}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {node.type === 'folder' && expandedFolders.has(node.id) && node.children && (
          <div>
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary">
        <span className="font-medium text-foreground">Explorer</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNewFile(true)}
          className="h-6 w-6 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-1">
          {renderFileTree(files)}
          
          {showNewFile && (
            <div className="flex items-center gap-2 px-2 py-1" style={{ paddingLeft: '40px' }}>
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
                className="h-6 text-xs bg-background border-border"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}