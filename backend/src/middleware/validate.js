import { ZodError } from 'zod'

// validate({ body, params, query }) - each a zod schema. Parsed values replace
// the originals, so controllers only ever see validated, trimmed data and
// unknown body fields are dropped.
export const validate = (schemas) => (req, res, next) => {
  try {
    // Params are only checked (not replaced) - Express manages req.params itself
    if (schemas.params) schemas.params.parse(req.params)
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {})
    if (schemas.query) {
      // req.query is a getter in Express 5, so store parsed query separately
      req.validatedQuery = schemas.query.parse(req.query)
    }
    next()
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: err.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      })
    }
    next(err)
  }
}
