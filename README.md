# NextJS Convex Starter App

This is a starter application using NextJS and Convex, managed with Turbo for monorepo capabilities.

## Getting Started

### Pre-requisites

- Node.js 22 or later
- pnpm package manager
- Convex account - Register at https://www.convex.dev/

### Setup

1. Run `pnpm install` to install the dependencies
2. Run `pnpm run setup` to initialize the Convex backend and configure the webapp

   - **Bumps minor version** — When branding is customized, increments the minor version across all workspace `package.json` files (root is canonical). This updates `services/backend/package.json`, which triggers the Production Deployment workflow on push to `master`.

   This script will:
   - **Check and update branding** - Detects if you're using template branding and prompts you to customize:
     - Application name and short name
     - App description
     - Landing page title
     - Package name
   - Initialize the Convex backend using `npx convex dev --once`
   - Extract the CONVEX_URL from the backend's .env.local file
   - Create/update the webapp's .env.local file with the NEXT_PUBLIC_CONVEX_URL
   - Assign a random `PORT` in the IANA ephemeral range (49152–65535) to `apps/webapp/.env.local` if not already configured

   The setup script is **idempotent** - you can run it multiple times safely. It will:
   - Show ✅ CONFIGURED for branding that's already customized
   - Show ⚠️ TEMPLATE for branding that still uses default values
   - Only prompt for updates if template values are detected

   **Non-Interactive Mode**: For CI/CD or automated setups:

   ```bash
   bun scripts/setup.ts --non-interactive \
     --app-name "My App" \
     --app-short-name "MyApp" \
     --app-description "Description" \
     --landing-page-title "Welcome" \
     --package-name "my-app"

   # Or skip branding entirely
   bun scripts/setup.ts --skip-branding

   # Show all options
   bun scripts/setup.ts --help
   ```

