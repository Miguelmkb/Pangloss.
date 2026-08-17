import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Trash2, ImagePlus, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createDraftArticle, getArticleByIdAdmin, setArticleStatus, deleteArticle } from '@/lib/services/articles.admin';
import { getAllAuthorsAdmin } from '@/lib/services/authors.admin';
import { getCategories } from '@/lib/services/categories';
import { uploadPublicImage } from '@/lib/services/storage';
import { useAutosave, readLocalDraft, type ArticleSavePatch } from '@/hooks/useAutosave';
import type { Article, ArticleStatus, Author, Category } from '@/types/database';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SaveStatusIndicator } from '@/components/editor/SaveStatusIndicator';
import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { ReferencesPanel } from '@/components/editor/ReferencesPanel';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { slugify } from '@/lib/utils';
import { estimateReadingMinutes } from '@/lib/content/readingTime';
import { triggerArticleNotification } from '@/lib/services/subscriptions';

export function ArticleEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isEditor } = useAuth();
  const { showToast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [initialContent, setInitialContent] = useState<unknown>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const featuredInputRef = useRef<HTMLInputElement>(null);
  // El contenido del editor no se guarda en el estado de React en cada
  // pulsación (por rendimiento — ver el onChange de ArticleEditor más
  // abajo), así que esta ref es la única forma fiable de tener a mano "el
  // contenido tal y como está ahora mismo" para el botón "Usar automático".
  const latestContentRef = useRef<unknown>(null);

  // Rastro de un "Nuevo artículo" abandonado sin escribir nada: `isNewRef`
  // recuerda que esta sesión empezó sin id en la URL (durante toda la vida
  // del componente, aunque la URL cambie después al navegar al borrador
  // recién creado); `hasContentRef` se activa en el primer cambio real del
  // usuario (título, subtítulo, contenido, categoría…). Si se sale sin que
  // ninguno de los dos se active, el borrador vacío se borra solo — nunca
  // debe quedar un "artículo" fantasma en los listados por haber entrado y
  // salido sin escribir nada.
  const isNewRef = useRef(!id);
  const hasContentRef = useRef(false);
  const createdIdRef = useRef<string | null>(null);
  const creatingRef = useRef(false);

  // "Nuevo artículo": la fila se crea al abrir el editor, no al terminar de
  // escribir — así el autoguardado siempre tiene un id y una versión reales.
  // `creatingRef` evita que StrictMode (que en desarrollo invoca los efectos
  // dos veces a propósito) cree dos borradores por un solo clic.
  useEffect(() => {
    if (id || !user || creatingRef.current) return;
    creatingRef.current = true;
    createDraftArticle(user.id).then((a) => {
      createdIdRef.current = a.id;
      navigate(`/admin/articulos/${a.id}/editar`, { replace: true });
    });
  }, [id, user, navigate]);

  // Al desmontar (el usuario navega a otro sitio del panel): si esta sesión
  // creó un borrador nuevo y nunca se escribió nada en él, se elimina —
  // silencioso, sin toast, porque desde el punto de vista del usuario nunca
  // llegó a existir de verdad.
  useEffect(() => {
    return () => {
      // Refs de datos, no de nodo DOM — no los vacía React, así que su
      // valor en el momento de esta limpieza es de fiar.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (isNewRef.current && !hasContentRef.current && createdIdRef.current) {
        deleteArticle(createdIdRef.current).catch(() => {
          /* si falla, se queda un borrador vacío — no crítico, no hay nada más que hacer aquí */
        });
      }
    };
  }, []);

  const autosave = useAutosave(id ?? '', article?.version ?? null);

  useEffect(() => {
    if (!id) return;
    getArticleByIdAdmin(id).then((a) => {
      if (!a) return;
      // Recuperación: si hay una copia local sin confirmar guardar en el
      // servidor (versión igual o más nueva que la que trae el servidor),
      // se usa como punto de partida en vez de silenciosamente descartarla.
      const draft = readLocalDraft(id);
      if (draft && draft.version >= a.version) {
        const { version: draftVersion, savedAt: draftSavedAt, ...recoveredPatch } = draft;
        void draftVersion;
        void draftSavedAt;
        // `a.version` (la real, del servidor) es el punto de partida — no
        // `draft.version`, que puede haber quedado desfasada si el servidor
        // avanzó por otra vía (p. ej. un cambio de estado) tras el último
        // guardado local confirmado.
        setArticle({ ...a, ...recoveredPatch, content: recoveredPatch.content ?? a.content });
        setInitialContent(recoveredPatch.content ?? a.content);
        latestContentRef.current = recoveredPatch.content ?? a.content;
        showToast('Se recuperaron cambios que no llegaron a guardarse.', 'error');
        // No basta con mostrarlos en pantalla: hay que reprogramar el mismo
        // parche para que el autoguardado lo escriba de verdad en el
        // servidor — si no, quedaría solo visible hasta el próximo cambio
        // manual, y se perdería otra vez sin avisar.
        autosave.schedule(recoveredPatch);
      } else {
        setArticle(a);
        setInitialContent(a.content);
        latestContentRef.current = a.content;
      }
    });
    // `autosave.schedule` (no el objeto `autosave` entero, como sugeriría la
    // regla) es la única pieza estable que este efecto necesita — depender
    // del objeto completo lo re-ejecutaría en cada cambio de `status` o
    // `savedAt`, es decir, en cada autoguardado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, showToast, autosave.schedule]);

  useEffect(() => {
    Promise.all([getAllAuthorsAdmin(), getCategories()]).then(([a, c]) => {
      setAuthors(a);
      setCategories(c);
    });
  }, []);

  function patch(p: ArticleSavePatch, local: Partial<Article>) {
    if (!article) return;
    hasContentRef.current = true;
    setArticle({ ...article, ...local });
    autosave.schedule(p);
  }

  /** Vuelve al cálculo automático, recalculado con el contenido actual —
   * para cuando un editor había corregido el número a mano y luego decide
   * que prefiere que Pangloss lo estime de nuevo. */
  function resetReadingTimeToAuto() {
    const minutes = estimateReadingMinutes(latestContentRef.current);
    patch({ reading_time_minutes: minutes, reading_time_auto: true }, { reading_time_minutes: minutes, reading_time_auto: true });
  }

  async function handleStatusChange(status: ArticleStatus) {
    if (!article) return;
    try {
      if (status === 'published' && !article.slug) {
        const slug = slugify(article.title || 'articulo');
        autosave.schedule({ slug });
        setArticle((prev) => (prev ? { ...prev, slug } : prev));
        // Si esto falla (red, conflicto de versión…) no hay que seguir: antes
        // se publicaba igualmente y el artículo quedaba "publicado" sin slug
        // — inalcanzable desde la web pública — con el resto de cambios
        // pendientes en ese momento (incluidas imágenes recién insertadas)
        // silenciosamente descartados.
        const saved = await autosave.flush();
        if (!saved) {
          showToast('No se pudo guardar el enlace del artículo. Comprueba la conexión e inténtalo de nuevo antes de publicar.', 'error');
          return;
        }
      }
      const { version } = await setArticleStatus(article.id, status);
      autosave.syncVersion(version);
      // `article.notified_at` es el de ANTES de esta actualización: si ya
      // estaba puesto, este artículo ya avisó a los suscriptores alguna
      // vez (aunque se haya despublicado y publicado de nuevo después) y
      // no se vuelve a avisar. La función de Netlify repite esta misma
      // comprobación por su cuenta, así que esto es solo para no llamarla
      // de más — nunca la única barrera real.
      if (status === 'published' && !article.notified_at) {
        void triggerArticleNotification(article.id);
      }
      setArticle((prev) => (prev ? { ...prev, status, version } : prev));
      showToast(status === 'published' ? 'Artículo publicado.' : 'Estado actualizado.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar.', 'error');
    }
  }

  async function handleDelete() {
    if (!article) return;
    await deleteArticle(article.id);
    showToast('Artículo eliminado.');
    navigate('/admin/mis-articulos', { replace: true });
  }

  async function handleFeaturedImage(file: File | undefined) {
    if (!file || !article) return;
    setUploadingFeatured(true);
    try {
      const { url } = await uploadPublicImage('article-images', article.id, file);
      patch({ featured_image_url: url }, { featured_image_url: url });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir la imagen.', 'error');
    } finally {
      setUploadingFeatured(false);
    }
  }

  if (!article) return null;

  const isOwner = article.user_id === user?.id;
  const canPublish = isEditor;
  const canSendToReview = article.status === 'draft' && (isOwner || isEditor);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin/mis-articulos" className="inline-flex items-center gap-1.5 text-sm font-sans text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <SaveStatusIndicator status={autosave.status} savedAt={autosave.savedAt} />
      </div>

      {autosave.status === 'conflict' && (
        <div className="mb-6 border border-accent bg-accent-light px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm font-sans text-accent">
            No se pudo guardar el último cambio. Puede que el artículo se haya modificado en otra sesión, o que su estado
            ya no permita editarlo. Recarga para comprobarlo — tus últimos cambios siguen a salvo en este navegador.
          </p>
          <button onClick={() => window.location.reload()} className="text-xs font-sans uppercase tracking-widest bg-accent text-white px-3 py-1.5 flex-shrink-0">
            Recargar
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-10">
        <div className="min-w-0">
          <input
            value={article.title}
            onChange={(e) => patch({ title: e.target.value }, { title: e.target.value })}
            placeholder="Sin título"
            className="w-full font-serif text-4xl font-semibold text-text-primary placeholder:text-text-muted outline-none mb-3 bg-transparent"
          />
          <input
            value={article.subtitle ?? ''}
            onChange={(e) => patch({ subtitle: e.target.value }, { subtitle: e.target.value })}
            placeholder="Subtítulo"
            className="w-full font-sans text-lg text-text-secondary placeholder:text-text-muted outline-none mb-8 bg-transparent"
          />

          <ArticleEditor
            articleId={article.id}
            initialContent={initialContent}
            onChange={(json) => {
              hasContentRef.current = true;
              latestContentRef.current = json;
              // Automático por defecto: cada cambio de contenido recalcula
              // el tiempo de lectura, salvo que un editor ya lo haya
              // corregido a mano para este artículo (reading_time_auto en
              // false) — en ese caso seguir escribiendo no debe pisar el
              // número que ha decidido dejar.
              if (article.reading_time_auto) {
                const minutes = estimateReadingMinutes(json);
                setArticle((prev) => (prev ? { ...prev, reading_time_minutes: minutes } : prev));
                autosave.schedule({ content: json, reading_time_minutes: minutes });
              } else {
                autosave.schedule({ content: json });
              }
            }}
          />
        </div>

        <aside className="space-y-6">
          <div className="border border-border p-5">
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">Publicación</p>
            <div className="mb-4">
              <StatusBadge status={article.status} />
            </div>
            <div className="space-y-2">
              {canSendToReview && <ActionButton label="Enviar a revisión" onClick={() => handleStatusChange('in_review')} />}
              {canPublish && article.status !== 'published' && <ActionButton label="Publicar" primary onClick={() => handleStatusChange('published')} />}
              {canPublish && article.status === 'published' && <ActionButton label="Despublicar" onClick={() => handleStatusChange('draft')} />}
              {canPublish && article.status !== 'archived' && article.status !== 'draft' && (
                <ActionButton label="Archivar" onClick={() => handleStatusChange('archived')} />
              )}
            </div>
            {article.status === 'published' && article.slug && (
              <a href={`/articulo/${article.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-sans text-accent hover:text-accent-hover transition-colors mt-4">
                <ExternalLink className="w-3.5 h-3.5" /> Ver en el sitio
              </a>
            )}
          </div>

          <div className="border border-border p-5 space-y-4">
            <label className="block">
              <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Autor</span>
              <select
                value={article.author_id ?? ''}
                onChange={(e) => patch({ author_id: e.target.value || null }, { author_id: e.target.value || null })}
                className="mt-1.5 w-full border border-border px-2.5 py-2 text-sm font-sans outline-none focus:border-text-primary"
              >
                <option value="">— Sin asignar —</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Categoría</span>
              <select
                value={article.category_id ?? ''}
                onChange={(e) => patch({ category_id: e.target.value || null }, { category_id: e.target.value || null })}
                className="mt-1.5 w-full border border-border px-2.5 py-2 text-sm font-sans outline-none focus:border-text-primary"
              >
                <option value="">— Sin categoría —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-sans uppercase tracking-widest text-text-muted">Tiempo de lectura (min)</span>
                {article.reading_time_auto ? (
                  <span className="text-[11px] font-sans text-text-muted flex-shrink-0">Automático</span>
                ) : (
                  <button
                    type="button"
                    onClick={resetReadingTimeToAuto}
                    className="inline-flex items-center gap-1 text-[11px] font-sans text-text-muted hover:text-accent transition-colors flex-shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Usar automático
                  </button>
                )}
              </div>
              <input
                type="number"
                min={1}
                value={article.reading_time_minutes}
                onChange={(e) => {
                  const minutes = Math.max(1, Number(e.target.value) || 1);
                  // Un editor corrigiendo el número a mano es la señal de
                  // que Pangloss se ha equivocado esta vez — a partir de
                  // aquí deja de recalcularlo solo hasta que se pida
                  // explícitamente "Usar automático" otra vez.
                  patch({ reading_time_minutes: minutes, reading_time_auto: false }, { reading_time_minutes: minutes, reading_time_auto: false });
                }}
                className="mt-1.5 w-24 border border-border px-2.5 py-2 text-sm font-sans outline-none focus:border-text-primary"
              />
            </label>
          </div>

          <div className="border border-border p-5">
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">Imagen principal</p>
            <p className="text-[11px] font-sans text-text-muted mb-3 leading-relaxed">
              Se usa como miniatura en los listados (portada, categorías, autor) — no se inserta automáticamente dentro
              del artículo. Si quieres una imagen al principio del texto, insértala tú desde el editor.
            </p>
            {article.featured_image_url ? (
              <img src={article.featured_image_url} alt="" className="w-full aspect-video object-cover rounded-sm mb-3" />
            ) : (
              <button
                onClick={() => featuredInputRef.current?.click()}
                disabled={uploadingFeatured}
                className="w-full aspect-video border border-dashed border-border rounded-sm flex flex-col items-center justify-center gap-2 text-text-muted hover:border-text-primary hover:text-text-primary transition-colors mb-3"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs font-sans">{uploadingFeatured ? 'Subiendo…' : 'Subir imagen'}</span>
              </button>
            )}
            {article.featured_image_url && (
              <button onClick={() => featuredInputRef.current?.click()} className="text-xs font-sans text-accent hover:text-accent-hover transition-colors mb-3">
                Cambiar imagen
              </button>
            )}
            <input ref={featuredInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFeaturedImage(e.target.files?.[0])} />
            <input
              value={article.featured_image_alt ?? ''}
              onChange={(e) => patch({ featured_image_alt: e.target.value }, { featured_image_alt: e.target.value })}
              placeholder="Texto alternativo"
              className="w-full border border-border px-2.5 py-1.5 text-xs font-sans outline-none focus:border-text-primary mb-2"
            />
            <input
              value={article.featured_image_caption ?? ''}
              onChange={(e) => patch({ featured_image_caption: e.target.value }, { featured_image_caption: e.target.value })}
              placeholder="Pie de imagen"
              className="w-full border border-border px-2.5 py-1.5 text-xs font-sans outline-none focus:border-text-primary"
            />
          </div>

          <div className="border border-border p-5 space-y-3">
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted">SEO</p>
            <input
              value={article.seo_title ?? ''}
              onChange={(e) => patch({ seo_title: e.target.value }, { seo_title: e.target.value })}
              placeholder="Título SEO (opcional)"
              className="w-full border border-border px-2.5 py-1.5 text-xs font-sans outline-none focus:border-text-primary"
            />
            <textarea
              value={article.seo_description ?? ''}
              onChange={(e) => patch({ seo_description: e.target.value }, { seo_description: e.target.value })}
              placeholder="Meta descripción (opcional)"
              rows={2}
              className="w-full border border-border px-2.5 py-1.5 text-xs font-sans outline-none focus:border-text-primary resize-none"
            />
          </div>

          <div className="border border-border p-5">
            <p className="text-xs font-sans uppercase tracking-widest text-text-muted mb-3">PDF descargable</p>
            <input
              value={article.pdf_url ?? ''}
              onChange={(e) => patch({ pdf_url: e.target.value }, { pdf_url: e.target.value })}
              placeholder="https://drive.google.com/…"
              className="w-full border border-border px-2.5 py-1.5 text-xs font-sans outline-none focus:border-text-primary"
            />
            <p className="text-[11px] font-sans text-text-muted mt-1.5 leading-relaxed">
              Si lo rellenas, en la página del artículo aparecerá un botón para descargarlo.
            </p>
          </div>

          <ReferencesPanel articleId={article.id} />

          <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-xs font-sans text-text-muted hover:text-accent transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar artículo
          </button>
        </aside>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar artículo"
          description="Se eliminará permanentemente. Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function ActionButton({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-2 text-sm font-sans uppercase tracking-widest transition-colors ${
        primary ? 'bg-text-primary text-white hover:bg-accent' : 'border border-border text-text-secondary hover:border-text-primary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );
}
