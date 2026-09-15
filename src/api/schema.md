# Assessment payload

Fetched and inspected the live S3 endpoint on 2026-09-15. The exact response is
checked in as `tests/fixtures/payload.json` for deterministic tests and as
`src/api/payload-fallback.json` for browsers where the bucket blocks cross-origin
requests. The app always attempts the live URL first and only uses this exact
inspected copy after a network or browser CORS failure.

The response is an **array of seven records**, not a `{ nodes, edges }` object.
Each record has `id: string | number`, `parentId: string | number`, `type: string`,
`data: object`, and optional `name`. The root has id `1`, parentId `-1` and no name.
There are no positions, descriptions or explicit edges.

| Wire type | Editor type | Wire data |
| --- | --- | --- |
| trigger | trigger | type: conversationOpened, oncePerContact: boolean |
| sendMessage | sendMessage | payload: array of text or attachment records |
| addComment | addComment | comment: string |
| dateTime | businessHours | action: businessHours, times, timezone, connectors |
| dateTimeConnector | success / failure | connectorType: success or failure |

Text payload entries use `{ type: 'text', text }`; attachments use
`{ type: 'attachment', attachment: URL }`. Time entries use
`{ day: 'mon'..'sun', startTime: 'HH:mm', endTime: 'HH:mm' }`. The live timezone is
`UTC`. The business-hours connectors array contains the success and failure IDs.

Normalization converts all IDs to strings and derives one edge from each valid
parent link (six edges in this fixture). Positions come from a deterministic tree
layout; disconnected nodes receive their own columns. Titles use `name`, with a
fallback for the unnamed trigger. Descriptions are editor defaults because the
source does not provide them. Text entries are joined with newlines. Attachment
URLs remain unchanged. Missing days become closed; multiple ranges are retained.

Editor nodes use `{ id, type, position: { x, y }, data }`; data contains `title`,
`description`, and type-specific `message`, `attachments`, `comment`, `times`, or
`timezone`. Branches additionally retain `parentId`. The raw server response is
owned by Query; Pinia owns the editable normalized graph. No edits are sent to
the read-only S3 endpoint. File content and graph changes last for this session.
