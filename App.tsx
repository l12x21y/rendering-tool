import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Controls from './components/Controls';
import ResultDisplay from './components/ResultDisplay';
import StyleLab from './components/StyleLab';
import { GenerationSettings, CustomStyle } from './types';
import { generateArt, setApiKey } from './services/geminiService';
import { fileToBase64 } from './utils/imageUtils';
import { Lock, Key, CheckCircle2, ArrowRight } from 'lucide-react';

type AuthStep = 'PASSWORD' | 'API_KEY' | 'APP';

const App: React.FC = () => {
  const [authStep, setAuthStep] = useState<AuthStep>('PASSWORD');
  const [password, setPassword] = useState('');
  const [inputApiKey, setInputApiKey] = useState('');
  
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentFileBase64, setCurrentFileBase64] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Custom Styles
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>([]);
  const [isStyleLabOpen, setIsStyleLabOpen] = useState(false);
  
  const [settings, setSettings] = useState<GenerationSettings>({
    style: 'Watercolor',
    intensity: 50,
    softness: 50,
    paperTexture: true,
    styleReferenceImage: null,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0211') {
      setAuthStep('API_KEY');
    } else {
      alert('Incorrect access code');
      setPassword('');
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputApiKey.trim().length > 5) {
      setApiKey(inputApiKey.trim());
      setAuthStep('APP');
    } else {
      alert("Please enter a valid API Key");
    }
  };

  const handleImageSelect = async (file: File) => {
    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setCurrentImage(objectUrl);
    
    // Prepare for API
    try {
      const base64 = await fileToBase64(file);
      setCurrentFileBase64(base64);
      setGeneratedImage(null); // Reset previous result
    } catch (e) {
      console.error("Failed to process image", e);
      alert("Could not process image file.");
    }
  };

  const handleReferenceSelect = async (file: File) => {
     try {
       const base64 = await fileToBase64(file);
       setSettings(prev => ({ ...prev, styleReferenceImage: base64 }));
     } catch (e) {
       console.error("Failed to process reference image", e);
       alert("Could not process reference image.");
     }
  };

  const handleReferenceClear = () => {
    setSettings(prev => ({ ...prev, styleReferenceImage: null }));
  };

  const handleClear = () => {
    setCurrentImage(null);
    setCurrentFileBase64(null);
    setGeneratedImage(null);
  };

  const handleGenerate = async () => {
    if (!currentFileBase64) return;

    setLoading(true);
    try {
      // Logic to attach custom style description if a custom style is selected
      const currentSettings = { ...settings };
      const customStyle = customStyles.find(s => s.id === settings.style);
      
      if (customStyle) {
        currentSettings.customStyleDescription = customStyle.description;
      }

      const resultUrl = await generateArt(currentFileBase64, currentSettings);
      setGeneratedImage(resultUrl);
    } catch (error) {
      console.error("Generation failed", error);
      alert("Something went wrong while generating the artwork. Please ensure your API key is valid.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomStyle = (style: CustomStyle) => {
    setCustomStyles(prev => [...prev, style]);
    // Automatically select the new style
    setSettings(prev => ({ ...prev, style: style.id }));
  };

  const handleDeleteStyle = (id: string) => {
    setCustomStyles(prev => prev.filter(s => s.id !== id));
    if (settings.style === id) {
      setSettings(prev => ({ ...prev, style: 'Watercolor' }));
    }
  };

  // 1. Password Screen
  if (authStep === 'PASSWORD') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-100 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-sm">
                <Lock size={28} />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">Art Studio</h1>
            <p className="text-stone-500 mb-8">Please enter the access code to continue.</p>
            
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border-2 border-stone-100 mb-6 focus:outline-none focus:border-rose-300 text-center text-lg tracking-widest placeholder-stone-300 transition-colors"
                placeholder="••••"
                autoFocus
            />
            
            <button
                type="submit"
                className="w-full py-3.5 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-700 transition-all active:scale-[0.98] shadow-lg"
            >
                Verify Code
            </button>
        </form>
      </div>
    );
  }

  // 2. API Key Screen (Manual Input)
  if (authStep === 'API_KEY') {
    return (
       <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <form onSubmit={handleApiKeySubmit} className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-100 text-center">
            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-500 shadow-sm">
                <Key size={28} />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">Google Gemini API</h1>
            <p className="text-stone-500 mb-8">Enter your API key to enable rendering.</p>
            
            <input
                type="password"
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border-2 border-stone-100 mb-6 focus:outline-none focus:border-sky-300 text-sm font-mono placeholder-stone-300 transition-colors"
                placeholder="AIzaSy..."
                autoFocus
            />
            
            <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
                Connect API <ArrowRight size={18} />
            </button>

             <p className="text-xs text-stone-400 mt-4">
               Your key is stored locally in memory and used only for requests.
               <br/>
               <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-stone-600">
                 Get a key here
               </a>
            </p>
        </form>
      </div>
    );
  }

  // 3. Main App
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 md:px-6">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
               <h2 className="text-lg font-bold text-stone-700 mb-4 ml-2">1. Input Sketch</h2>
               <ImageUploader 
                 currentImage={currentImage} 
                 onImageSelect={handleImageSelect}
                 onClear={handleClear}
               />
            </section>

            <section className="flex-grow">
               <h2 className="text-lg font-bold text-stone-700 mb-4 ml-2">2. Customize Style</h2>
               <Controls 
                  settings={settings}
                  customStyles={customStyles}
                  onChange={setSettings}
                  onReferenceSelect={handleReferenceSelect}
                  onReferenceClear={handleReferenceClear}
                  onOpenStyleLab={() => setIsStyleLabOpen(true)}
                  onDeleteStyle={handleDeleteStyle}
                  disabled={loading || !currentImage}
                  onGenerate={handleGenerate}
               />
            </section>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <h2 className="text-lg font-bold text-stone-700 mb-4 ml-2">3. Result</h2>
            <div className="h-[500px] lg:h-[calc(100%-3rem)]">
              <ResultDisplay 
                resultUrl={generatedImage} 
                isLoading={loading} 
              />
            </div>
          </div>

        </div>
      </main>

      <StyleLab 
        isOpen={isStyleLabOpen} 
        onClose={() => setIsStyleLabOpen(false)}
        onSave={handleSaveCustomStyle}
      />
    </div>
  );
};

export default App;