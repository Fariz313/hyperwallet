export function GET() {
  return Response.json({
    ok: true,
    name: "hyperwallet",
    phase: 1,
    status: "skeleton",
    timestamp: new Date().toISOString(),
  });
}
