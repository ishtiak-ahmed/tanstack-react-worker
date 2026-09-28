#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const dbName = process.argv[2]

if (!dbName) {
  console.error('Usage: npm run db:create -- <dbname>')
  process.exit(1)
}

function listDatabases() {
  const output = execSync('npx wrangler d1 list --json', { encoding: 'utf-8' })
  return JSON.parse(output)
}

let databaseId = listDatabases().find((db) => db.name === dbName)?.uuid

if (databaseId) {
  console.log(`D1 database "${dbName}" already exists (${databaseId}), reusing it.`)
} else {
  console.log(`Creating D1 database "${dbName}"...`)
  execSync(`npx wrangler d1 create ${dbName}`, { stdio: 'inherit' })
  databaseId = listDatabases().find((db) => db.name === dbName)?.uuid
}

if (!databaseId) {
  console.error(`Could not find database "${dbName}" via \`wrangler d1 list\` after creating it.`)
  process.exit(1)
}

const wranglerPath = 'wrangler.jsonc'
const config = readFileSync(wranglerPath, 'utf-8')

if (!config.includes('"d1_databases"')) {
  console.error(
    'No "d1_databases" binding found in wrangler.jsonc. Add one manually with:\n' +
      `  database_name: ${dbName}\n  database_id: ${databaseId}`,
  )
  process.exit(1)
}

const updated = config
  .replace(/"database_name":\s*"[^"]*"/, `"database_name": "${dbName}"`)
  .replace(/"database_id":\s*"[^"]*"/, `"database_id": "${databaseId}"`)

writeFileSync(wranglerPath, updated)

console.log(`Wired D1 binding "DB" -> ${dbName} (${databaseId}) in wrangler.jsonc`)

console.log('Regenerating worker types...')
execSync('npx wrangler types', { stdio: 'inherit' })

console.log('Generating drizzle migrations from src/db/schema.ts...')
execSync('npx drizzle-kit generate', { stdio: 'inherit' })

console.log('Applying migrations to the remote database...')
execSync('npx wrangler d1 migrations apply DB --remote', { stdio: 'inherit' })

console.log(`Database "${dbName}" is created, wired up, and migrated.`)
console.log('Run `npm run db:migrate:local` if you also want your local dev database migrated.')
