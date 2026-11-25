// Catch-all error handler. Logs the full error on the server, but never sends
// internal error messages or database details to the client.
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)

  // Malformed JSON body or body over the size limit (from express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' })
  }

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500
    ? err.status
    : 500

  res.status(status).json({
    error: status === 500 ? 'Something went wrong on the server' : (err.expose ? err.message : 'Bad request')
  })
}
