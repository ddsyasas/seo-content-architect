'use client';

import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check if dark mode is active
        setIsDark(document.documentElement.classList.contains('dark'));
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        const html = document.documentElement;
        const newIsDark = !html.classList.contains('dark');

        // Toggle the class
        html.classList.remove('light', 'dark');
        html.classList.add(newIsDark ? 'dark' : 'light');

        // Save to localStorage
        localStorage.setItem('syncseo-theme', newIsDark ? 'dark' : 'light');

        // Update state
        setIsDark(newIsDark);
    };

    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
            }}
            className={`p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer ${className}`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{ pointerEvents: 'auto' }}
        >
            {mounted ? (
                isDark ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )
            ) : (
                <Moon className="w-5 h-5" />
            )}
        </button>
    );
}
