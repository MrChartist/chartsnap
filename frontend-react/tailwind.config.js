/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0A0D14',
                card: 'rgba(255, 255, 255, 0.03)',
                cardHover: 'rgba(255, 255, 255, 0.05)',
                border: 'rgba(255, 255, 255, 0.1)',
                primary: '#8b5cf6', // purple-500
                secondary: '#06b6d4', // cyan-500
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
