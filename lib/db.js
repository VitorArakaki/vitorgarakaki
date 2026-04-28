import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL);

export default sql;
