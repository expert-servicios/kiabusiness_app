# Admin correo folders API

`GET /api/admin/correo/folders`
- returns system/custom folders, counts and persisted item state.

`POST /api/admin/correo/folders`
- `{ name }` creates a custom folder.
- `{ action: 'move', sourceKind, provider, sourceKey, folderId, clientId?, companyId?, caseId? }` moves/assigns one source item idempotently.

`PATCH /api/admin/correo/folders`
- `{ id, name }` renames a custom folder.

`DELETE /api/admin/correo/folders?id=<uuid>`
- deletes a custom folder only. Source email remains intact.
