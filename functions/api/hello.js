export async function onRequest(context) {
  const data = { message: 'Hello from Cloudflare Pages Functions!' }
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}