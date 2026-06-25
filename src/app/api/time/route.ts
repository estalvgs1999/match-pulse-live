// Used by the overlay's NTP-style handshake (see useServerOffset) to compute
// the offset between the client's clock and the server's clock. Must stay
// cheap and do no I/O so each round trip measures network latency only.
export async function GET() {
  return Response.json({ serverTime: Date.now() });
}

export const dynamic = "force-dynamic";
