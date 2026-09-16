# Flowbiz workflow editor

A Vue 3 flow-chart editor for designing conversation automations. It loads the
assessment workflow, turns its parent-linked records into a draggable graph, and
supports creating, editing, deleting, and undoing local workflow changes.

## Prerequisites

- Node.js `24.21.0` LTS
- pnpm `10.13.1`
- Chromium for the Playwright suite (`pnpm exec playwright install chromium`)

## Setup and commands

```bash
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The development server prints its local URL. The other project commands are:

```bash
pnpm test                # Vitest unit and component suite
pnpm test:watch          # Vitest in watch mode
pnpm test:coverage       # logic coverage report
pnpm build               # production bundle in dist/
pnpm preview             # serve the production bundle locally
pnpm test:e2e            # headless Chromium E2E suite
pnpm test:e2e:headed     # visible Chromium E2E suite
```

For a first Playwright run, install its browser separately:

```bash
pnpm exec playwright install chromium
```

## Features

- Vue Flow canvas with custom Trigger, Send Message, Add Comment, Business
  Hours, Success, and Failure cards
- Position updates via real drag interactions
- Page-level Create New Node button for independent steps, including an empty canvas
- Validated node creation for Send Message, Add Comment, and Business Hours
- Click a node's circular `+` to insert the next step; drag from a `+` to another
  node's top dot to connect existing or newly created steps
- Route-addressable detail drawers at `/node/:nodeId`
- Editable Trigger details and independently editable/removable message texts
- Editable comments, weekly hours, 24 representative whole-hour timezones, and attachment tiles
- Custom Reka Popover time picker with separate 24-hour and 60-minute columns
- Confirmed deletion with connected-edge cleanup
- Undo and redo for moves, edits, creates, connections, and deletes
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
    ui/            reusable primitive components
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
undo and `Shift+Ctrl/Cmd+Z` to redo, or use the header buttons. Shortcuts are
ignored while a text field, select, or editable region has focus so native text
undo continues to work.

## Payload shape and fallback

The live URL was fetched and inspected which returned an array of seven records rather than separate `nodes` and `edges`.
Records contain `id`, `parentId`, `type`, `data`, and sometimes `name`. The app:

- converts IDs to strings;
- derives six edges from valid `parentId` links;
- maps wire type `dateTime` to editor type `businessHours`;
- maps `dateTimeConnector` plus `connectorType` to `success` or `failure`;
- preserves each message text and attachment entry from `data.payload` independently;
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

## Implementation and UI primitives

The workflow graph normalization, deterministic layout, insertion/rewiring,
history, node caching, validation, editors, and time-option generation are
project-specific implementations. Vue Flow provides the canvas, and accessible
low-level dialogs, sheets, and select behavior are implemented with Reka UI
primitives; no third-party workflow-editor implementation is copied.

## Keyboard and accessibility

- Tab reaches toolbar actions and editable canvas nodes.
- Enter or Space opens the focused node; Escape closes its drawer.
- Drawer focus is trapped and restored by the Reka dialog primitive.
- A skip link moves directly to the workflow workspace.
- Status changes use polite or assertive live regions as appropriate.
- Visible focus rings, AA text contrast, explicit form labels, descriptive image
  alternatives, and reduced-motion behavior are included.
- Trigger, Send Message, Add Comment, and Business Hours nodes are keyboard-accessible.
- Success and Failure remain display-only and expose no drawer or add action.

## Validation

Validation is centralized in `src/utils/validation.js` and repeated in the Pinia
update boundary for defense in depth. It covers required title/description
fields, their length limits, supported node types and timezones, valid and
non-equal business-hour times, individual message-text limits and empty entries,
optional comment length, attachment count, and a 10 MB per-file upload limit.
Connection validation rejects missing nodes, self-links, duplicate edges, loops,
and shortcuts to existing descendants at any depth. Invalid top-dot targets turn
gray with a not-allowed cursor during a drag. Nodes without an ancestor/descendant
relationship can still connect. Connections into the Trigger or display-only
Success/Failure cards remain blocked. Manual
connections live in the graph's edge list; `parentId` retains payload/branch ownership.
Errors are linked to their controls with `aria-invalid` and `aria-describedby`.
Overnight schedules remain valid because an end time earlier than the start time
is a legitimate cross-midnight range.

## Rendering and motion decisions

Vue Flow receives stable custom node objects through a `WeakMap` cache, and node
templates use `v-memo` so an unrelated edit does not redraw every card. A
computed set of nodes with outgoing edges makes terminal-state lookup linear for
the graph instead of scanning every edge for every node. Drawer motion lasts
200 ms and animates transform/opacity, with a compositor hint while avoiding
backdrop blur. `prefers-reduced-motion` reduces all animations. Production code
is split into app, Vue Flow, and Reka chunks for better browser caching.

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

The V8 coverage report targets state, API normalization, composables, and shared
utilities, where line coverage is most meaningful. Vue components have direct
Vitest interaction tests—including Select and TimePicker contracts—and are also
exercised through the real Chromium suite rather than relying on snapshots.

## Trade-offs and scope

- There is no persistence backend because the source endpoint is read-only.
  Reloading resets edits; opening and closing drawers does not.
- Uploaded file bytes are not sent anywhere and object URLs last only for the
  current page session. Removing a file retains its URL until page unload so undo
  can restore the preview, not just its metadata.
- Business Hours uses a custom two-column Reka Popover time picker so popup
  colors match the theme and every minute remains selectable. It emits the API's
  existing `HH:mm` wire format without a date library.
- The deterministic layout is intentionally small and tailored to the supplied
  parent tree. A larger production editor would use a dedicated layout engine
  and persist viewport/position records.
- The history is capped at 100 graph snapshots to bound memory use.

## Continuous integration

`.github/workflows/ci.yml` uses Node from `.nvmrc` and pnpm `10.13.1`, performs a
frozen-lockfile install, runs the unit suite and production build, installs
headless Chromium, and then runs the E2E suite. Build output, coverage,
Playwright reports, browser results, and dependencies are all ignored by Git.
