export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Nunito', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            borderRadius: {
                '3xl': '1.5rem',
                'pill': '9999px',
            }
        },
    },
    plugins: [],
}
