/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad editorial de Pangloss — heredada tal cual del diseño de referencia.
        // No modificar estos valores sin aprobación explícita: son la identidad visual.
        accent: '#7a1e1e',
        'accent-light': '#f5e8e8',
        'accent-hover': '#9a2828',
        'text-primary': '#1a1a1a',
        'text-secondary': '#4a4a4a',
        'text-muted': '#8a8a8a',
        border: '#e2e0dc',
        'border-light': '#f0eeea',
        surface: '#f7f6f2',
        'surface-dark': '#1a1a1a',
        // Estados editoriales (dashboard / badges) — mismos tonos apagados
        // ya validados en las capturas de referencia (publicado / en revisión).
        success: '#5a8a5a',
        'success-light': '#eef4ee',
        warning: '#c8862a',
        'warning-light': '#faf1e3',
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        editorial: '680px',
        wide: '1200px',
      },
      transitionDuration: {
        editorial: '200ms',
      },
    },
  },
  plugins: [],
};
