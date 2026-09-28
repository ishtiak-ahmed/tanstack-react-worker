Welcome to your new TanStack Start app!

# Using This Template

This repo ships as two variants, one per branch:

- **[`main`](../../tree/main)** — plain TanStack Start + Cloudflare Workers, no database.
- **[`d1-db`](../../tree/d1-db)** — the same base, plus a Cloudflare D1 binding wired up with Drizzle ORM (see [Database (D1 + Drizzle)](#database-d1--drizzle) below) and a `/api/health` route to verify the DB connection.

To start a new project from either variant:

```bash
# clone and check out the variant you want
git clone <this-repo-url> my-app
cd my-app
git checkout main      # or: git checkout d1-db

# detach it from this template's git history
rm -rf .git && git init
```

If you're copying the files locally instead of cloning (e.g. scaffolding a project programmatically), use `git worktree` to check out each branch into its own folder and copy from there — see the branch's working tree rather than hand-picking files, so nothing is missed:

```bash
git worktree add ../my-app-main main
git worktree add ../my-app-d1 d1-db
```

Then follow **Getting Started** below in the copied project.

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

# Building For Production

To build this application for production:

```bash
npm run build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:


```bash
npm run lint
npm run format
npm run check
```


## Deploy to Cloudflare Workers

This project uses the Cloudflare Vite plugin (configured in `vite.config.ts`) and `wrangler.jsonc`:

1. Install Wrangler: `npm install -g wrangler`
2. Authenticate: `wrangler login`
3. Deploy: `npx wrangler deploy`

For production env vars, run `wrangler secret put MY_VAR` for each secret listed in `.env.example`. Public (non-secret) vars go in `wrangler.jsonc` under `vars`.

KV, D1, R2, and Durable Object bindings are configured in `wrangler.jsonc` — see https://developers.cloudflare.com/workers/wrangler/configuration/.

## Database (D1 + Drizzle)

This project ships with [Drizzle ORM](https://orm.drizzle.team/) wired up against a Cloudflare D1 binding named `DB`.

### 1. Create, wire up, and migrate a D1 database

Run the following, passing the name you want for your database:

```bash
npm run db:create -- <dbname>
```

This is idempotent and does everything needed to get a working database:

1. Creates the D1 database via Wrangler (or reuses it if a database with that name already exists).
2. Writes its `database_name` and `database_id` into the `d1_databases` binding in `wrangler.jsonc`.
3. Regenerates `worker-configuration.d.ts` so `env.DB` is typed.
4. Generates SQL migrations from `src/db/schema.ts` with Drizzle Kit.
5. Applies those migrations to the **remote** database, so it's immediately usable.

If you're also developing locally, also run:

```bash
npm run db:migrate:local
```

to apply the same migrations to your local dev database (`.wrangler`'s local D1 state).

Whenever you change `src/db/schema.ts` afterwards, run `npm run db:generate` followed by `db:migrate:local`/`db:migrate:remote` to pick up the change — `db:create` only needs to run once per database.

### 2. Use it in code

```ts
import { db } from '#/db'
import { users } from '#/db/schema'

const allUsers = await db.select().from(users)
```

### Health check

`GET /api/health` runs a trivial query against `DB` and reports whether the database connection is working — useful for confirming a new environment is wired up correctly:

```bash
curl http://localhost:3000/api/health
```


## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```



## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    getServerTime().then(setTime)
  }, [])
  
  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).


# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.


# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
