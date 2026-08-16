/**
 * Remate editorial exclusivo de Spongeonomics: la ilustración de referencia
 * (rótulo "Spongeonomics" + cúpula sobre roca, torre-moái, vivienda-piña,
 * con las flores y detalles del boceto original) tal cual fue proporcionada,
 * sin reinterpretar. Sustituye al `ArticleEndMark` genérico solo aquí.
 */
export function SpongeonomicsEndMark() {
  return (
    <div className="article-end-mark" aria-hidden="true">
      <img
        src="/worlds/spongeonomics-houses.png"
        alt=""
        width={1400}
        height={791}
        className="w-full max-w-[480px] h-auto select-none"
        draggable={false}
      />
    </div>
  );
}
