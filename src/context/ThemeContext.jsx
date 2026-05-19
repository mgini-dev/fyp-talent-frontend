import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Read from localStorage on first load — default is light
        return localStorage.getItem('udom_theme') === 'dark';
    });

    useEffect(() => {
        // Persist choice
        localStorage.setItem('udom_theme', isDark ? 'dark' : 'light');
        // Apply data-theme attribute to <html> for CSS overrides
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggle = () => setIsDark(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
