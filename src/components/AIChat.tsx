import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Bot, 
  User, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  RefreshCw,
  Settings,
  Trash2,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  tokens?: number;
}

interface AIChatProps {
  onCodeGenerate: (code: string) => void;
}

export function AIChat({ onCodeGenerate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI coding assistant powered by Ollama. I can help you create websites, apps, and code snippets. What would you like to build today?',
      timestamp: new Date(),
      status: 'sent'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [isTyping, setIsTyping] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Simulate connection check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simulate connection test
        await new Promise(resolve => setTimeout(resolve, 1000));
        setConnectionStatus('connected');
      } catch (error) {
        setConnectionStatus('error');
      }
    };
    
    checkConnection();
  }, []);

  const validateInput = (text: string): string | null => {
    if (!text.trim()) return 'Please enter a message';
    if (text.length > 4000) return 'Message too long (max 4000 characters)';
    if (text.length < 3) return 'Message too short (min 3 characters)';
    return null;
  };

  const handleSend = async () => {
    const validation = validateInput(input);
    if (validation) {
      toast({
        variant: 'destructive',
        description: validation
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);
    setProgress(0);

    try {
      // Update user message status
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'sent' }
          : msg
      ));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 20;
          return next > 90 ? 90 : next;
        });
      }, 200);

      // Enhanced AI response generation
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      
      clearInterval(progressInterval);
      setProgress(100);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateEnhancedResponse(input),
        timestamp: new Date(),
        status: 'sent',
        tokens: Math.floor(Math.random() * 500) + 100
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Extract and offer code
      const codeMatch = aiResponse.content.match(/```(\w+)?\n([\s\S]*?)\n```/);
      if (codeMatch) {
        setTimeout(() => {
          toast({
            description: "Code generated! Click 'Add to Editor' to insert it.",
            action: (
              <Button 
                size="sm" 
                onClick={() => onCodeGenerate(codeMatch[2])}
                className="bg-primary text-primary-foreground hover-scale"
              >
                Add to Editor
              </Button>
            ),
            duration: 10000
          });
        }, 500);
      }

      setRetryCount(0);
      setConnectionStatus('connected');
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your Ollama connection and try again.',
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('error');
      setRetryCount(prev => prev + 1);
      
      toast({
        variant: 'destructive',
        description: 'Failed to get AI response. Please check your connection.',
        action: retryCount < 3 ? (
          <Button size="sm" onClick={() => handleSend()}>
            Retry
          </Button>
        ) : undefined
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setProgress(0);
    }
  };

  const generateEnhancedResponse = (userInput: string): string => {
    const lowercaseInput = userInput.toLowerCase();
    
    if (lowercaseInput.includes('react') || lowercaseInput.includes('component')) {
      return `I'll help you create a React component! Here's a modern example:\n\n\`\`\`jsx\nimport React, { useState } from 'react';\nimport './Component.css';\n\nfunction MyComponent() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="my-component">\n      <h2>Hello from React!</h2>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n\nexport default MyComponent;\n\`\`\`\n\nThis component includes state management and modern React patterns. Would you like me to add styling or additional features?`;
    }
    
    if (lowercaseInput.includes('api') || lowercaseInput.includes('fetch')) {
      return `Here's a robust API integration example:\n\n\`\`\`javascript\nasync function fetchData(url, options = {}) {\n  try {\n    const response = await fetch(url, {\n      method: 'GET',\n      headers: {\n        'Content-Type': 'application/json',\n        ...options.headers\n      },\n      ...options\n    });\n\n    if (!response.ok) {\n      throw new Error(\`HTTP error! status: \${response.status}\`);\n    }\n\n    const data = await response.json();\n    return { success: true, data };\n  } catch (error) {\n    console.error('Fetch error:', error);\n    return { success: false, error: error.message };\n  }\n}\n\n// Usage\nconst result = await fetchData('/api/users');\nif (result.success) {\n  console.log(result.data);\n} else {\n  console.error(result.error);\n}\n\`\`\`\n\nThis includes proper error handling and response validation!`;
    }
    
    return `I understand you want to ${lowercaseInput}. Here's a code example to get you started:\n\n\`\`\`javascript\n// ${userInput} implementation\nfunction ${userInput.replace(/\s+/g, '')}Solution() {\n  // TODO: Implement your ${userInput} logic here\n  console.log('Starting ${userInput} implementation...');\n  \n  const result = {\n    status: 'success',\n    message: 'Implementation ready',\n    data: []\n  };\n  \n  return result;\n}\n\n// Execute the function\nconst output = ${userInput.replace(/\s+/g, '')}Solution();\nconsole.log(output);\n\`\`\`\n\nThis provides a solid foundation. Would you like me to add more specific functionality?`;
  };

  const clearMessages = () => {
    setMessages([messages[0]]); // Keep the welcome message
    toast({ description: 'Conversation cleared' });
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ description: 'Message copied to clipboard!' });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to copy message'
      });
    }
  };

  const getStatusBadge = () => {
    const status = {
      connected: { text: 'Connected', color: 'bg-terminal-green', icon: CheckCircle },
      disconnected: { text: 'Connecting...', color: 'bg-code-orange', icon: Loader2 },
      error: { text: 'Connection Error', color: 'bg-destructive', icon: AlertTriangle }
    }[connectionStatus];

    const Icon = status.icon;
    
    return (
      <Badge variant="secondary" className={`${status.color} text-white text-xs animate-pulse`}>
        <Icon className={`w-3 h-3 mr-1 ${connectionStatus === 'disconnected' ? 'animate-spin' : ''}`} />
        {status.text}
      </Badge>
    );
  };

  return (
    <Card className="flex flex-col h-full bg-card border-border animate-fade-in">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">AI Assistant</span>
          <Zap className="w-4 h-4 text-terminal-green" />
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="h-6 w-6 p-0 hover-scale"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-6 w-6 p-0 hover-scale"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {connectionStatus === 'error' && retryCount >= 3 && (
        <Alert className="m-2 border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to connect to Ollama. Please ensure Ollama is running and accessible.
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3 animate-scale-in">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-accent" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-1 group">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  {message.status === 'sending' && (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  )}
                  {message.status === 'error' && (
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                  )}
                  {message.tokens && (
                    <Badge variant="outline" className="text-xs">
                      {message.tokens} tokens
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyMessage(message.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-sm text-foreground whitespace-pre-wrap font-mono">
                  {message.content}
                </div>
                <div className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">AI Assistant</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-foreground">Thinking...</div>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-100"></div>
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
                {progress > 0 && (
                  <Progress value={progress} className="mt-2 h-1" />
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border bg-secondary">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask AI to generate code..."
            disabled={isLoading || connectionStatus === 'error'}
            className="flex-1 bg-background border-border transition-all focus:ring-2 focus:ring-primary"
            maxLength={4000}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading || connectionStatus === 'error'}
            size="sm"
            className="bg-primary text-primary-foreground hover-scale"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
          <span>{input.length}/4000 characters</span>
          <span>Ctrl+S to save, Ctrl+F to search</span>
        </div>
      </div>
    </Card>
  );
}