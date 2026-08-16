# Criterio de diseño de Pangloss

Esto no es una checklist de funcionalidades. Es el criterio con el que se juzga cada
pantalla, estado e interacción de Pangloss, en todas las fases a partir de ahora.

## Las referencias visuales son punto de partida, no especificación

Los prototipos anteriores de Pangloss (capturas Base44/Bolt estudiadas en la Fase 1)
transmiten carácter editorial, sobriedad, paleta y tipografía — no un diseño final que
haya que reproducir literalmente. Se hicieron sin experiencia profesional de diseño.

La pregunta correcta ante cualquier elemento del prototipo no es "¿así estaba?" sino
"¿qué sensación buscaba conseguir esto, y cuál es hoy la mejor forma de lograrla?".
Si una solución concreta (un header, la composición de una tarjeta de artículo, un
patrón de navegación, una tabla del panel) puede resolverse de forma más elegante,
moderna o usable, se cambia — sin esperar a que se pida — siempre que el resultado siga
respetando la filosofía de abajo.

**Excepción:** el logotipo (`public/logo.svg`) sí es fiel de forma literal a la
ilustración original — ese bloqueo es específico y aparte, y sigue vigente.

## La sensación

Minimalista, pero no vacío. Elegante, pero no frío. Intelectual, pero no pretencioso.
Moderno, pero no dependiente de modas. Con personalidad, pero no infantil. Editorial,
cálido, sobrio, contemporáneo.

No: plantilla de blog, web universitaria genérica, dashboard SaaS, landing hecha con IA,
efectos porque sí. Nada de gradientes decorativos, glassmorphism, blobs, sombras
pesadas, exceso de cards o animación espectacular.

La calidad vive en las proporciones, la tipografía, el espacio, la jerarquía, el ritmo
de las interacciones y los detalles pequeños — no en añadir elementos.

## La pregunta que decide cada detalle

> ¿Esto hace que Pangloss sea mejor, o simplemente hace que tenga más cosas?

Si solo añade, no entra. Si mejora la lectura, la comprensión, la navegación o la
identidad, adelante — incluso si implica quitar o simplificar algo ya construido.

## Cómo se aplica al construir cada pantalla

Antes de dar por terminada cualquier pantalla o componente, preguntarse:
¿esto podría sentirse más editorial? ¿esta interacción podría ser más elegante?
¿hay algo aquí que parezca genérico? ¿este estado (loading / error / vacío) tiene
tanto cuidado como el estado "feliz"? ¿hay una oportunidad de personalidad aquí que
no sea forzada? ¿hay algo que sobra?

Esto no se pide caso por caso — se aplica por defecto en cada fase (4, 5, 6…), sin
esperar a que se señale explícitamente.

## Líneas rojas que nunca ceden ante la estética

Accesibilidad, rendimiento, legibilidad, comportamiento responsive y usabilidad van
antes que cualquier efecto visual. Toda animación (incluido un eventual cursor
personalizado) respeta `prefers-reduced-motion` y nunca interfiere con la navegación.

## Fase de auditoría

Cuando el producto esté funcional (tras la Fase 7 de testing, antes de GitHub/Netlify),
hay una fase dedicada exclusivamente a recorrer **toda** la aplicación — pública y
privada — y corregir lo que se sienta genérico o poco pulido: consistencia visual,
tipografía, espaciado, jerarquía, responsive, estados, hover, focus, transiciones,
microinteracciones, experiencia de lectura y de escritura, identidad. No es solo
comprobar que funciona.
