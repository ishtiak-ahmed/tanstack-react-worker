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
  // --update-config=false: don't let wrangler prompt to add its own binding entry,
  // which would append a duplicate d1_databases entry alongside the "DB" placeholder below.
  execSync(`npx wrangler d1 create ${dbName} --update-config=false`, { stdio: 'inherit' })
  databaseId = listDatabases().find((db) => db.name === dbName)?.uuid
}

if (!databaseId) {
  console.error(`Could not find database "${dbName}" via \`wrangler d1 list\` after creating it.`)
  process.exit(1)
}

const wranglerPath = 'wrangler.jsonc'
const config = readFileSync(wranglerPath, 'utf-8')

const dbBindingBlock = config.match(/\{\s*"binding":\s*"DB"[\s\S]*?\}/)

if (!dbBindingBlock) {
  console.error(
    'Could not find a D1 binding named "DB" in wrangler.jsonc. Add one manually with:\n' +
      `  database_name: ${dbName}\n  database_id: ${databaseId}`,
  )
  process.exit(1)
}

const otherBindings = [...config.matchAll(/"binding":\s*"([^"]+)"/g)]
  .map((m) => m[1])
  .filter((binding) => binding !== 'DB')

if (otherBindings.length > 0) {
  console.warn(
    `Warning: found unexpected extra binding(s) in wrangler.jsonc: ${otherBindings.join(', ')}. ` +
      'Only the "DB" binding is used by this app — remove the others if they are stray.',
  )
}

const updatedBlock = dbBindingBlock[0]
  .replace(/"database_name":\s*"[^"]*"/, `"database_name": "${dbName}"`)
  .replace(/"database_id":\s*"[^"]*"/, `"database_id": "${databaseId}"`)

const updated = config.replace(dbBindingBlock[0], updatedBlock)

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
