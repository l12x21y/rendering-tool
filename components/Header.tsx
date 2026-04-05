import React from 'react';
import { Palette, Wand2 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-8 px-4 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="p-3 bg-rose-100 rounded-2xl text-rose-500">
          <Palette size={28} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight">
          Art Studio
        </h1>
        <div className="p-3 bg-violet-100 rounded-2xl text-violet-500">
          <Wand2 size={28} />
        </div>
      </div>
      <p className="text-stone-500 font-medium">
        Reimagine your sketches in any style
      </p>
    </header>
  );
};

export default Header;