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
        // #8a8a8a (el valor original) da ~3.45:1 sobre blanco — por debajo
        // del mínimo AA de 4.5:1 para texto normal (WCAG 1.4.3). #757575 da
        // ~4.6:1 y se ve casi idéntico. Mantener sincronizado con
        // --color-text-muted en src/styles/index.css — dos sistemas
        // distintos (esta clase Tailwind vs esa custom property) para el
        // mismo tono, no duplicar el valor sin la otra.
        'text-muted': '#757575',
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
        info: '#3d6b96',
        'info-light': '#e8eef4',
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
