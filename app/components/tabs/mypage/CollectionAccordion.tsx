'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface CollectionAccordionProps {
  title: string;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}

export default function CollectionAccordion({ 
  title, 
  count, 
  onAdd, 
  children 
}: CollectionAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-5 h-5 text-[#6b5b6e] dark:text-white transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} aria-hidden />
          <span className="font-medium text-[#6b5b6e] dark:text-white font-mixed">{title}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-mixed">({count})</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-[#6b5b6e] dark:text-white"
        >
          <Plus className="w-4 h-4" strokeWidth={3} aria-hidden />
        </button>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

