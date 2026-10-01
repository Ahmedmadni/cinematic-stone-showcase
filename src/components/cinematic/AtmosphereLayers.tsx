type AtmosphereVariant = "hero" | "bridge" | "fleet";

/**
 * Lightweight CSS atmosphere: no canvas, textures, timers, or externally loaded
 * artwork. Decorative only: never covers controls or changes semantic content.
 */
export function AtmosphereLayers({ variant }: { variant: AtmosphereVariant }) {
  return (
    <div className={`cinema-atmosphere cinema-atmosphere--${variant}`} aria-hidden="true">
      <span className="cinema-atmosphere__haze cinema-atmosphere__haze--far" />
      <span className="cinema-atmosphere__haze cinema-atmosphere__haze--near" />
      <span className="cinema-atmosphere__light" />
    </div>
  );
}
