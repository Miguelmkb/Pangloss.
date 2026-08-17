/**
 * Gesto visual compartido para los estados donde algo, literalmente, no se
 * ha encontrado: 404, búsqueda sin resultados, categoría/autor/artículo
 * que no existen. Deliberadamente NO se usa en los estados de "todavía no
 * hay nada publicado" (portada vacía, sin autores, categoría sin
 * artículos aún) — ahí el tono es "está por venir", y un gesto de negación
 * contradiría el propio mensaje.
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
    <div className="flex justify-center mb-7 not-found-mark-in" aria-hidden="true">
      <img src="/busto-negando.gif" alt="" className="h-14 w-auto opacity-80" />
    </div>
  );
}
