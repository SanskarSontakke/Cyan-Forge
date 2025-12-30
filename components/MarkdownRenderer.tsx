import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple regex-based parsing for demo purposes to avoid heavy deps
  // Supports headers, bold, bullet points
  
  const lines = content.split('\n');
  
  return (
    <div className="space-y-3 font-mono text-sm leading-relaxed text-cyan-100/90">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('### ')) return <h3 key={index} className="text-base font-bold text-cyan-400 mt-4 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={index} className="text-lg font-bold text-cyan-300 mt-5 mb-2 border-b border-cyan-900/50 pb-1">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={index} className="text-xl font-bold text-cyan-200 mt-6 mb-3 border-b border-cyan-600/50 pb-2">{line.slice(2)}</h1>;
        
        // List items
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={index} className="flex gap-2 ml-2">
              <span className="text-cyan-600 text-[10px] mt-1.5">●</span>
              <span dangerouslySetInnerHTML={{ __html: parseInline(line.slice(2)) }} />
            </div>
          );
        }

        // Empty lines
        if (line.trim() === '') return <div key={index} className="h-1" />;

        // Paragraphs
        return <div key={index} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />;
      })}
    </div>
  );
};

// Helper to parse bold (**text**)
const parseInline = (text: string) => {
  let parsed = text;
  // Bold
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  // Italic
  parsed = parsed.replace(/\*(.*?)\*/g, '<em class="text-cyan-300">$1</em>');
  return parsed;
};

export default MarkdownRenderer;