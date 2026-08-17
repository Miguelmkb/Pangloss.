/**
 * Estimación automática del tiempo de lectura a partir del documento Tiptap
 * (jsonb) del artículo — mismo árbol de nodos que `renderArticleContent.tsx`,
 * pero aquí solo interesa el texto, no cómo se pinta.
 *
 * 200 palabras/minuto es la cifra habitual para una lectura pausada en
 * español (más conservadora que las ~250-265 wpm que se usan a veces para
 * inglés) — coherente con el tono de Pangloss ("la profundidad del análisis
 * pausado", ver /sobre).
 */
const WORDS_PER_MINUTE = 200;

interface CountableNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: CountableNode[];
}

function countWordsInText(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

/** Cuenta las palabras de todo el texto legible del documento — párrafos,
 * títulos, citas, listas… y también el texto de las notas al pie (`type:
 * "footnote"`, guardado en `attrs.text`, no como hijos del nodo), porque es
 * contenido que el lector efectivamente lee. No cuenta metadatos como URLs
 * de enlaces o textos alternativos de imagen. */
export function countWords(doc: unknown): number {
  let words = 0;

  function walk(node: CountableNode) {
    if (typeof node.text === 'string') words += countWordsInText(node.text);
    if (node.type === 'footnote' && typeof node.attrs?.text === 'string') {
      words += countWordsInText(node.attrs.text);
    }
    node.content?.forEach(walk);
  }

  if (doc && typeof doc === 'object') walk(doc as CountableNode);
  return words;
}

/** Redondeado al minuto, con un mínimo de 1 — nunca "0 min de lectura". */
export function estimateReadingMinutes(doc: unknown): number {
  return Math.max(1, Math.round(countWords(doc) / WORDS_PER_MINUTE));
}
