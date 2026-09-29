/** Bound actual streamed bytes, including requests without Content-Length. */
export async function readAnalyticsBody(request: Request): Promise<unknown> {
  if (!request.body)
    throw new Error("Invalid analytics body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      length += value.byteLength;
      if (length > 1024) {
        await reader.cancel();
        throw new Error("Analytics body too large");
      }
      chunks.push(value);
    }
  }
  finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
