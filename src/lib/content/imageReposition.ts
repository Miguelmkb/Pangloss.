import type { Node as PMNode } from '@tiptap/pm/model';
import type { EditorState, Transaction } from '@tiptap/pm/state';

/**
 * Dado un documento y una posición cualquiera, decide dónde ancla
 * realmente una imagen soltada ahí: en mitad de un párrafo normal se
 * parte por ese punto exacto (`willSplit: true`); en cualquier otro bloque
 * de texto (título, párrafo justo en un extremo, contenido de una cita…)
 * se ancla antes o después de él entero; y si ya es un límite de bloque,
 * se usa tal cual. Es la misma regla tanto para la vista previa en vivo
 * (mientras se arrastra, sobre el documento actual) como para el
 * movimiento real (`buildImageMoveTransaction`, sobre el documento ya sin
 * la imagen) — así lo que se previsualiza es exactamente lo que ocurre al
 * soltar.
 */
export function resolveDropInsertion(doc: PMNode, pos: number): { insertPos: number; willSplit: boolean } {
  const $pos = doc.resolve(pos);
  const parent = $pos.parent;
  if (parent.type.name === 'paragraph' && $pos.parentOffset > 0 && $pos.parentOffset < parent.content.size) {
    return { insertPos: pos, willSplit: true };
  }
  if (parent.isTextblock) {
    const insertPos = $pos.parentOffset <= parent.content.size / 2 ? $pos.before() : $pos.after();
    return { insertPos, willSplit: false };
  }
  return { insertPos: pos, willSplit: false };
}

/**
 * Construye (sin despachar) la transacción que traslada el nodo de imagen
 * en `imagePos` hasta el punto de documento `rawDropPos` — partiendo un
 * párrafo de texto normal en dos si el punto de soltado cae en mitad de
 * uno, para que la imagen quede anclada entre ambos fragmentos.
 *
 * SOLO usa primitivas de ProseMirror de primera clase, ya probadas y
 * estables — nada de esto es un hack:
 *  - `state.doc.resolve` / `ResolvedPos.before()/.after()` para razonar
 *    sobre los límites de bloque, exactamente como hace ProseMirror
 *    internamente en cada operación de edición.
 *  - `Transform.split()` — la misma operación que usa la tecla Enter para
 *    partir un párrafo por el cursor. No toca marcas (`bold`, `italic`,
 *    enlaces…): cada mitad del texto conserva las suyas intactas, porque
 *    partir un `Fragment` por un punto no reescribe su contenido, solo lo
 *    corta ahí.
 *  - `tr.mapping.map(...)` para que cada posición usada después de un paso
 *    (el `delete` inicial, el `split`) sea la correcta en el documento ya
 *    modificado por el paso anterior — así es como CUALQUIER transformación
 *    de ProseMirror con varios pasos se encadena correctamente.
 *
 * ALCANCE DELIBERADAMENTE ACOTADO — solo se parte un párrafo de texto
 * normal (`paragraph`). Un título, una cita, un elemento de lista o
 * cualquier otro bloque de texto NUNCA se parte — la imagen se ancla antes
 * o después de él entero (lo que quede más cerca del punto de soltado).
 * Partir un título en dos, por ejemplo, sería un resultado editorial raro
 * que nadie pidió; y algunos contenidos anidados (listas, citas) pueden
 * tener restricciones de esquema que ni siquiera permiten un bloque de
 * imagen ahí — de ahí también el `try/catch` de `moveImageAt`, que
 * convierte cualquier violación de esquema en "no hacer nada" en vez de
 * un fallo o un documento corrupto.
 *
 * Una nota de fondo (no es una limitación de este código, es una decisión
 * de diseño): si la imagen ya estaba partiendo un párrafo en dos y se
 * mueve a otro sitio, esas dos mitades NO se recomponen automáticamente en
 * un único párrafo — igual que un editor de texto no fusiona dos párrafos
 * al mover un objeto anclado que había entre ellos. Fusionar marcaría con
 * qué párrafo "se queda" el resto de atributos (alineación, por ejemplo) de
 * forma arbitraria; separar es el comportamiento predecible.
 *
 * Devuelve `null` si no hay ningún movimiento real que hacer (soltar sobre
 * la propia imagen o justo en su mismo sitio).
 */
export function buildImageMoveTransaction(state: EditorState, imagePos: number, rawDropPos: number): Transaction | null {
  const imageNode = state.doc.nodeAt(imagePos);
  if (!imageNode) return null;
  const imageEnd = imagePos + imageNode.nodeSize;

  // Soltar dentro de (o justo pegado a) la propia imagen no es un
  // movimiento real.
  if (rawDropPos >= imagePos && rawDropPos <= imageEnd) return null;

  const tr = state.tr;
  tr.delete(imagePos, imageEnd);

  const dropPos = tr.mapping.map(rawDropPos);
  const target = resolveDropInsertion(tr.doc, dropPos);
  let insertPos = target.insertPos;
  if (target.willSplit) {
    tr.split(dropPos);
    // OJO: `tr.mapping.map(dropPos)` tras el `split` no da el hueco EXACTO
    // entre los dos párrafos resultantes — con la asociación por defecto
    // cae DENTRO del segundo párrafo (justo tras su token de apertura), no
    // entre ambos. Insertar ahí un nodo de bloque fuerza a ProseMirror a
    // fabricar un párrafo vacío de más para poder encajarlo (verificado
    // empíricamente). La forma correcta — resolver esa posición y pedir el
    // límite `.before()` de su bloque contenedor — da el hueco real entre
    // los dos párrafos, sin ningún nodo espurio.
    const mapped = tr.mapping.map(dropPos);
    insertPos = tr.doc.resolve(mapped).before();
  }

  tr.insert(insertPos, imageNode.type.create(imageNode.attrs));

  // Comparación estructural completa: si el documento resultante es
  // idéntico al original (soltar donde ya estaba, p. ej.), no hay nada que
  // despachar — evita ensuciar el historial de deshacer con no-ops.
  if (tr.doc.eq(state.doc)) return null;

  return tr;
}

/**
 * Envoltorio seguro: construye y despacha la transacción, o no hace nada
 * si el punto de soltado no da lugar a una posición válida según el
 * esquema (ver el comentario de `buildImageMoveTransaction`) — nunca deja
 * el documento a medias ni propaga una excepción hacia la UI.
 */
export function moveImageAt(state: EditorState, dispatch: (tr: Transaction) => void, imagePos: number, rawDropPos: number): boolean {
  try {
    const tr = buildImageMoveTransaction(state, imagePos, rawDropPos);
    if (!tr) return false;
    dispatch(tr);
    return true;
  } catch {
    return false;
  }
}
