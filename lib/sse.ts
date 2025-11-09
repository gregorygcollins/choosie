// Simple in-memory SSE pub/sub for list sessions
// NOTE: Best-effort only; serverless instances may not share memory.

type Subscriber = (payload: any) => void;

const globalAny = globalThis as unknown as { __choosieBus?: Map<string, Set<Subscriber>> };
const bus: Map<string, Set<Subscriber>> = globalAny.__choosieBus || new Map();
if (!globalAny.__choosieBus) globalAny.__choosieBus = bus;

export function subscribe(listId: string, sub: Subscriber): () => void {
  let set = bus.get(listId);
  if (!set) {
    set = new Set();
    bus.set(listId, set);
  }
  set.add(sub);
  return () => {
    set?.delete(sub);
    if (set && set.size === 0) bus.delete(listId);
  };
}

export function publish(listId: string, payload: any) {
  const set = bus.get(listId);
  if (!set || set.size === 0) return;
  for (const sub of set) {
    try { sub(payload); } catch {}
  }
}

export function sseResponse(listId: string, initial?: any): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (evt: any) => {
        const data = `data: ${JSON.stringify(evt)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };
      // initial hello
      controller.enqueue(encoder.encode(`: connected\n\n`));
      if (initial) send(initial);
      const unsubscribe = subscribe(listId, send);
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch {}
      }, 25000);
      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      // handled in start return cleanup
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",
    },
  });
}
