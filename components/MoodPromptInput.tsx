import React, { useState } from 'react';

interface MoodPromptInputProps {
    onGenerate: (mood: string) => void;
    isLoading: boolean;
}

const MoodPromptInput: React.FC<MoodPromptInputProps> = ({ onGenerate, isLoading }) => {
    const [mood, setMood] = useState('');

    const handleGenerate = () => {
        if (mood.trim() && !isLoading) {
            onGenerate(mood.trim());
        }
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleGenerate();
        }
    };

    return (
        <div className="w-full max-w-md mb-6 animate-fade-in">
            <label htmlFor="mood-input" className="block text-center text-gray-700 font-medium mb-2">
                What are you in the mood for?
            </label>
            <div className="flex space-x-2">
                <input
                    id="mood-input"
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., 'a comforting soup' or 'spicy & quick'"
                    className="flex-grow block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                    aria-label="Recipe mood or theme"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !mood.trim()}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                    aria-label="Generate recipe from mood"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Generate'}
                </button>
            </div>
        </div>
    );
};

export default MoodPromptInput;
