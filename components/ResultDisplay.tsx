import React from 'react';
import { Download, Sparkles } from 'lucide-react';
import { downloadImage } from '../utils/imageUtils';

interface ResultDisplayProps {
  resultUrl: string | null;
  isLoading: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ resultUrl, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-3xl bg-stone-100 flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="relative w-24 h-24 mb-6">
           <div className="absolute inset-0 bg-sky-200 rounded-full opacity-70 animate-ping"></div>
           <div className="absolute inset-2 bg-rose-200 rounded-full opacity-70 animate-ping" style={{ animationDelay: '0.3s' }}></div>
           <div className="absolute inset-0 flex items-center justify-center text-white">
             <Sparkles size={32} className="text-stone-500 animate-spin-slow" />
           </div>
        </div>
        <p className="text-stone-500 font-medium text-lg">Painting your masterpiece...</p>
        <p className="text-stone-400 text-sm mt-2">This may take a few seconds</p>
      </div>
    );
  }

  if (!resultUrl) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-3xl bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center p-8 text-stone-400">
        <Sparkles size={48} className="mb-4 text-stone-300" />
        <p>Your artwork will appear here</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl group bg-white">
      <img 
        src={resultUrl} 
        alt="Watercolor Result" 
        className="w-full h-full object-contain bg-stone-100"
      />
      
      {/* Overlay Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
        <button
          onClick={() => downloadImage(resultUrl, `watercolor-gemini-${Date.now()}.png`)}
          className="bg-white text-stone-800 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-stone-50 active:scale-95 transition-transform flex items-center gap-2"
        >
          <Download size={20} /> Download Art
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;
