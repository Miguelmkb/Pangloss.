/**
 * Catálogo de todo el texto público editable desde /admin/contenido.
 *
 * Cada entrada es la única fuente de verdad de: la clave técnica (invisible
 * para quien edita — vive solo aquí y en la base de datos), la etiqueta y
 * descripción humanas que ve el administrador, el tipo de campo, y el VALOR
 * POR DEFECTO — que es literalmente el texto que ya existía en el código
 * antes del CMS, sin mejorarlo ni cambiarlo. Si una clave no tiene fila en
 * `site_content` (tabla vacía al principio, o el admin nunca la ha tocado),
 * el sitio usa este valor por defecto: la web no depende de que la base de
 * datos esté poblada para funcionar.
 *
 * Deliberadamente NO incluye: microcopy funcional universal (Cancelar,
 * Guardar, Buscar como verbo de botón...), aria-labels, vocabulario técnico
 * controlado (tipos de referencia bibliográfica), nombres/descripciones de
 * categorías y autores (ya editables desde sus propios apartados), ni nada
 * del panel /admin en sí — solo comunicación editorial pública.
 */

export type SiteContentType = 'short' | 'long' | 'longMultiParagraph' | 'list';

export interface SiteContentField {
  key: string;
  group: string;
  label: string;
  description: string;
  type: SiteContentType;
  defaultValue: string;
}

// Orden de aparición en /admin/contenido.
export const SITE_CONTENT_GROUP_ORDER = [
  'General',
  'Navegación',
  'Portada',
  'Footer',
  'Sobre Pangloss',
  'Colabora',
  'Suscripción',
  'Confirmación y baja de suscripción',
  'Búsqueda',
  'Artículos',
  'Categorías',
  'Autores',
  'Página de categoría',
  'Página de autor',
  'Artículo',
  '404',
] as const;

