import React from 'react';

interface ServingAdjusterProps {
    servings: number;
    setServings: (servings: number) => void;
}

export const ServingAdjuster: React.FC<ServingAdjusterProps> = ({ servings, setServings }) => {
    const adjustServings = (amount: number) => {
        setServings(Math.max(1, servings + amount));
    };

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => adjustServings(-1)}
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                aria-label="Decrease servings"
                disabled={servings <= 1}
            >
                -
            </button>
            <span className="w-10 text-center font-medium text-gray-800" aria-live="polite">
                {servings}
            </span>
            <button
                onClick={() => adjustServings(1)}
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-lg hover:bg-gray-300 transition-colors"
                aria-label="Increase servings"
            >
                +
            </button>
        </div>
    );
};
