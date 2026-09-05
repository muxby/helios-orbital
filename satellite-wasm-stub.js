export default function Module() {
  return Promise.resolve({
    _malloc: () => 0,
    _free: () => undefined,
  });
}
