/**
 * Corner coordinates transcribed from page 5 of the provided quarry
 * investment presentation. They describe ONE documented permit outline,
 * not a verified geodetic boundary for the entire three-quarry complex.
 */
export type Dms = Readonly<{ degrees: number; minutes: number; seconds: number }>;
export const documentedCornerCoordinates = [
  { latitude: { degrees: 25, minutes: 31, seconds: 3.1 }, longitude: { degrees: 48, minutes: 21, seconds: 53.8 } },
  { latitude: { degrees: 25, minutes: 30, seconds: 47 }, longitude: { degrees: 48, minutes: 21, seconds: 53.8 } },
  { latitude: { degrees: 25, minutes: 30, seconds: 47 }, longitude: { degrees: 48, minutes: 21, seconds: 35.9 } },
  { latitude: { degrees: 25, minutes: 31, seconds: 3.1 }, longitude: { degrees: 48, minutes: 21, seconds: 35.9 } },
] as const;

export function dmsToDecimal(point: Dms): number {
  const { degrees, minutes, seconds } = point;
  if (![degrees, minutes, seconds].every(Number.isFinite) || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
    throw new Error("Invalid degrees/minutes/seconds");
  }
  const sign = degrees < 0 ? -1 : 1;
  return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
}

export const quarryReferenceCenter = Object.freeze({
  latitude: documentedCornerCoordinates.reduce((sum, entry) => sum + dmsToDecimal(entry.latitude), 0) / documentedCornerCoordinates.length,
  longitude: documentedCornerCoordinates.reduce((sum, entry) => sum + dmsToDecimal(entry.longitude), 0) / documentedCornerCoordinates.length,
});

/** A Google Maps satellite query usable without exposing a private API key.
 * This legacy embed form is best-effort; use the external official Maps URL
 * as a robust fallback if the iframe is blocked by a provider/browser.
 */
export const googleSatelliteEmbedUrl =
  "https://maps.google.com/maps?q=" +
  quarryReferenceCenter.latitude.toFixed(6) + "%2C" + quarryReferenceCenter.longitude.toFixed(6) +
  "&t=k&z=15&hl=ar&output=embed";

export const googleMapsOpenUrl =
  "https://www.google.com/maps/search/?api=1&query=" +
  quarryReferenceCenter.latitude.toFixed(6) + "%2C" + quarryReferenceCenter.longitude.toFixed(6);
