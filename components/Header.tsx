
import React from 'react';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { BackIcon } from './icons/BackIcon';

interface HeaderProps {
  currentView: 'discover' | 'saved';
  setView: (view: 'discover' | 'saved') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  return (
    <header className="w-full bg-white shadow-sm p-4 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800 tracking-wide">
          WhimDish
        </h1>
        {currentView === 'discover' ? (
          <button 
            onClick={() => setView('saved')} 
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            aria-label="View saved recipes"
          >
            <BookmarkIcon />
            <span className="hidden sm:inline">Saved</span>
          </button>
        ) : (
          <button 
            onClick={() => setView('discover')} 
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            aria-label="Back to discover"
          >
            <BackIcon />
            <span className="hidden sm:inline">Discover</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;