export function toggleHeliosFullscreen(): void {
  const root = document.getElementById("helios-root") ?? document.documentElement;
  if (!document.fullscreenElement) {
    void root.requestFullscreen?.();
    return;
  }
  void document.exitFullscreen?.();
}

export function captureHeliosPng(noradId: number | null): void {
  const canvas = document.querySelector("#helios-root canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const id = noradId ?? "earth";
  const name = `helios-${id}-${ts}.png`;
  canvas.toBlob((blob) => {
    if (!blob) {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = name;
      a.click();
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}
