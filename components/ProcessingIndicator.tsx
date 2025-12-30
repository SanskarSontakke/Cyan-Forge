import React, { useState, useEffect } from 'react';

const ProcessingIndicator: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING_NEURAL_LINK');

  useEffect(() => {
    // Simulation of progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Asymptotically approach 99%
        if (prev >= 99) return prev;
        const remaining = 100 - prev;
        // Move faster at start, slower at end to simulate "thinking"
        return prev + (remaining * 0.05) + (Math.random() * 1);
      });
    }, 150);

    // Cyberpunk status messages
    const messages = [
      'ENCRYPTING_PAYLOAD_PACKETS',
      'UPLOADING_TO_GRID',
      'ANALYZING_VISUAL_CORTEX',
      'EXTRACTING_KEY_VECTORS',
      'SYNTHESIZING_MARKDOWN_MATRIX',
      'COMPILING_FINAL_RENDER',
      'OPTIMIZING_NEURAL_PATHWAYS'
    ];

    let msgIndex = 0;
    const messageInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setStatusText(messages[msgIndex]);
    }, 1800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="w-full bg-black/40 border border-cyan-500/30 rounded-lg p-6 flex flex-col gap-4 animate-in fade-in duration-300 relative overflow-hidden">
      {/* Background scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.05)_50%,transparent_100%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>
      
      <div className="flex justify-between items-end font-mono text-xs z-10">
        <span className="text-cyan-400 animate-pulse">> SYSTEM_PROCESSING</span>
        <span className="text-cyan-600">{Math.floor(progress)}%_COMPLETE</span>
      </div>

      <div className="relative w-full h-2 bg-cyan-900/40 rounded overflow-hidden border border-cyan-800/50 z-10">
        <div 
          className="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="font-mono text-[10px] text-cyan-700 tracking-[0.2em] uppercase text-center z-10 min-h-[1.5em]">
        {statusText}...
      </div>
    </div>
  );
};

export default ProcessingIndicator;