3. Run `pnpm dev` in the root directory to start the NextJS application and Convex backend

   After pulling schema changes, run `pnpm migrate` while `convex dev` is running (see [AGENTS.md](AGENTS.md#database-migrations)).

#### Manual Setup (Alternative)

If you prefer to set up manually:

1. Go to `services/backend` and run `npx convex dev --once` - this should prompt you to login to Convex and create a new project.
   Note: This will create a .env.local file with the CONVEX_URL environment variable.
2. Create a `.env.local` file in the `apps/webapp` directory and add the following:
   ```sh
   NEXT_PUBLIC_CONVEX_URL=<your-convex-project-url> # copy this from the backend .env.local file
   ```
3. Run `pnpm dev` in the root directory to start both services

## Deployment

The included [production workflow](.github/workflows/deploy-prod.yml) deploys both
Convex and Vercel. Deployment credentials and environment-specific values are
kept together as GitHub Actions repository secrets and variables, so they do
not need to be committed or duplicated across repository files.

### 1. Create the production projects

1. In the [Convex dashboard](https://dashboard.convex.dev), open the production
   deployment and copy its deployment URL. Generate a production deploy key from
   **Project Settings → Settings → General**.
2. Import the repository into Vercel and set its **Root Directory** to
   `apps/webapp`. No application environment variables need to be added in
   Vercel for the default template deployment; the workflow supplies
   `NEXT_PUBLIC_CONVEX_URL` during the production build.
3. Create a Vercel access token. Run `pnpm exec vercel link --repo` from the
   repository root if needed, then read the `apps/webapp` entry in
   `.vercel/repo.json` to obtain its `orgId` and `id`. Do not commit the
   `.vercel` directory.

### 2. Configure GitHub Actions secrets and variables

Open **GitHub repository → Settings → Secrets and variables → Actions → New
repository secret** and add:

| Secret                   | Value                                          |
| ------------------------ | ---------------------------------------------- |
| `CONVEX_DEPLOY_KEY_PROD` | Convex production deploy key                   |
| `VERCEL_TOKEN`           | Vercel access token with access to the project |

Then open the **Variables** tab, create these repository variables, and add:

| Variable                 | Value                                    |
| ------------------------ | ---------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex production deployment URL         |
| `VERCEL_TEAM_ID`         | `orgId` from Vercel project metadata     |
| `VERCEL_PROJECT_ID`      | `projectId` from Vercel project metadata |
| `VERCEL_USER_EMAIL`      | Email of a Vercel team member (required) |

These are the only production deployment values required by the default
workflow. Additional build-time values can follow the same pattern: store them
as GitHub Actions secrets and expose them only to the frontend build job. Values
that must remain available to server functions at runtime should be configured
in Vercel or passed explicitly by a customized deploy step.

The frontend deployment rewrites the latest commit's author email in the CI
runner's local checkout before invoking the Vercel CLI. Set `VERCEL_USER_EMAIL`
to an email address associated with a member of the Vercel team so Vercel can
identify the deployment author. The amended commit is local to the workflow and
is never pushed back to the repository.

The workflow recreates Vercel's repository-level monorepo link in
`.vercel/repo.json`. It also writes the transient, settings-only project metadata
that `vercel build` expects beneath `apps/webapp`; project identity remains in
the repository link. Both build and deploy run from the repository root. The
workflow intentionally does not run `vercel pull`, so Vercel project environment
variables are not downloaded into CI.

### 3. Deploy

Push a deployment-related change to `master`. Convex deployment and the Vercel
build start in parallel, so the backend is not blocked by frontend CLI setup or
build time. The workflow then:

1. Deploys Convex and runs pending idempotent migrations.
2. Builds the Vercel production output exactly once.
3. Promotes that prebuilt output only after the requested backend deployment and
   migrations succeed.

The workflow runs for changes under `apps/webapp`, `packages/shared`, or
`services/backend`, as well as workspace and deployment configuration files. It
can also be started from **GitHub Actions → Production Deployment → Run
workflow**, where backend and frontend deployment can be enabled independently.

> If you forked this template with existing git history, workflows only run on
> new pushes after the workflow file exists; they are not replayed for old
> commits.

## System Administration Setup

To create a system administrator:

1. **Login anonymously** via the login page
2. **Set admin privileges** in [Convex Dashboard](https://dashboard.convex.dev):
   - Go to Data > `users` table
   - Find your user record and set `accessLevel` to `"system_admin"`
3. **Access admin dashboard** by clicking your username → "System Admin"

System admins can configure Google OAuth, manage authentication providers, and access system settings.

## Google Auth Setup

To enable Google OAuth authentication:

1. **Configure Google OAuth** in your app's admin dashboard:
   - Login with your system admin account
   - Go to your username → "System Admin" → "Google Auth Config"
   - Follow the instructions to set up Google OAuth credentials
2. **Transfer admin role to Google account** (Recommended):
   - After Google Auth is configured, sign in with your Google account
   - In [Convex Dashboard](https://dashboard.convex.dev), go to Data > `users` table
   - Find your Google account user record and set `accessLevel` to `"system_admin"`
   - Remove the `system_admin` access level from the temporary anonymous account

This ensures your system admin access is tied to a verified Google account for better security.

## Project Structure

- `apps/webapp`: The frontend NextJS application
- `services/backend`: The Convex backend service

## Development

To run both the frontend and backend in parallel:

```bash
pnpm run dev
```

This will start:

- The webapp at http://localhost:<PORT> (see `PORT` in `apps/webapp/.env.local`, assigned during setup)
- The Convex backend development server

## Documentation

- **[Shadcn → Base UI Migration Guide](docs/developer/shadcn-base-ui-migration.md)** — upgrading UI components from Radix-based shadcn to Base UI (`base-vega`); includes a downstream migration playbook for forks built on this template.
- [Testing Guide](guides/testing/testing.md)
- [AGENTS.md](AGENTS.md) — development guidelines for agents and contributors

## Testing

This project uses [Vitest](https://vitest.dev/) for testing across both frontend and backend.

### Quick Start

Run all tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

For comprehensive testing guidelines, conventions, and examples, see the [Testing Guide](guides/testing/testing.md).

## Turbo Configuration

This project uses Turbo to manage the monorepo and run tasks in parallel. The main configuration files are:

- `turbo.json`: Main Turbo configuration
- `apps/webapp/package.json`: Webapp project configuration
- `services/backend/package.json`: Backend project configuration

The dev command is configured to run both services in parallel without dependencies between them, allowing for independent development.

## Adding New Projects

To add a new project to the monorepo:

1. Create the project in the appropriate directory (`apps/` or `services/`)
2. Add a `project.json` file to define the project's targets
3. Update the root `package.json` to include the new project in the dev command if needed

<br/>

# FAQ

## Why Convex?

Convex is chosen as the backend service for the following reasons:

1. **Simplicity of code generation and architecture**

   Convex follows a reactive paradigm that allows reactive queries from the client to cause automatic re-renders when a dataset has been updated. This significantly reduces complexity and amount of code required, while solving the problem of cache invalidation.

   Simple and less code required for a feature also means fewer chances for AI generated code to be incorrect.

2. **Transactionality and consistency**

   All convex mutations run "inside" of the database. Any error thrown in the mutation will result in an automatic rollback. This ensures that we are able to use a single language for both querying data and business logic, while maintaining transactionality.

3. **Simple end to end reactivity**

   Many platforms offer subscription to DB events (e.g. firebase, supabase). However, it still leaves a significant amount of code to transform the event into the actual state for your application. Convex solves this by simply providing the full state for the query's data, and does a re-render of that state when the data has been updated.

4. **Single language for frontend and backend**
