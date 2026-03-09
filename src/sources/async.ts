export async function loadAsyncSource(
  loader: () => Promise<Record<string, unknown>>
): Promise<Record<string, unknown>> {
  return loader();
}
