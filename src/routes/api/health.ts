import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'

import { db } from '#/db'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await db.run(sql`select 1`)
          return json({ status: 'ok', db: 'connected' })
        } catch (error) {
          return json(
            {
              status: 'error',
              db: 'unreachable',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
