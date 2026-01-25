// TODO: 비동기 소스 로더 구현
export async function loadAsyncSource(
  _loader: () => Promise<Record<string, unknown>>
): Promise<Record<string, unknown>> {
  throw new Error("Not implemented yet");
}
