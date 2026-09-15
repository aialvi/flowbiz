# Flowbiz workflow editor

A Vue 3 flow-chart editor for designing conversation automations. It loads the
assessment workflow, turns its parent-linked records into a draggable graph, and
supports creating, editing, deleting, and undoing local workflow changes.

## Prerequisites

- Node.js `24.21.0` LTS (pinned in `.nvmrc`)
- npm 11+
- Chromium for the Playwright suite (`npx playwright install chromium`)

## Setup and commands

```bash
nvm use
npm install
npm run dev
```

The development server prints its local URL. The other project commands are:

```bash
npm test                 # Vitest unit and component suite
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # logic coverage report
npm run build            # production bundle in dist/
npm run preview          # serve the production bundle locally
npm run test:e2e         # headless Chromium E2E suite
npm run test:e2e:headed  # visible Chromium E2E suite
```

For a first Playwright run, install its browser separately:

```bash
npx playwright install chromium
```

## Features

- Vue Flow canvas with custom Trigger, Send Message, Add Comment, Business
  Hours, Success, and Failure cards
- Position updates via real drag interactions
- Validated node creation for all three editable types
- Route-addressable detail drawers at `/node/:nodeId`
- Editable messages, comments, weekly hours, timezones, and attachment tiles
- Confirmed deletion with connected-edge cleanup
- Undo and redo for moves, edits, creates, and deletes
- Keyboard navigation and motion/contrast accessibility considerations
- Loading, retry, and inspected-payload fallback states

All edits are deliberately session-only. The supplied S3 resource is read-only,
and attachment uploads use in-memory browser object URLs.

## Project structure

```text
src/
  api/             live fetch, exact fallback payload, normalization, schema notes
  components/
    drawer/        per-node editors and route-driven Sheet shell
    nodes/         memoized Vue Flow node card
    ui/            shadcn-vue generated primitives
  composables/     Query mutations and history keyboard shortcuts
  pages/           canvas workspace
  router/          canvas and deep-link routes
  stores/          editable Pinia graph and history
  utils/           validation, node metadata, truncation, and time formatting
tests/
  e2e/             independent Playwright user flows
  fixtures/        deterministic copy of the inspected assessment payload
  unit/            Vitest store, utility, query, and component coverage
```

## Data and state design

TanStack Query owns the remote payload lifecycle: fetch status, errors, caching,
staleness, and retry entry points. It uses the assessment's exact required client
configuration: no focus refetch, `networkMode: 'always'`, infinite staleness, and
a one-hour garbage-collection time.

Pinia owns the editable graph. The query response hydrates it once, so a Query
remount or re-render cannot overwrite local moves or form edits. Every graph
change is issued through a TanStack Query `useMutation` command before the Pinia
action changes the graph. This keeps mutation status observable while retaining
one predictable source of truth for Vue Flow.

The store records immutable graph snapshots before changes. Use `Ctrl/Cmd+Z` to
undo and `Shift+Ctrl/Cmd+Z` to redo, or use the toolbar buttons. Shortcuts are
ignored while a text field, select, or editable region has focus so native text
undo continues to work.

## Payload shape and fallback

The live URL was fetched and inspected:

`https://respond-io-fe-bucket.s3.ap-southeast-1.amazonaws.com/candidate-assessments/payload.json`

It returns an array of seven records rather than separate `nodes` and `edges`.
Records contain `id`, `parentId`, `type`, `data`, and sometimes `name`. The app:

- converts IDs to strings;
- derives six edges from valid `parentId` links;
- maps wire type `dateTime` to editor type `businessHours`;
- maps `dateTimeConnector` plus `connectorType` to `success` or `failure`;
- extracts message text and attachment entries from `data.payload`;
- preserves seven `HH:mm` business-hour ranges and the `UTC` timezone;
- supplies descriptions and a deterministic tree layout because the source has
  neither descriptions nor positions.

The full contract and assumptions live in [src/api/schema.md](src/api/schema.md).
The bucket responded from the command line during development but did not allow
the direct browser request in local visual testing. The app therefore tries the
live endpoint for three seconds, then falls back only on network, timeout, or CORS
failure to the exact inspected copy in `src/api/payload-fallback.json`. HTTP and
schema errors remain visible instead of being hidden by the fallback. The live
browser request should be re-verified if the bucket's CORS policy changes.

## shadcn and `cn`

The project was initialized with the shadcn and shadcn-vue CLIs. Following the
September 2026 convention, `cn` is installed as a real runtime dependency.
`src/lib/utils.js` contains only:

```js
export { cn } from 'cn'
```

Generated Vue components import that re-export. There is no project-local
`clsx`/`tailwind-merge` wrapper, and those legacy direct dependencies are absent.

## Keyboard and accessibility

- Tab reaches toolbar actions and editable canvas nodes.
- Enter or Space opens the focused node; Escape closes its drawer.
- Drawer focus is trapped and restored by the shadcn-vue/Reka dialog primitive.
- A skip link moves directly to the workflow workspace.
- Status changes use polite or assertive live regions as appropriate.
- Visible focus rings, AA text contrast, explicit form labels, descriptive image
  alternatives, and reduced-motion behavior are included.
- Trigger and Success/Failure nodes remain readable but are not presented as
  editable controls.

## Testing design

Vitest uses mocked fetch calls and a seeded Query cache; no unit test hits the
network. Store behavior, payload validation/normalization, exact Query settings,
shared utilities, custom cards, creation, routing, and every drawer variant are
tested without snapshots.

Playwright starts the real Vite application. `tests/e2e/helpers.js` intercepts
only the assessment URL and returns `tests/fixtures/payload.json`, making every
test independent of S3 availability. Each test starts with a fresh page and app
state. The suite exercises real Vue Flow dragging, node/edge rendering,
deep-linking, back/forward history, uploads, all editor variants, creation,
deletion, undo/redo, and keyboard-only drawer navigation.

## Trade-offs and scope

- There is no persistence backend because the source endpoint is read-only.
  Reloading resets edits; opening and closing drawers does not.
- Uploaded file bytes are not sent anywhere and object URLs last only for the
  current page session.
- Native `input[type="time"]` controls provide the real, accessible browser time
  picker without adding a large date library. The wire format is already `HH:mm`.
- The deterministic layout is intentionally small and tailored to the supplied
  parent tree. A larger production editor would use a dedicated layout engine
  and persist viewport/position records.
- The history is capped at 100 graph snapshots to bound memory use.

## Continuous integration

`.github/workflows/ci.yml` uses Node from `.nvmrc`, installs with `npm ci`, runs
the unit suite and production build, installs headless Chromium, and then runs
the E2E suite. Build output, coverage, Playwright reports, browser results,
dependencies, and the assessment `build-prompt.md` are all ignored by Git.
