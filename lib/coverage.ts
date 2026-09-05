const RE_KM = 6378.137;

/** Central Earth angle of the 5° (default) elevation-mask coverage circle. */
export function footprintCentralAngleRad(altKm: number, minElDeg = 5): number {
  const h = Math.max(1, altKm);
  const el = (minElDeg * Math.PI) / 180;
  const arg = (RE_KM / (RE_KM + h)) * Math.cos(el);
  if (arg >= 1) return 0;
  if (arg <= -1) return Math.PI;
  return Math.acos(arg) - el;
}

export function footprintGroundRangeKm(altKm: number, minElDeg = 5): number {
  return RE_KM * footprintCentralAngleRad(altKm, minElDeg);
}

export function footprintRing(
  latDeg: number,
  lonDeg: number,
  altKm: number,
  minElDeg = 5,
  samples = 72,
): { lat: number; lon: number }[] {
  const d = footprintCentralAngleRad(altKm, minElDeg);
  if (d <= 1e-6) return [];
  const φ1 = (latDeg * Math.PI) / 180;
  const λ1 = (lonDeg * Math.PI) / 180;
  const out: { lat: number; lon: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const θ = (i / samples) * 2 * Math.PI;
    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(θ),
    );
    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(θ) * Math.sin(d) * Math.cos(φ1),
        Math.cos(d) - Math.sin(φ1) * Math.sin(φ2),
      );
    out.push({
      lat: (φ2 * 180) / Math.PI,
      lon: ((((λ2 * 180) / Math.PI + 540) % 360) - 180),
    });
  }
  return out;
}
