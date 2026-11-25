// A tiny stand-in for the Supabase client. Each query records its table and
// filters, and `respond(query)` decides what comes back, so a test can say
// "this profile exists" or "these two are blocked" without a database.
export const createFakeSupabase = (respond) => {
  const calls = []
  const builder = (table) => {
    const q = { table, op: 'select', filters: [], payload: null }
    const chain = new Proxy({}, {
      get(_, prop) {
        if (prop === 'then') {
          return (resolve, reject) => {
            calls.push(q)
            Promise.resolve(respond(q)).then(r => resolve(r ?? { data: null, error: null }), reject)
          }
        }
        return (...args) => {
          if (['insert', 'update', 'delete', 'upsert'].includes(prop)) { q.op = prop; q.payload = args[0] }
          else if (!['select', 'single', 'maybeSingle', 'limit', 'order', 'range'].includes(prop)) q.filters.push([prop, ...args])
          if (prop === 'single' || prop === 'maybeSingle') q.single = true
          return chain
        }
      },
    })
    return chain
  }
  return { client: { from: builder, storage: { from: () => ({}) }, auth: {} }, calls }
}

// Value of the first filter named `name` (e.g. eq on user_id)
export const filterValue = (q, name, column) =>
  q.filters.find(f => f[0] === name && (column === undefined || f[1] === column))?.[column === undefined ? 1 : 2]
