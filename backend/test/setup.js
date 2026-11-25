// Runs before every test file: fake credentials so modules that create the
// Supabase client can load. Tests never talk to the real database.
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
