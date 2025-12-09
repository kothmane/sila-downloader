/** @type {import('tailwindcss').Config} */
import tailwindScrollbar from 'tailwind-scrollbar';

export default {
  content: [
    "./src/**/*.{js,jsx}",
    "./src/renderer/index.html"
  ],
  safelist: [
    'text-[var(--primary-button-text)]',
    'bg-[var(--primary-button-color)]',
  ],
  theme: {
    extend: {},
  },
  plugins: [tailwindScrollbar],
}
