import { useMemo, useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useSiteContentAdmin } from '@/context/SiteContentContext';
import { SITE_CONTENT_FIELDS, SITE_CONTENT_GROUP_ORDER, type SiteContentField } from '@/lib/siteContent/manifest';

/**
 * /admin/contenido — editorial del texto público de Pangloss, sin tocar
 * código. Solo administradores (verificado también por ruta en App.tsx y
 * por RLS en la base de datos: un editor o colaborador que escriba la URL
 * a mano no puede ni ver ni guardar nada aquí).
 *
 * Cada campo es su propio mini-formulario: no hay un botón "Guardar todo"
 * — guardas exactamente el texto que has tocado, nada más, y ves de
 * inmediato que se ha guardado. Deliberadamente sin editor de HTML: los
 * campos son texto plano, así que no hay forma de romper el diseño desde
 * aquí, solo de cambiar qué dice.
 */
export function AdminContentPage() {
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const filteredFields = useMemo(() => {
    if (!normalizedSearch) return SITE_CONTENT_FIELDS;
    return SITE_CONTENT_FIELDS.filter(
      (f) =>
        f.label.toLowerCase().includes(normalizedSearch) ||
        f.description.toLowerCase().includes(normalizedSearch) ||
        f.defaultValue.toLowerCase().includes(normalizedSearch) ||
        f.group.toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch]);

  const fieldsByGroup = useMemo(() => {
    const map = new Map<string, SiteContentField[]>();
    for (const field of filteredFields) {
      if (!map.has(field.group)) map.set(field.group, []);
      map.get(field.group)!.push(field);
    }
    return map;
  }, [filteredFields]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl font-semibold text-text-primary mb-1">Contenido del sitio</h1>
      <p className="text-sm font-sans text-text-secondary mb-3">
        Los textos públicos de Pangloss — navegación, portada, footer, y cada mensaje de estado. Cambiar el diseño o el
        comportamiento de la web no es posible desde aquí: solo qué dice.
      </p>
      <p className="text-xs font-sans text-text-muted mb-8 border-l-2 border-border pl-3">
        Los cambios se aplican al sitio público inmediatamente después de guardar.
      </p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar un texto, por ejemplo «suscripción» o «404»…"
        className="w-full border border-border px-3 py-2.5 text-sm font-sans outline-none focus:border-text-primary mb-8"
      />

      {filteredFields.length === 0 ? (
        <p className="text-sm font-sans text-text-muted">Nada coincide con «{search}».</p>
      ) : (
        <div className="space-y-3">
          {SITE_CONTENT_GROUP_ORDER.filter((g) => fieldsByGroup.has(g)).map((group) => (
            <ContentGroup key={group} group={group} fields={fieldsByGroup.get(group)!} forceOpen={Boolean(normalizedSearch)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentGroup({ group, fields, forceOpen }: { group: string; fields: SiteContentField[]; forceOpen: boolean }) {
  return (
    <details className="border border-border-light" open={forceOpen} key={forceOpen ? 'open' : 'closed'}>
      <summary className="cursor-pointer select-none list-none flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors">
        <span className="flex items-baseline gap-3">
          <span className="font-serif text-lg text-text-primary">{group}</span>
          <span className="text-xs font-sans text-text-muted">{fields.length}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-text-muted transition-transform details-chevron" />
      </summary>
      <div className="px-5 pb-5 pt-1 space-y-6 border-t border-border-light">
        {fields.map((field) => (
          <ContentFieldEditor key={field.key} field={field} />
        ))}
      </div>
    </details>
  );
}

function ContentFieldEditor({ field }: { field: SiteContentField }) {
  const { overrides, refresh } = useSiteContentAdmin();
  const { showToast } = useToast();

  const hasOverride = Boolean(overrides[field.key] && overrides[field.key].trim() !== '');
  const savedValue = hasOverride ? overrides[field.key] : field.defaultValue;

  // Solo se usa como valor inicial: si otra pestaña cambia este texto
  // mientras se edita aquí, esta pestaña no lo pisa a media escritura (un
  // caso raro para un panel de un único administrador) — con recargar la
  // página se vuelve a sincronizar.
  const [value, setValue] = useState(savedValue);
  const [saving, setSaving] = useState(false);

  const dirty = value !== savedValue;

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('site_content').upsert({ key: field.key, value });
    setSaving(false);
    if (error) {
      showToast('No se ha podido guardar: ' + error.message, 'error');
      return;
    }
    await refresh();
    showToast('Guardado — el cambio ya está en el sitio.');
  }

  function handleCancel() {
    setValue(savedValue);
  }

  async function handleReset() {
    setSaving(true);
    const { error } = await supabase.from('site_content').delete().eq('key', field.key);
    setSaving(false);
    if (error) {
      showToast('No se ha podido restablecer: ' + error.message, 'error');
      return;
    }
    setValue(field.defaultValue);
    await refresh();
    showToast('Restablecido al texto original de Pangloss.');
  }

  const isMultiline = field.type !== 'short';
  const rows = field.type === 'longMultiParagraph' ? 5 : field.type === 'list' ? 4 : field.type === 'long' ? 3 : undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <span className="text-sm font-sans font-medium text-text-primary">{field.label}</span>
        {hasOverride && !dirty && (
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1 text-xs font-sans text-text-muted hover:text-accent transition-colors flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer al original
          </button>
        )}
      </div>
      {field.description && <p className="text-xs font-sans text-text-muted mb-2">{field.description}</p>}

      {isMultiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={rows}
          className="w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border border-border px-3 py-2 text-sm font-sans outline-none focus:border-text-primary"
        />
      )}

      {dirty && (
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-3.5 py-1.5 text-xs font-sans uppercase tracking-widest bg-text-primary text-white hover:bg-accent transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-3.5 py-1.5 text-xs font-sans uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
