
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Save, Download, Play, MessageSquare, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { CustomStyle, StyleLabStep, StyleMetrics } from '../types';
import { refineStyleDescription, generateStylePreview, extractStyleMetrics } from '../services/geminiService';
import { fileToBase64 } from '../utils/imageUtils';

interface StyleLabProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: CustomStyle) => void;
}

const StyleLab: React.FC<StyleLabProps> = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState<'INIT' | 'REFINING'>('INIT');
  const [sketchSubject, setSketchSubject] = useState('');
  const [base64Sketch, setBase64Sketch] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  
  // Style State
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<StyleLabStep[]>([]);
  const [styleName, setStyleName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setBase64Sketch(base64);
      } catch (err) {
        alert("Failed to load image");
      }
    }
  };

  const handleStart = async () => {
    if (!sketchSubject.trim() || !base64Sketch) return;
    setIsLoading(true);
    setLoadingStep("Drafting initial style...");
    
    try {
      // Initial generic style draft
      const initialDesc = await refineStyleDescription("", "Create a standard artistic illustration style", sketchSubject);
      setCurrentDescription(initialDesc);
      
      // Parallel: Generate Preview AND Extract Metrics
      setLoadingStep("Generating first preview & analyzing metrics...");
      const [img, metrics] = await Promise.all([
        generateStylePreview(base64Sketch, sketchSubject, initialDesc),
        extractStyleMetrics(initialDesc)
      ]);

      setCurrentImage(img);
      
      setStep('REFINING');
      setHistory([{
        step: 1,
        userFeedback: "Initial Start",
        refinedStyleDescription: initialDesc,
        structuredData: metrics,
        imageUrl: img,
        timestamp: Date.now()
      }]);
    } catch (e) {
      console.error(e);
      alert("Failed to start session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!feedback.trim() || !base64Sketch) return;
    setIsLoading(true);
    setLoadingStep("Analyzing feedback & updating style rules...");

    try {
      // 1. Refine text description
      const newDesc = await refineStyleDescription(currentDescription, feedback, sketchSubject);
      setCurrentDescription(newDesc);

      // 2. Generate new image AND Extract new metrics
      setLoadingStep("Rendering new preview & updating data...");
      const [newImg, newMetrics] = await Promise.all([
        generateStylePreview(base64Sketch, sketchSubject, newDesc),
        extractStyleMetrics(newDesc)
      ]);

      setCurrentImage(newImg);

      // 3. Update history
      const newStep: StyleLabStep = {
        step: history.length + 1,
        userFeedback: feedback,
        refinedStyleDescription: newDesc,
        structuredData: newMetrics,
        imageUrl: newImg,
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, newStep]);
      setFeedback('');

    } catch (e) {
      console.error(e);
      alert("Failed to refine style. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSave = () => {
    if (!styleName.trim()) return;
    
    const lastStep = history[history.length - 1];
    
    const newStyle: CustomStyle = {
      id: `custom-${Date.now()}`,
      name: styleName,
      description: currentDescription,
      trainingData: history,
      latestMetrics: lastStep?.structuredData,
      createdAt: Date.now()
    };
    
    onSave(newStyle);
    onClose();
    resetState();
  };

  const resetState = () => {
    setStep('INIT');
    setSketchSubject('');
    setBase64Sketch(null);
    setHistory([]);
    setCurrentImage(null);
    setStyleName('');
    setShowSaveDialog(false);
  };

  const exportData = () => {
    const exportObj = {
      styleName: styleName || "Untitled Style",
      finalDescription: currentDescription,
      createdAt: new Date().toISOString(),
      iterationHistory: history.map(h => ({
        step: h.step,
        feedback: h.userFeedback,
        generatedDescription: h.refinedStyleDescription,
        metrics: h.structuredData,
        timestamp: new Date(h.timestamp).toISOString()
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `style_data_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Render the metrics visualization
  const renderMetrics = (metrics: StyleMetrics) => (
    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 mt-2 bg-stone-50 p-2 rounded-lg border border-stone-200">
      <div>
        <span className="font-bold block text-stone-400">Contrast</span>
        <div className="w-full bg-stone-200 h-1.5 rounded-full mt-1">
          <div className="bg-stone-600 h-1.5 rounded-full" style={{ width: `${metrics.contrastLevel}%` }}></div>
        </div>
      </div>
      <div>
        <span className="font-bold block text-stone-400">Saturation</span>
        <div className="w-full bg-stone-200 h-1.5 rounded-full mt-1">
          <div className="bg-stone-600 h-1.5 rounded-full" style={{ width: `${metrics.saturationLevel}%` }}></div>
        </div>
      </div>
      <div className="col-span-2">
        <span className="font-bold block text-stone-400 mb-1">Palette</span>
        <div className="flex gap-1">
          {metrics.colorPalette.map((color, i) => (
            <div key={i} className="w-6 h-6 rounded-full border border-stone-200 shadow-sm" style={{ backgroundColor: color }} title={color}></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-800">Style Lab</h2>
              <p className="text-xs text-stone-500">Sketch-to-Style Training & Data Extraction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow flex overflow-hidden">
          
          {/* LEFT: Controls & History */}
          <div className="w-1/3 border-r border-stone-100 flex flex-col bg-stone-50/50">
            
            {step === 'INIT' ? (
              <div className="p-8 flex flex-col justify-center h-full">
                <h3 className="text-lg font-bold text-stone-700 mb-4">1. Upload a Test Sketch</h3>
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full aspect-[4/3] border-2 border-dashed border-stone-300 rounded-2xl mb-4 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors bg-white relative overflow-hidden"
                >
                  {base64Sketch ? (
                    <img src={`data:image/png;base64,${base64Sketch}`} className="w-full h-full object-contain" alt="Sketch" />
                  ) : (
                    <>
                      <Upload size={32} className="text-stone-400 mb-2" />
                      <span className="text-sm text-stone-500 font-bold">Click to upload sketch</span>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>

                <label className="text-sm font-bold text-stone-600 mb-2 block">2. What is in this sketch?</label>
                <input
                  type="text"
                  value={sketchSubject}
                  onChange={(e) => setSketchSubject(e.target.value)}
                  placeholder="e.g. A girl holding a coffee cup"
                  className="w-full p-4 rounded-xl border border-stone-200 focus:border-purple-400 focus:outline-none mb-6"
                />

                <button
                  onClick={handleStart}
                  disabled={!sketchSubject || !base64Sketch || isLoading}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-200"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                  Start Training
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Scrollable History */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                   <div className="text-center py-2">
                     <span className="bg-stone-200 text-stone-500 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">Training Log</span>
                   </div>
                   
                   {history.map((h, idx) => (
                     <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                       <div className="flex items-center gap-2 mb-3 border-b border-stone-50 pb-2">
                         <div className="bg-stone-100 text-stone-500 text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                           {h.step}
                         </div>
                         <p className="text-sm text-stone-800 font-medium">"{h.userFeedback}"</p>
                       </div>
                       
                       <div className="space-y-2">
                         <p className="text-xs text-stone-400 font-mono line-clamp-2" title={h.refinedStyleDescription}>
                           Prompt: {h.refinedStyleDescription}
                         </p>
                         {renderMetrics(h.structuredData)}
                       </div>
                     </div>
                   ))}
                   
                   {isLoading && (
                     <div className="flex flex-col items-center gap-2 text-stone-400 text-sm justify-center py-6 animate-pulse">
                        <Loader2 size={24} className="animate-spin text-purple-400" />
                        <span>{loadingStep}</span>
                     </div>
                   )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <div className="relative">
                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                      placeholder="Critique the render (e.g. 'More pastel colors', 'Less detail')"
                      className="w-full pl-4 pr-12 py-4 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                      disabled={isLoading}
                    />
                    <button 
                      onClick={handleRefine}
                      disabled={isLoading || !feedback}
                      className="absolute right-2 top-2 bottom-2 aspect-square bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Preview */}
          <div className="w-2/3 bg-stone-100 flex items-center justify-center p-8 relative">
            <div className="w-full h-full flex gap-4">
               
               {/* Original Sketch (Small) */}
               {base64Sketch && step === 'REFINING' && (
                 <div className="absolute top-6 left-6 z-10 w-32 aspect-[4/3] bg-white rounded-xl shadow-lg border border-white overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <img src={`data:image/png;base64,${base64Sketch}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1">Original</div>
                 </div>
               )}

               {/* Generated Result */}
               <div className="flex-grow relative flex items-center justify-center">
                 {currentImage ? (
                    <div className="relative max-w-full max-h-full shadow-2xl rounded-2xl overflow-hidden bg-white">
                      <img src={currentImage} alt="Style Preview" className="max-w-full max-h-[80vh] object-contain" />
                    </div>
                 ) : (
                    <div className="text-center text-stone-400">
                      <div className="w-24 h-24 border-4 border-dashed border-stone-300 rounded-full flex items-center justify-center mx-auto mb-4 bg-stone-50">
                        <Sparkles size={40} />
                      </div>
                      <p className="font-bold">Preview Area</p>
                      <p className="text-sm">Upload a sketch to begin</p>
                    </div>
                 )}
               </div>
            </div>

             {/* Action Bar */}
             {step === 'REFINING' && currentImage && (
               <div className="absolute bottom-8 flex gap-4">
                 <button 
                    onClick={() => setShowSaveDialog(true)}
                    className="px-8 py-4 bg-stone-800 text-white rounded-full font-bold shadow-xl hover:bg-stone-900 transition-transform active:scale-95 flex items-center gap-2"
                 >
                   <Save size={20} /> Save Style
                 </button>
                 <button 
                    onClick={exportData}
                    className="px-8 py-4 bg-white text-purple-600 border border-purple-100 rounded-full font-bold shadow-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
                 >
                   <Download size={20} /> Export Data (JSON)
                 </button>
               </div>
             )}

            {/* Save Dialog Overlay */}
            {showSaveDialog && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-96 transform transition-all scale-100">
                  <h3 className="font-bold text-xl mb-6 text-stone-800">Finalize Style</h3>
                  
                  <div className="mb-6">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Style Name</label>
                    <input
                      type="text"
                      value={styleName}
                      onChange={(e) => setStyleName(e.target.value)}
                      placeholder="e.g. Neon Cyberpunk"
                      className="w-full p-4 border-2 border-stone-100 rounded-xl focus:border-purple-400 focus:outline-none text-lg font-bold"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowSaveDialog(false)}
                      className="flex-1 py-3 text-stone-500 hover:bg-stone-100 rounded-xl font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleFinalSave}
                      className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StyleLab;
