import { useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { AIChat } from '@/components/AIChat';
import { FileExplorer } from '@/components/FileExplorer';
import { PreviewPane } from '@/components/PreviewPane';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode>({
    id: '4',
    name: 'script.js',
    type: 'file',
    content: 'console.log("Hello from JavaScript!");\n\n// Your code here'
  });
  
  const [fileContents, setFileContents] = useState({
    html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
    css: 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
    js: 'console.log("Hello from JavaScript!");\n\n// Your code here'
  });

  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);
  };

  const handleCodeChange = (newCode: string) => {
    if (selectedFile) {
      setSelectedFile(prev => ({ ...prev, content: newCode }));
      
      // Update file contents for preview
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'html' || ext === 'htm') {
        setFileContents(prev => ({ ...prev, html: newCode }));
      } else if (ext === 'css') {
        setFileContents(prev => ({ ...prev, css: newCode }));
      } else if (ext === 'js' || ext === 'ts') {
        setFileContents(prev => ({ ...prev, js: newCode }));
      }
    }
  };

  const handleAICodeGenerate = (generatedCode: string) => {
    if (selectedFile) {
      const newContent = selectedFile.content + '\n\n' + generatedCode;
      handleCodeChange(newContent);
    }
  };

  const getLanguageFromFile = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      default:
        return 'javascript';
    }
  };

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <FileExplorer onFileSelect={handleFileSelect} selectedFile={selectedFile} />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main Content Area */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            {/* Code Editor */}
            <ResizablePanel defaultSize={70} minSize={30}>
              <CodeEditor
                value={selectedFile?.content || ''}
                onChange={handleCodeChange}
                language={getLanguageFromFile(selectedFile?.name || '')}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Preview Pane */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <PreviewPane
                htmlContent={fileContents.html}
                cssContent={fileContents.css}
                jsContent={fileContents.js}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* AI Chat */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <AIChat onCodeGenerate={handleAICodeGenerate} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
