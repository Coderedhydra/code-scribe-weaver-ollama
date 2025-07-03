import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onCodeGenerate: (code: string) => void;
}

interface OllamaModel {
  name: string;
  size: string;
}

export function AIChat({ onCodeGenerate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  // Check Ollama connection and fetch models
  const checkConnection = async () => {
    setConnectionStatus('connecting');
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (!response.ok) throw new Error('Failed to connect');
      
      const data = await response.json();
      const models = data.models?.map((model: any) => ({
        name: model.name,
        size: model.size || 'Unknown'
      })) || [];
      
      setAvailableModels(models);
      setConnectionStatus('connected');
      
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0].name);
      }
      
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: `Connected to Ollama! I'm using ${models[0]?.name || 'default model'}. What would you like to build?`,
          timestamp: new Date()
        }]);
      }
      
      toast({ description: 'Connected to Ollama successfully!' });
    } catch (error) {
      setConnectionStatus('error');
      toast({
        variant: 'destructive',
        description: 'Failed to connect to Ollama. Make sure it\'s running on ' + ollamaUrl
      });
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const sendToOllama = async (prompt: string): Promise<string> => {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  };

  const handleSend = async () => {
    if (!input.trim() || connectionStatus !== 'connected' || !selectedModel) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are a helpful coding assistant. When providing code examples, wrap them in markdown code blocks with the appropriate language specified. Be concise and practical.

User request: ${input}

Please provide a helpful response with code examples when relevant.`;

      const aiResponse = await sendToOllama(systemPrompt);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Check for code blocks and offer to add to editor
      const codeMatch = aiResponse.match(/```\w*\n([\s\S]*?)\n```/);
      if (codeMatch) {
        setTimeout(() => {
          toast({
            description: "Code ready to add to editor",
            action: (
              <Button 
                size="sm" 
                onClick={() => onCodeGenerate(codeMatch[1])}
              >
                Add to Editor
              </Button>
            ),
            duration: 10000
          });
        }, 500);
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        variant: 'destructive',
        description: 'Failed to get response from Ollama. Check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      disconnected: { text: 'Disconnected', icon: AlertCircle, className: 'bg-muted' },
      connecting: { text: 'Connecting...', icon: Loader2, className: 'bg-yellow-500' },
      connected: { text: 'Connected', icon: CheckCircle, className: 'bg-terminal-green' },
      error: { text: 'Error', icon: AlertCircle, className: 'bg-destructive' }
    };

    const status = statusConfig[connectionStatus];
    const Icon = status.icon;

    return (
      <Badge variant="secondary" className={`text-white text-xs ${status.className}`}>
        <Icon className={`w-3 h-3 mr-1 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
        {status.text}
      </Badge>
    );
  };

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-terminal-green" />
          <span className="font-medium text-sm">Ollama AI</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ollama Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ollama URL</label>
                  <Input
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={checkConnection} className="w-full">
                  Test Connection
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {connectionStatus === 'error' && (
        <Alert className="m-2 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cannot connect to Ollama at {ollamaUrl}. Make sure Ollama is running and accessible.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'connected' && !selectedModel && (
        <Alert className="m-2 border-yellow-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No models available. Please pull a model using: ollama pull llama2
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {message.role === 'user' ? (
                  <User className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3 text-terminal-green" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {message.role === 'user' ? 'You' : `AI (${selectedModel})`}
                </div>
                <div className="text-sm text-foreground whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-3 h-3 text-terminal-green animate-pulse" />
              </div>
              <div className="text-sm text-muted-foreground">AI is thinking...</div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={connectionStatus === 'connected' ? "Ask Ollama..." : "Connect to Ollama first"}
            disabled={isLoading || connectionStatus !== 'connected' || !selectedModel}
            className="flex-1 h-8 text-sm"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading || connectionStatus !== 'connected' || !selectedModel}
            size="sm"
            className="h-8"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </Button>
        </div>
        {connectionStatus === 'connected' && selectedModel && (
          <div className="text-xs text-muted-foreground mt-1">
            Using {selectedModel} • {availableModels.length} models available
          </div>
        )}
      </div>
    </Card>
  );
}