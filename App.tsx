import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Button from './components/Button';
import MarkdownRenderer from './components/MarkdownRenderer';
import ProcessingIndicator from './components/ProcessingIndicator';
import { MediaFile, Note, NoteType, ProcessingState } from './types';
import { generateNote } from './services/geminiService';

const STORAGE_KEY = 'cyan_notes_data';

const App: React.FC = () => {
  const [currentFiles, setCurrentFiles] = useState<MediaFile[]>([]);
  
  // Initialize notes from localStorage
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Failed to load notes from storage:', err);
      return [];
    }
  });

  const [processingState, setProcessingState] = useState<ProcessingState>({ isProcessing: false, error: null });

  // Cleanup object URLs to avoid memory leaks for current session files
  useEffect(() => {
    return () => {
      currentFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
    };
  }, [currentFiles]);

  // Persist notes to localStorage whenever they change
  useEffect(() => {
    try {
      // We explicitly exclude relatedMediaUrls from storage because Blob URLs 
      // are session-specific and will be invalid after a page reload.
      // Saving them would result in broken images.
      const notesToSave = notes.map(note => ({
        ...note,
        relatedMediaUrls: [] 
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesToSave));
    } catch (err) {
      console.error('Failed to save notes to storage (likely quota exceeded):', err);
    }
  }, [notes]);

  const handleFilesSelect = (files: File[]) => {
    // Revoke old urls
    currentFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
    
    const newMediaFiles: MediaFile[] = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    
    setCurrentFiles(newMediaFiles);
    setProcessingState({ isProcessing: false, error: null });
  };

  const handleCreateNote = async (type: NoteType) => {
    if (currentFiles.length === 0) return;

    setProcessingState({ isProcessing: true, error: null });

    try {
      const files = currentFiles.map(f => f.file);
      const content = await generateNote(files, type);
      
      const newNote: Note = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        type,
        content,
        relatedMediaUrls: currentFiles.map(f => f.previewUrl)
      };

      setNotes(prev => [newNote, ...prev]);
      // Clear selection after successful generation
      setCurrentFiles([]);
    } catch (err: any) {
      console.error(err);
      setProcessingState({ 
        isProcessing: false, 
        error: err.message || "Failed to generate note. Please try again." 
      });
    } finally {
      setProcessingState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const downloadNote = (note: Note) => {
    const a = document.createElement('a');
    
    if (note.type === NoteType.TEXT) {
      const blob = new Blob([note.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `cyan_forge_${note.id.slice(0, 8)}.md`;
      
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Visual notes are Base64 Data URLs
      a.href = note.content;
      a.download = `cyan_forge_sketch_${note.id.slice(0, 8)}.png`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-black text-cyan-50 selection:bg-cyan-900 selection:text-white pb-20 font-mono">
      
      {/* Header */}
      <header className="border-b border-cyan-900/50 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_#06b6d4]"></div>
             <h1 className="text-lg font-semibold tracking-tight text-cyan-100">Cyan Forge</h1>
          </div>
          <div className="text-[10px] text-cyan-700 uppercase tracking-widest">System Ready</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Error Display */}
        {processingState.error && (
          <div className="bg-red-950/30 border border-red-900/50 p-3 rounded text-red-400 text-xs">
            Error: {processingState.error}
          </div>
        )}

        {/* Input Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-cyan-600 border-l-2 border-cyan-600 pl-3 uppercase tracking-wider">Media Input</h2>
          
          {currentFiles.length === 0 ? (
            <FileUpload onFilesSelect={handleFilesSelect} disabled={processingState.isProcessing} />
          ) : (
            <div className="bg-cyan-950/10 border border-cyan-900/50 rounded-lg p-4 animate-in fade-in duration-300">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-cyan-500">
                    <span className="text-cyan-200">{currentFiles.length}</span> file(s) selected
                  </span>
                  <button 
                    onClick={() => setCurrentFiles([])}
                    className="text-xs text-cyan-700 hover:text-red-400 transition-colors"
                    disabled={processingState.isProcessing}
                  >
                    Clear All
                  </button>
               </div>
               
               <div className={`mb-6 grid gap-2 max-h-[400px] overflow-y-auto pr-1 ${currentFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                 {currentFiles.map((media, idx) => (
                   <div key={idx} className="relative aspect-square bg-black rounded border border-cyan-900/30 overflow-hidden group">
                     {media.type === 'image' ? (
                       <img src={media.previewUrl} alt={`Input ${idx}`} className="w-full h-full object-cover" />
                     ) : (
                       <video src={media.previewUrl} className="w-full h-full object-cover" muted />
                     )}
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-cyan-50 bg-black/80 px-2 py-1 rounded border border-cyan-900">{media.file.name}</span>
                     </div>
                   </div>
                 ))}
               </div>

               {processingState.isProcessing ? (
                 <ProcessingIndicator />
               ) : (
                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   <Button 
                     onClick={() => handleCreateNote(NoteType.TEXT)}
                     disabled={processingState.isProcessing}
                   >
                     Analyze Text
                   </Button>
                   <Button 
                     onClick={() => handleCreateNote(NoteType.VISUAL)}
                     variant="secondary"
                     disabled={processingState.isProcessing}
                   >
                     Generate Visual Note
                   </Button>
                 </div>
               )}
            </div>
          )}
        </section>

        {/* Output Section */}
        {notes.length > 0 && (
          <section className="space-y-4">
             <div className="flex items-center justify-between border-l-2 border-cyan-600 pl-3">
               <h2 className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">Generated Notes ({notes.length})</h2>
               {notes.length > 0 && (
                 <button 
                   onClick={() => {
                     if(window.confirm('Clear all history?')) {
                       setNotes([]);
                       localStorage.removeItem(STORAGE_KEY);
                     }
                   }}
                   className="text-[10px] text-cyan-800 hover:text-red-400 uppercase tracking-wider transition-colors"
                 >
                   Clear History
                 </button>
               )}
             </div>
             
             <div className="grid gap-6">
               {notes.map((note) => (
                 <article key={note.id} className="bg-black border border-cyan-900/50 rounded-lg overflow-hidden shadow-sm hover:border-cyan-700 transition-colors">
                    <div className="bg-cyan-950/20 px-4 py-2 border-b border-cyan-900/30 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${note.type === NoteType.TEXT ? 'bg-cyan-400' : 'bg-fuchsia-400'}`}></span>
                        <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wide">{note.type} Note</span>
                        {note.relatedMediaUrls.length > 0 && (
                          <span className="text-[10px] text-cyan-800 ml-2 border-l border-cyan-900 pl-2">
                            Sources: {note.relatedMediaUrls.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-cyan-800">{new Date(note.createdAt).toLocaleString()}</span>
                        <button 
                          onClick={() => deleteNote(note.id)}
                          className="text-cyan-900 hover:text-red-500 transition-colors"
                          title="Delete note"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Source Thumbnails Strip (Only if URLs exist and are valid in current session) */}
                    {note.relatedMediaUrls.length > 0 && (
                      <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                          {note.relatedMediaUrls.map((url, idx) => (
                              <div key={idx} className="flex-shrink-0 w-12 h-12 rounded border border-cyan-900/40 overflow-hidden bg-cyan-950/10">
                                  <img 
                                    src={url} 
                                    alt="src" 
                                    className="w-full h-full object-cover"
                                  />
                              </div>
                          ))}
                      </div>
                    )}
                     
                    <div className="p-4">
                      {note.type === NoteType.TEXT ? (
                         <MarkdownRenderer content={note.content} />
                      ) : (
                         <div className="rounded overflow-hidden border border-cyan-900/50">
                            <img src={note.content} alt="Visual Note" className="w-full h-auto" />
                         </div>
                      )}
                    </div>

                    <div className="px-4 py-3 border-t border-cyan-900/30 bg-cyan-950/10 flex justify-end">
                       <Button variant="secondary" onClick={() => downloadNote(note)} className="text-xs py-1 px-3">
                         Download {note.type === NoteType.TEXT ? 'MD' : 'PNG'}
                       </Button>
                    </div>
                 </article>
               ))}
             </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;