import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Monitor } from 'lucide-react';

interface PreviewPaneProps {
  htmlContent: string;
  cssContent: string;
  jsContent: string;
}

export function PreviewPane({ htmlContent, cssContent, jsContent }: PreviewPaneProps) {
  const createPreviewContent = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    ${jsContent}
  </script>
</body>
</html>
    `;
  };

  const openInNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(createPreviewContent());
      newWindow.document.close();
    }
  };

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 bg-background">
        <iframe
          srcDoc={createPreviewContent()}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Code Preview"
        />
      </div>
    </Card>
  );
}