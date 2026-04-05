import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageSelect: (file: File) => void;
  onClear: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageSelect, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelect(e.dataTransfer.files[0]);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  if (currentImage) {
    return (
      <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-stone-100 group">
        <img 
          src={currentImage} 
          alt="Original" 
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={onClear}
              className="bg-white text-rose-500 px-6 py-3 rounded-full font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg hover:bg-rose-50"
            >
              <X size={20} /> Remove Image
            </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        w-full aspect-square md:aspect-[4/3] rounded-3xl border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8
        ${isDragging 
          ? 'border-rose-400 bg-rose-50' 
          : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerSelect}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-rose-100 text-rose-500' : 'bg-stone-100 text-stone-400'}`}>
        {isDragging ? <Upload size={40} /> : <ImageIcon size={40} />}
      </div>
      
      <p className="text-lg font-bold text-stone-600 text-center mb-2">
        {isDragging ? 'Drop it here!' : 'Upload your sketch'}
      </p>
      <p className="text-sm text-stone-400 text-center max-w-[200px]">
        Drag & drop or click to select a file (JPG, PNG)
      </p>
    </div>
  );
};

export default ImageUploader;
