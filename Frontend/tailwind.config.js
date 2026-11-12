module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include your file paths
  ],
  darkMode: 'class',
  theme: {
    extend: {
      
      transitionProperty: {
        'transform': 'transform',
        'opacity': 'opacity'
      },
      colors: {
        'custom-orange': '#f90',
        'highlight': 'gold',
        'dark-bg': '#1a1a1a',
        'light-bg': '#fff',
        gold: '#FFD700',
        black: '#000000',
    },
    animation: {
      timeline: "timeline 1s ease-in-out infinite",
      'text-appear': 'text-appear 5s steps(35, end) infinite, pause 2s infinite',
      
        
    },
    keyframes: {
      timeline: {
        "0%, 100%": { transform: "translateX(0)" },
        "50%": { transform: "translateX(10px)" },
      },
      'text-appear': {
          '0%': { width: '0%' },
          '99%': { width: '100%' }, // Ensures full text appears before resetting
          '100%': { width: '100%' },
        },
        'pause': {
          '0%': { opacity: 1 },
          '100%': { opacity: 1 }, // Pause with no opacity change
        },
        'restart-loop': {
          '0%, 90%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
    },
    boxShadow: {
      'custom': '0 4px 6px rgba(255, 153, 0, 0.3), 0 10px 20px rgba(255, 153, 0, 0.25)',
    },
    backgroundImage: {
      gradient: 'linear-gradient(to right, black, gold)',
    },
    },
  },
  plugins: [],
};
