import React, { useState, useEffect } from 'react';

const messages = [
    "Whipping up a delicious recipe...",
    "Finding your next favorite meal...",
    "Preheating the creative oven...",
    "Just a moment, good food is coming!",
];

const LoadingSpinner: React.FC = () => {
    const [message, setMessage] = useState(messages[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = messages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 2500); // Change message every 2.5 seconds

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="text-gray-600 px-4">{message}</p>
        </div>
    );
};

export default LoadingSpinner;