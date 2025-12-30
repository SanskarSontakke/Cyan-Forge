import React, { useCallback, useRef } from 'react';
import Button from './Button';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const filesArray = Array.from(fileList);
      onFilesSelect(filesArray);
    }
    // Reset value so same files can be selected again if needed
    if (event.target) {
        event.target.value = '';
    }
  }, [onFilesSelect]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
        multiple
      />
      <div 
        className="border border-dashed border-cyan-800 bg-cyan-950/10 rounded-lg p-8 flex flex-col items-center justify-center gap-3 transition-colors hover:border-cyan-600 hover:bg-cyan-950/20 cursor-pointer"
        onClick={handleButtonClick}
      >
        <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6h.01" />
        </svg>
        <div className="text-center">
          <p className="text-cyan-300 font-medium text-sm mb-1">Upload Photos or Videos</p>
          <p className="text-cyan-700 text-xs">Select multiple files supported</p>
        </div>
        <Button variant="secondary" disabled={disabled} onClick={(e) => { e.stopPropagation(); handleButtonClick(); }}>
          Select Files
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;