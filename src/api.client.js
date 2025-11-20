export async function fetchHello() {
  const res = await fetch('/api/hello')
  if (!res.ok) throw new Error('Network response was not ok')
  return res.json()
}