export const SITE_CONTENT_FIELDS: SiteContentField[] = [
  // ---------------------------------------------------------------- General
  {
    key: 'search.heading',
    group: 'General',
    label: 'Título del buscador',
    description: 'Aparece al abrir el buscador desde el menú y en la página de búsqueda cuando todavía no se ha escrito nada.',
    type: 'short',
    defaultValue: 'Buscar en Pangloss',
  },
  {
    key: 'common.backToPangloss',
    group: 'General',
    label: 'Enlace "volver a Pangloss"',
    description: 'Aparece tras confirmar una suscripción y tras darse de baja.',
    type: 'short',
    defaultValue: 'Ir a Pangloss →',
  },
  {
    key: 'common.linkLostDescription',
    group: 'General',
    label: 'Aviso de enlace roto',
    description: 'Aparece cuando se visita una categoría o un autor que no existen (enlace antiguo o mal escrito).',
    type: 'short',
    defaultValue: 'Puede que el enlace se haya perdido por el camino.',
  },

  // ------------------------------------------------------------ Navegación
  { key: 'nav.articles', group: 'Navegación', label: 'Enlace "Artículos"', description: 'Menú principal y columna "Publicación" del pie de página.', type: 'short', defaultValue: 'Artículos' },
  { key: 'nav.categories', group: 'Navegación', label: 'Enlace "Categorías"', description: 'Menú principal, columna "Publicación" del pie de página, y primer nivel de la miga de pan en cada página de categoría.', type: 'short', defaultValue: 'Categorías' },
  { key: 'nav.authors', group: 'Navegación', label: 'Enlace "Autores"', description: 'Menú principal y columna "Publicación" del pie de página.', type: 'short', defaultValue: 'Autores' },
  { key: 'nav.about', group: 'Navegación', label: 'Enlace "Sobre"', description: 'Menú principal.', type: 'short', defaultValue: 'Sobre' },
  {
    key: 'nav.searchPlaceholder',
    group: 'Navegación',
    label: 'Marcador del campo de búsqueda',
    description: 'Texto de ejemplo dentro del campo, antes de escribir nada.',
    type: 'short',
    defaultValue: '¿Qué buscas?',
  },

  // ---------------------------------------------------------------- Portada
  { key: 'home.heroCta', group: 'Portada', label: 'Enlace "Leer artículo"', description: 'Bajo el artículo destacado.', type: 'short', defaultValue: 'Leer artículo' },
  { key: 'home.latestTitle', group: 'Portada', label: 'Título "Últimos artículos"', description: '', type: 'short', defaultValue: 'Últimos artículos' },
  { key: 'home.viewAll', group: 'Portada', label: 'Enlace "Ver todos"', description: 'Junto a "Últimos artículos".', type: 'short', defaultValue: 'Ver todos' },
  { key: 'home.categoriesTitle', group: 'Portada', label: 'Título "Por categorías"', description: '', type: 'short', defaultValue: 'Por categorías' },
  {
    key: 'home.emptyTitle',
    group: 'Portada',
    label: 'Título cuando todavía no hay artículos',
    description: 'Se ve en la portada antes de publicar el primer artículo.',
    type: 'short',
    defaultValue: 'Pangloss está a punto de empezar.',
  },
  {
    key: 'home.emptyDescription',
    group: 'Portada',
    label: 'Descripción cuando todavía no hay artículos',
    description: '',
    type: 'long',
    defaultValue: 'Todavía no hay ningún artículo publicado. En cuanto se publique el primero, aparecerá aquí.',
  },

  // ----------------------------------------------------------------- Footer
  {
    key: 'footer.description',
    group: 'Footer',
    label: 'Descripción de Pangloss',
    description: 'Junto al logo, en la primera columna del pie de página.',
    type: 'long',
    defaultValue:
      'Una revista digital de análisis, ensayo e investigación sobre economía, sociología, historia, política, filosofía y cultura.',
  },
  {
    key: 'footer.subscribeLabel',
    group: 'Footer',
    label: 'Etiqueta del formulario de suscripción',
    description: '',
    type: 'short',
    defaultValue: 'Recibe los artículos nuevos',
  },
  {
    key: 'footer.subscribeSuccess',
    group: 'Footer',
    label: 'Mensaje tras suscribirse',
    description: 'Sustituye al formulario del footer una vez enviado.',
    type: 'long',
    defaultValue: 'Revisa tu bandeja de entrada — te hemos mandado un enlace para confirmar.',
  },
  {
    key: 'footer.preferencesLink',
    group: 'Footer',
    label: 'Enlace a preferencias de suscripción',
    description: '',
    type: 'short',
    defaultValue: '¿Solo ciertos temas o autores? Elige aquí →',
  },
  {
    key: 'footer.aboutLink',
    group: 'Footer',
    label: 'Enlace "Sobre nosotros"',
    description: 'En la columna "Pangloss" del pie de página.',
    type: 'short',
    defaultValue: 'Sobre nosotros',
  },
  {
    key: 'footer.collaborateLink',
    group: 'Footer',
    label: 'Enlace "Escribe para Pangloss"',
    description: 'En la columna "Pangloss" del pie de página (el título de la propia página de Colabora se edita aparte, en su grupo).',
    type: 'short',
    defaultValue: 'Escribe para Pangloss',
  },
  {
    key: 'footer.searchLink',
    group: 'Footer',
    label: 'Enlace "Buscar"',
    description: 'En la columna "Publicación" del pie de página.',
    type: 'short',
    defaultValue: 'Buscar',
  },
  {
    key: 'footer.publicationHeading',
    group: 'Footer',
    label: 'Título de la columna "Publicación"',
    description: '',
    type: 'short',
    defaultValue: 'Publicación',
  },
  {
    key: 'footer.aboutHeading',
    group: 'Footer',
    label: 'Título de la columna "Pangloss"',
    description: '',
    type: 'short',
    defaultValue: 'Pangloss',
  },
  {
    key: 'footer.adminLink',
    group: 'Footer',
    label: 'Enlace "Acceso privado"',
    description: 'En la columna "Pangloss" del pie de página — lleva al panel editorial.',
    type: 'short',
    defaultValue: 'Acceso privado',
  },
  {
    key: 'footer.contactLink',
    group: 'Footer',
    label: 'Enlace "Contacto"',
    description: 'En la columna "Pangloss" del pie de página.',
    type: 'short',
    defaultValue: 'Contacto',
  },
  {
    key: 'footer.quote',
    group: 'Footer',
    label: 'Cita de cierre',
    description: 'Última línea del pie de página. Nota: la misma cita aparece también, por separado, en la plantilla de los emails — cambiarla aquí no la cambia allí.',
    type: 'short',
    defaultValue: '«Todo está bien en el mejor de los mundos posibles.»',
  },

  // --------------------------------------------------------- Sobre Pangloss
  { key: 'about.title', group: 'Sobre Pangloss', label: 'Título', description: '', type: 'short', defaultValue: 'Sobre Pangloss' },
  {
    key: 'about.body',
    group: 'Sobre Pangloss',
    label: 'Texto',
    description: 'Deja una línea en blanco entre párrafos para que se muestren como párrafos separados.',
    type: 'longMultiParagraph',
    defaultValue:
      'Pangloss es una revista digital independiente, privada y colectiva, fundada por tres amigos con la voluntad de compartir ensayos, análisis y reflexiones sobre economía, sociología, historia, política, filosofía, cultura, ciencia y tecnología.\n\nNo buscamos la urgencia de la actualidad por sí misma, sino la profundidad del análisis pausado. Creemos en la lectura larga, en la idea bien argumentada y en el respeto por el lector. Pangloss es un espacio para pensar en voz alta.',
  },

  // ---------------------------------------------------------------- Colabora
  { key: 'collaborate.title', group: 'Colabora', label: 'Título', description: '', type: 'short', defaultValue: 'Escribe para Pangloss' },
  {
    key: 'collaborate.intro',
    group: 'Colabora',
    label: 'Introducción',
    description: 'Deja una línea en blanco entre párrafos para que se muestren como párrafos separados.',
    type: 'longMultiParagraph',
    defaultValue:
      'Pangloss no es solo de quienes la fundamos. Si tienes una idea que llevas tiempo dándole vueltas, un argumento que crees que merece espacio, o simplemente algo que decir y bien dicho, nos gustaría leerlo.\n\nNo buscamos actualidad ni urgencia — buscamos textos pensados, bien argumentados y honestos con la complejidad del tema. Un artículo de Pangloss puede tardar una semana en escribirse y seguir siendo relevante dentro de cinco años.',
  },
  { key: 'collaborate.topicsLabel', group: 'Colabora', label: 'Etiqueta "Qué buscamos"', description: '', type: 'short', defaultValue: 'Qué buscamos' },
  {
    key: 'collaborate.topics',
    group: 'Colabora',
    label: 'Temas',
    description: 'Un tema por línea. Se muestran como una fila de etiquetas.',
    type: 'list',
    defaultValue: 'Economía\nSociología\nHistoria\nPolítica\nFilosofía\nCultura\nCiencia\nTecnología',
  },
  {
    key: 'collaborate.topicsNote',
    group: 'Colabora',
    label: 'Nota tras los temas',
    description: '',
    type: 'long',
    defaultValue:
      'Si tu idea no encaja claramente en ninguno de estos temas pero crees que tiene sitio en Pangloss, escríbenos igual — el criterio siempre ha sido la calidad del argumento, no la etiqueta.',
  },
  { key: 'collaborate.stepsLabel', group: 'Colabora', label: 'Etiqueta "Cómo proponerlo"', description: '', type: 'short', defaultValue: 'Cómo proponerlo' },
  {
    key: 'collaborate.steps',
    group: 'Colabora',
    label: 'Pasos',
    description: 'Un paso por línea. Se muestran como lista numerada, en el orden en que los escribas.',
    type: 'list',
    defaultValue:
      'Escríbenos con una idea, un borrador o un artículo ya terminado — lo que tengas. Un par de párrafos contando de qué va y por qué te parece que merece la pena es suficiente para empezar.\nLo leemos con calma y te respondemos, seas quien seas y venga de donde venga.\nSi sigue adelante, trabajamos el texto contigo hasta que esté listo para publicarse con tu nombre.',
  },
  { key: 'collaborate.cta', group: 'Colabora', label: 'Botón final', description: 'Abre un correo dirigido a Pangloss.', type: 'short', defaultValue: 'Proponer un artículo' },

  // ------------------------------------------------------------- Suscripción
  { key: 'subscribe.title', group: 'Suscripción', label: 'Título', description: '', type: 'short', defaultValue: 'Recibe Pangloss' },
  {
    key: 'subscribe.intro',
    group: 'Suscripción',
    label: 'Introducción',
    description: '',
    type: 'long',
    defaultValue: 'Nada de boletines diarios ni de urgencia fingida: un aviso, solo cuando publiquemos algo que de verdad merezca tu tiempo.',
  },
  { key: 'subscribe.allLabel', group: 'Suscripción', label: 'Opción "Todo Pangloss"', description: '', type: 'short', defaultValue: 'Todo Pangloss' },
  {
    key: 'subscribe.allDescription',
    group: 'Suscripción',
    label: 'Descripción de "Todo Pangloss"',
    description: '',
    type: 'short',
    defaultValue: 'Recibe cualquier cosa que publiquemos, sin filtrar.',
  },
  { key: 'subscribe.authorsLabel', group: 'Suscripción', label: 'Etiqueta "elige autores"', description: '', type: 'short', defaultValue: 'O elige autores concretos' },
  { key: 'subscribe.categoriesLabel', group: 'Suscripción', label: 'Etiqueta "elige categorías"', description: '', type: 'short', defaultValue: 'O elige categorías concretas' },
  { key: 'subscribe.emailFieldLabel', group: 'Suscripción', label: 'Etiqueta del campo de email', description: '', type: 'short', defaultValue: 'Email' },
  {
    key: 'subscribe.disclaimer',
    group: 'Suscripción',
    label: 'Aviso bajo el botón de enviar',
    description: '',
    type: 'long',
    defaultValue: 'Puedes cambiar tus preferencias o dejar de recibir avisos cuando quieras — sin preguntas.',
  },
  { key: 'subscribe.successTitle', group: 'Suscripción', label: 'Título tras suscribirse', description: '', type: 'short', defaultValue: 'Una última cosa.' },
  {
    key: 'subscribe.successBody',
    group: 'Suscripción',
    label: 'Texto tras suscribirse',
    description: 'Usa {email} donde quieras que aparezca la dirección que ha escrito la persona.',
    type: 'long',
    defaultValue: 'Te hemos escrito a {email} con un enlace para confirmar que la dirección es tuya. En cuanto lo hagas, Pangloss se encarga del resto.',
  },
  {
    key: 'subscribe.successNote',
    group: 'Suscripción',
    label: 'Nota sobre spam',
    description: '',
    type: 'long',
    defaultValue: 'Si no lo ves en un par de minutos, echa un vistazo a spam — a veces el primer correo se cuela ahí.',
  },

  // ------------------------------ Confirmación y baja de suscripción
  { key: 'subscribeConfirm.confirmedTitle', group: 'Confirmación y baja de suscripción', label: 'Título al confirmar', description: '', type: 'short', defaultValue: 'Confirmado.' },
  {
    key: 'subscribeConfirm.confirmedBody',
    group: 'Confirmación y baja de suscripción',
    label: 'Texto al confirmar',
    description: '',
    type: 'long',
    defaultValue: 'A partir de ahora te avisaremos por email cuando publiquemos algo nuevo.',
  },
  {
    key: 'subscribeConfirm.invalidTitle',
    group: 'Confirmación y baja de suscripción',
    label: 'Título si el enlace de confirmación no es válido',
    description: '',
    type: 'short',
    defaultValue: 'Este enlace ya no es válido.',
  },
  {
    key: 'subscribeConfirm.invalidBody',
    group: 'Confirmación y baja de suscripción',
    label: 'Texto si el enlace de confirmación no es válido',
    description: '',
    type: 'long',
    defaultValue: 'Puede que ya lo hayas confirmado antes, o que el enlace haya caducado.',
  },
  {
    key: 'subscribeConfirm.invalidLink',
    group: 'Confirmación y baja de suscripción',
    label: 'Enlace para suscribirse de nuevo',
    description: '',
    type: 'short',
    defaultValue: 'Suscribirme de nuevo →',
  },
  { key: 'unsubscribe.doneTitle', group: 'Confirmación y baja de suscripción', label: 'Título tras darse de baja', description: '', type: 'short', defaultValue: 'Hecho.' },
  {
    key: 'unsubscribe.doneBody',
    group: 'Confirmación y baja de suscripción',
    label: 'Texto tras darse de baja',
    description: '',
    type: 'long',
    defaultValue: 'No volverás a recibir avisos por email. Si cambias de opinión, siempre puedes suscribirte otra vez.',
  },
  {
    key: 'unsubscribe.invalidBody',
    group: 'Confirmación y baja de suscripción',
    label: 'Texto si el enlace de baja no es válido',
    description: '',
    type: 'short',
    defaultValue: 'Este enlace ya no es válido.',
  },

  // ---------------------------------------------------------------- Búsqueda
  {
    key: 'search.promptTitle',
    group: 'Búsqueda',
    label: 'Texto antes de escribir nada',
    description: 'Página /buscar visitada directamente, sin un término de búsqueda.',
    type: 'short',
    defaultValue: 'Escribe algo en el buscador del encabezado.',
  },
  { key: 'search.noResultsTitle', group: 'Búsqueda', label: 'Título sin resultados', description: '', type: 'short', defaultValue: 'Ninguna coincidencia.' },
  {
    key: 'search.noResultsDescription',
    group: 'Búsqueda',
    label: 'Descripción sin resultados',
    description: '',
    type: 'long',
    defaultValue: 'Pangloss cree que todo tiene explicación — esta búsqueda, de momento, no la tiene.',
  },

  // --------------------------------------------------------------- Artículos
  { key: 'articlesPage.title', group: 'Artículos', label: 'Título de la página', description: '', type: 'short', defaultValue: 'Artículos' },
  { key: 'articlesPage.description', group: 'Artículos', label: 'Descripción de la página', description: '', type: 'short', defaultValue: 'Todos los textos publicados en Pangloss.' },
  { key: 'articlesPage.allFilterLabel', group: 'Artículos', label: 'Etiqueta del filtro "todas las categorías"', description: '', type: 'short', defaultValue: 'Todos' },
  { key: 'articlesPage.emptyTitle', group: 'Artículos', label: 'Título sin artículos', description: '', type: 'short', defaultValue: 'Nada por aquí todavía.' },
  {
    key: 'articlesPage.emptyDescriptionAll',
    group: 'Artículos',
    label: 'Descripción sin artículos (sin filtro)',
    description: '',
    type: 'short',
    defaultValue: 'Todavía no hay artículos publicados.',
  },
  {
    key: 'articlesPage.emptyDescriptionFiltered',
    group: 'Artículos',
    label: 'Descripción sin artículos (con una categoría filtrada)',
    description: '',
    type: 'short',
    defaultValue: 'Esta categoría no tiene artículos publicados por ahora.',
  },

  // -------------------------------------------------------------- Categorías
  { key: 'categoriesPage.title', group: 'Categorías', label: 'Título de la página', description: '', type: 'short', defaultValue: 'Categorías' },
  { key: 'categoriesPage.description', group: 'Categorías', label: 'Descripción de la página', description: '', type: 'short', defaultValue: 'Las áreas de Pangloss.' },

  // ----------------------------------------------------------------- Autores
  { key: 'authorsPage.title', group: 'Autores', label: 'Título de la página', description: '', type: 'short', defaultValue: 'Autores' },
  { key: 'authorsPage.description', group: 'Autores', label: 'Descripción de la página', description: '', type: 'short', defaultValue: 'Las personas que escriben en Pangloss.' },
  { key: 'authorsPage.emptyTitle', group: 'Autores', label: 'Título sin autores todavía', description: '', type: 'short', defaultValue: 'Todavía no hay nadie aquí.' },
  {
    key: 'authorsPage.emptyDescription',
    group: 'Autores',
    label: 'Descripción sin autores todavía',
    description: '',
    type: 'long',
    defaultValue: 'Los autores aparecerán en cuanto se den de alta desde el panel editorial.',
  },

  // ---------------------------------------------------------- Página de categoría
  {
    key: 'category.notFoundTitle',
    group: 'Página de categoría',
    label: 'Título si la categoría no existe',
    description: '',
    type: 'short',
    defaultValue: 'Esta categoría no existe.',
  },
  {
    key: 'category.emptyTitle',
    group: 'Página de categoría',
    label: 'Título sin artículos en la categoría',
    description: '',
    type: 'short',
    defaultValue: 'Todavía no hemos escrito sobre esto.',
  },
  {
    key: 'category.emptyDescriptionWithSubs',
    group: 'Página de categoría',
    label: 'Descripción sin artículos (categoría con subcategorías)',
    description: '',
    type: 'long',
    defaultValue: 'Al menos no directamente en esta categoría — prueba con alguna de las subcategorías de arriba.',
  },
  {
    key: 'category.emptyDescriptionNoSubs',
    group: 'Página de categoría',
    label: 'Descripción sin artículos (categoría sin subcategorías)',
    description: '',
    type: 'long',
    defaultValue: 'Quizá sea precisamente el momento de hacerlo. Aparecerá aquí en cuanto exista.',
  },

  // -------------------------------------------------------------- Página de autor
  { key: 'author.notFoundTitle', group: 'Página de autor', label: 'Título si el autor no existe', description: '', type: 'short', defaultValue: 'Este autor no existe.' },
  { key: 'author.emptyTitle', group: 'Página de autor', label: 'Título sin artículos del autor', description: '', type: 'short', defaultValue: 'Todavía en blanco.' },
  {
    key: 'author.emptyDescription',
    group: 'Página de autor',
    label: 'Descripción sin artículos del autor',
    description: '',
    type: 'short',
    defaultValue: 'Este autor no ha publicado nada por aquí — de momento.',
  },
  { key: 'author.backLink', group: 'Página de autor', label: 'Enlace "todos los autores"', description: '', type: 'short', defaultValue: '← Todos los autores' },

  // -------------------------------------------------------------------- Artículo
  {
    key: 'articlePage.notFoundTitle',
    group: 'Artículo',
    label: 'Título si el artículo no está disponible',
    description: '',
    type: 'short',
    defaultValue: 'Este artículo no está disponible.',
  },
  {
    key: 'articlePage.notFoundDescription',
    group: 'Artículo',
    label: 'Descripción si el artículo no está disponible',
    description: '',
    type: 'short',
    defaultValue: 'Puede que aún no se haya publicado, o que el enlace ya no exista.',
  },
  {
    key: 'articlePage.relatedTitle',
    group: 'Artículo',
    label: 'Título "también te puede interesar"',
    description: '',
    type: 'short',
    defaultValue: 'También te puede interesar',
  },

  // ------------------------------------------------------------------------ 404
  { key: 'notFound.title', group: '404', label: 'Título', description: '', type: 'short', defaultValue: 'Esto no está aquí.' },
  { key: 'notFound.subtitle', group: '404', label: 'Subtítulo', description: '', type: 'short', defaultValue: 'Quizá fue optimismo pensar que sí.' },
  { key: 'notFound.link', group: '404', label: 'Enlace de vuelta', description: '', type: 'short', defaultValue: 'Volver a Pangloss →' },
];

export const SITE_CONTENT_MAP: Record<string, SiteContentField> = Object.fromEntries(
  SITE_CONTENT_FIELDS.map((f) => [f.key, f]),
);
