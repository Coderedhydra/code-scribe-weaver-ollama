import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onCodeGenerate: (code: string) => void;
}

export function AIChat({ onCodeGenerate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you build websites and apps. What would you like to create?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim()) return;

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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
      const codeMatch = aiResponse.content.match(/```\w*\n([\s\S]*?)\n```/);
      if (codeMatch) {
        setTimeout(() => {
          toast({
            description: "Code ready to add to editor",
            action: (
              <Button 
                size="sm" 
                onClick={() => onCodeGenerate(codeMatch[1])}
              >
                Add
              </Button>
            )
          });
        }, 500);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'AI request failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('react')) {
      return `Here's a React component:\n\n\`\`\`jsx\nfunction App() {\n  return (\n    <div>\n      <h1>Hello React!</h1>\n    </div>\n  );\n}\n\`\`\``;
    }
    
    if (input.includes('html')) {
      return `Here's some HTML:\n\n\`\`\`html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>\n\`\`\``;
    }
    
    return `Here's code for "${userInput}":\n\n\`\`\`javascript\n// ${userInput}\nfunction ${userInput.replace(/\s+/g, '')}() {\n  console.log('${userInput}');\n  return true;\n}\n\`\`\``;
  };

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Bot className="w-4 h-4 text-terminal-green" />
        <span className="font-medium text-sm">AI Assistant</span>
      </div>

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
                  {message.role === 'user' ? 'You' : 'AI'}
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
              <div className="text-sm text-muted-foreground">Thinking...</div>
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
            placeholder="Ask AI..."
            disabled={isLoading}
            className="flex-1 h-8 text-sm"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            size="sm"
            className="h-8"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}