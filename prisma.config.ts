import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    // Use DIRECT_URL for migrations (bypasses pgbouncer)
    // Runtime uses DATABASE_URL from schema.prisma (pooled connection)
    url: env('DIRECT_URL'),
  },
});
