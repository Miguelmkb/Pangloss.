import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { computeFigureLayout, imageOffsetYPx, type ResizableImageAttrs } from './imageAttrs';
import { FootnoteMarker } from '@/components/public/FootnoteMarker';

/**
 * Renderiza el documento Tiptap (jsonb) del artículo como JSX de solo
 * lectura. A propósito NO se monta un editor Tiptap/ProseMirror en el sitio
 * público: el lector no necesita cargar el motor de edición para leer, solo
 * el árbol de nodos ya guardado. El esquema de nodos aquí es el contrato
 * compartido con el editor que se construye en la Fase 6 — si allí cambia,
 * este renderer se actualiza en paralelo.
 */
export interface ContentNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

export interface Footnote {
  id: string;
  number: number;
  text: string;
}

export function extractFootnotes(doc: ContentNode | null | undefined): Footnote[] {
  const footnotes: Footnote[] = [];
  let n = 0;
  function walk(node: ContentNode) {
    if (node.type === 'footnote') {
      n += 1;
      footnotes.push({ id: String(node.attrs?.id ?? n), number: n, text: String(node.attrs?.text ?? '') });
    }
    node.content?.forEach(walk);
  }
  if (doc) walk(doc);
  return footnotes;
}

/**
 * fontFamily / fontSize / color no son marcas propias: en Tiptap viajan
 * como atributos de la marca `textStyle` (así es como la propia librería
 * modela el "estilo de fuente" de un tramo de texto). Si un renderer no
 * mira dentro de `textStyle`, esos tres formatos simplemente desaparecen
 * aunque estén guardados — es justo lo que pasaba aquí.
 */
function textStyleFromMark(attrs: Record<string, unknown> | undefined): CSSProperties | null {
  if (!attrs) return null;
  const style: CSSProperties = {};
  if (typeof attrs.fontFamily === 'string' && attrs.fontFamily) style.fontFamily = attrs.fontFamily;
  if (typeof attrs.fontSize === 'string' && attrs.fontSize) style.fontSize = attrs.fontSize;
  if (typeof attrs.color === 'string' && attrs.color) style.color = attrs.color;
  return Object.keys(style).length > 0 ? style : null;
}

function renderTextNode(node: ContentNode, key: string): ReactNode {
  let el: ReactNode = node.text ?? '';
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') el = <strong>{el}</strong>;
    else if (mark.type === 'italic') el = <em>{el}</em>;
    else if (mark.type === 'underline') el = <u>{el}</u>;
    else if (mark.type === 'link') {
      const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '#';
      el = (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {el}
        </a>
      );
    } else if (mark.type === 'textStyle') {
      const style = textStyleFromMark(mark.attrs);
      if (style) el = <span style={style}>{el}</span>;
    }
  }
  return <Fragment key={key}>{el}</Fragment>;
}

/** `textAlign` y `lineHeight` son atributos del propio nodo de bloque
 * (párrafo/título), no marcas de texto — se leen y aplican aparte. */
function blockStyle(attrs: Record<string, unknown> | undefined): CSSProperties | undefined {
  if (!attrs) return undefined;
  const style: CSSProperties = {};
  if (typeof attrs.textAlign === 'string' && attrs.textAlign && attrs.textAlign !== 'left') {
    style.textAlign = attrs.textAlign as CSSProperties['textAlign'];
  }
  if (typeof attrs.lineHeight === 'string' && attrs.lineHeight) {
    style.lineHeight = attrs.lineHeight;
  }
  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * Aparición muy sutil la primera vez que la imagen entra en el viewport
 * (opacidad + unos pocos px, una sola vez, nunca al volver a pasar por
 * encima). Se desactiva por completo con `prefers-reduced-motion`.
 */
function ArticleImageNode({ attrs }: { attrs: Record<string, unknown> }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const src = typeof attrs.src === 'string' ? attrs.src : '';
  if (!src) return null;
  const alt = typeof attrs.alt === 'string' ? attrs.alt : '';
  const caption = typeof attrs.caption === 'string' ? attrs.caption : '';
  const align = attrs.align === 'left' || attrs.align === 'right' ? attrs.align : 'center';
  const wrap = Boolean(attrs.wrap) && align !== 'center';
  const offsetYPx = imageOffsetYPx(attrs as Partial<ResizableImageAttrs>);
  // El desplazamiento visual se pasa como custom property, no como
  // `transform` directo: `.article-figure` ya tiene su propia animación de
  // aparición basada en `transform` (ver index.css) — asignarlo aquí a
  // secas la pisaría en vez de combinarse con ella.
  const figureStyle: CSSProperties = {
    ...computeFigureLayout(attrs as Partial<ResizableImageAttrs>),
    ...(offsetYPx ? ({ '--figure-nudge-y': `${offsetYPx}px` } as CSSProperties) : {}),
  };
  const className = [wrap ? 'article-figure article-figure-wrap' : 'article-figure', visible && 'is-visible']
    .filter(Boolean)
    .join(' ');

  return (
    <figure ref={ref} className={className} style={figureStyle}>
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function renderNode(node: ContentNode, footnoteNumbers: Map<string, number>, key: string): ReactNode {
  const children = (node.content ?? []).map((child, i) =>
    child.type === 'text' ? renderTextNode(child, `${key}-${i}`) : renderNode(child, footnoteNumbers, `${key}-${i}`),
  );

  switch (node.type) {
    case 'doc':
      return <Fragment key={key}>{children}</Fragment>;
    case 'paragraph':
      return (
        <p key={key} style={blockStyle(node.attrs)}>
          {children}
        </p>
      );
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 1), 3);
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
      return (
        <Tag key={key} style={blockStyle(node.attrs)}>
          {children}
        </Tag>
      );
    }
    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'orderedList':
      return <ol key={key}>{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;
    case 'horizontalRule':
      return <hr key={key} />;
    case 'hardBreak':
      return <br key={key} />;
    case 'resizableImage':
    case 'image':
      return <ArticleImageNode key={key} attrs={node.attrs ?? {}} />;
    case 'footnote': {
      const id = String(node.attrs?.id ?? '');
      const text = String(node.attrs?.text ?? '');
      const number = footnoteNumbers.get(id);
      return <FootnoteMarker key={key} id={id} number={number} text={text} />;
    }
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
}

export function ArticleContent({ content }: { content: unknown }) {
  const doc = content as ContentNode | null | undefined;
  if (!doc || doc.type !== 'doc' || !doc.content?.length) return null;

  const footnotes = extractFootnotes(doc);
  const footnoteNumbers = new Map(footnotes.map((f) => [f.id, f.number]));

  return (
    <>
      <div className="prose-pangloss">{renderNode(doc, footnoteNumbers, 'root')}</div>
      {footnotes.length > 0 && (
        <aside className="article-footnotes">
          <p className="article-footnotes-title">Notas</p>
          <ol>
            {footnotes.map((f) => (
              <li key={f.id} id={`nota-${f.id}`}>
                {f.text}{' '}
                <a href={`#ref-${f.id}`} aria-label="Volver al texto" className="footnote-back">
                  ↩
                </a>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </>
  );
}
