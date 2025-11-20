const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 3000

// simple API matching production function
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express dev server!' })
})

// Serve built files when available
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})