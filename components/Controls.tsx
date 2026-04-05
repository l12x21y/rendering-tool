
import React, { useRef } from 'react';
import { Droplets, BookOpen, Layers, ImagePlus, X, Plus, Trash2 } from 'lucide-react';
import { GenerationSettings, CustomStyle } from '../types';

interface ControlsProps {
  settings: GenerationSettings;
  customStyles: CustomStyle[];
  onChange: (newSettings: GenerationSettings) => void;
  onReferenceSelect: (file: File) => void;
  onReferenceClear: () => void;
  onOpenStyleLab: () => void;
  onDeleteStyle: (id: string) => void;
  disabled: boolean;
  onGenerate: () => void;
}

const defaultStyles: { id: string; label: string; color: string }[] = [
  { id: 'Watercolor', label: 'Watercolor', color: 'bg-rose-100 text-rose-600' },
  { id: 'Colored Pencil', label: 'Pencil', color: 'bg-amber-100 text-amber-600' },
  { id: 'Anime', label: 'Anime', color: 'bg-purple-100 text-purple-600' },
  { id: '3D Model', label: '3D Render', color: 'bg-emerald-100 text-emerald-600' },
];

const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  customStyles,
  onChange, 
  onReferenceSelect,
  onReferenceClear,
  onOpenStyleLab,
  onDeleteStyle,
  disabled, 
  onGenerate 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof GenerationSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onReferenceSelect(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 h-full flex flex-col justify-center">
      
      {/* Style Selector */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} /> Art Style
          </h3>
          <button 
            onClick={onOpenStyleLab}
            className="text-xs bg-stone-800 text-white px-2 py-1 rounded-lg font-bold hover:bg-stone-700 flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> New Style
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
          {/* Default Styles */}
          {defaultStyles.map((s) => (
            <button
              key={s.id}
              onClick={() => update('style', s.id)}
              disabled={disabled}
              className={`
                py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 relative
                ${settings.style === s.id 
                  ? `border-current ${s.color} ring-1 ring-offset-1 ring-stone-200` 
                  : 'bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100'
                }
              `}
            >
              {s.label}
            </button>
          ))}
          
          {/* Custom Styles */}
          {customStyles.map((s) => (
             <button
              key={s.id}
              onClick={() => update('style', s.id)}
              disabled={disabled}
              className={`
                py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 relative group
                ${settings.style === s.id 
                  ? `border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-offset-1 ring-stone-200` 
                  : 'bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100'
                }
              `}
            >
              <span className="truncate block w-full">{s.name}</span>
              <div 
                onClick={(e) => { e.stopPropagation(); onDeleteStyle(s.id); }}
                className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-sm z-10"
              >
                <Trash2 size={10} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 flex-grow">
        
        {/* Style Reference Upload */}
        <div className="space-y-2">
           <div className="flex justify-between items-center text-sm font-bold text-stone-500 uppercase tracking-wider">
             <span className="flex items-center gap-2"><ImagePlus size={16} /> Style Mimic (Optional)</span>
           </div>
           
           {!settings.styleReferenceImage ? (
             <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="w-full h-16 border-2 border-dashed border-stone-300 rounded-2xl flex items-center justify-center gap-2 text-stone-400 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 transition-all text-sm font-bold"
             >
                <ImagePlus size={20} /> Upload Reference Image
             </button>
           ) : (
             <div className="relative w-full h-16 bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 group">
                <img 
                  src={`data:image/jpeg;base64,${settings.styleReferenceImage}`} 
                  alt="Reference" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-stone-600 shadow-sm">Reference Active</span>
                </div>
                <button
                  onClick={onReferenceClear}
                  className="absolute right-2 top-2 p-1 bg-white rounded-full text-rose-500 shadow-md hover:bg-rose-50"
                  title="Remove reference"
                >
                  <X size={14} />
                </button>
             </div>
           )}
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleRefFileChange} 
             accept="image/*" 
             className="hidden" 
           />
        </div>

        <hr className="border-stone-100" />

        {/* Sliders */}
        <div className="space-y-4">
          {/* Intensity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-stone-600 font-medium text-sm">
              <span className="flex items-center gap-2">Color Intensity</span>
              <span className="text-sky-600">{settings.intensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.intensity}
              onChange={(e) => update('intensity', parseInt(e.target.value))}
              className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-500 transition-all"
              disabled={disabled}
            />
          </div>

          {/* Softness Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-stone-600 font-medium text-sm">
              <span className="flex items-center gap-2"><Droplets size={14} /> Softness</span>
              <span className="text-sky-600">{settings.softness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.softness}
              onChange={(e) => update('softness', parseInt(e.target.value))}
              className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-500 transition-all"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Texture Toggle */}
        <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-lg text-stone-400">
                <BookOpen size={16} />
            </div>
            <span className="font-medium text-stone-600 text-sm">Texture</span>
          </div>
          <button
            onClick={() => update('paperTexture', !settings.paperTexture)}
            disabled={disabled}
            className={`
              w-10 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none
              ${settings.paperTexture ? 'bg-sky-400' : 'bg-stone-200'}
            `}
          >
            <div
              className={`
                bg-white w-4 h-4 rounded-full shadow-md transform duration-300
                ${settings.paperTexture ? 'translate-x-4' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={disabled}
        className={`
          w-full py-4 mt-6 rounded-2xl font-bold text-lg shadow-lg transform transition-all active:scale-[0.98]
          ${disabled 
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' 
            : 'bg-gradient-to-r from-sky-400 to-rose-400 text-white hover:shadow-sky-200/50 hover:to-rose-500'
          }
        `}
      >
        {disabled ? 'Creating Art...' : 'Generate Artwork'}
      </button>
    </div>
  );
};

export default Controls;
