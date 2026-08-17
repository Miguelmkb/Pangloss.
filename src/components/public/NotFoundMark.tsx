/**
 * Gesto visual compartido para los estados donde algo, literalmente, no se
 * ha encontrado: 404, búsqueda sin resultados, categoría/autor/artículo
 * que no existen. Deliberadamente NO se usa en los estados de "todavía no
 * hay nada publicado" (portada vacía, sin autores, categoría sin
 * artículos aún) — ahí el tono es "está por venir", y un gesto de negación
 * contradiría el propio mensaje.
 *
 * Grande a propósito — es la ilustración protagonista del estado, no un
 * icono de apoyo. El alto crece por breakpoint (no un porcentaje del
 * viewport) para poder acotar el máximo con precisión en cada tamaño de
 * pantalla: ~3× el tamaño original en móvil (más no cabe sin desbordar un
 * viewport de 375px dado el ancho de la ilustración) y ~5.7× en escritorio,
 * donde el contenedor (680px, `max-w-editorial`) sí tiene sitio de sobra.
 * `w-auto` conserva la proporción real del archivo en todo momento — nunca
 * se deforma ni se pixela por estirarlo fuera de proporción.
 *
 * Un único componente: si el día de mañana cambia el gif, se cambia aquí
 * una vez y se actualiza en los cinco sitios a la vez.
 *
 * `aria-hidden`: es un refuerzo visual del mensaje que ya dan el título y
 * la descripción de al lado, no información nueva — no debe anunciarse
 * aparte a un lector de pantalla.
 */
export function NotFoundMark() {
  return (
    <div className="flex justify-center mb-8 not-found-mark-in" aria-hidden="true">
      <img src="/busto-negando.gif" alt="" className="h-[170px] sm:h-[320px] w-auto opacity-80" />
    </div>
  );
}
