# Holded global billing contacts by company

## Context

EXPERT's global Holded account is the seller accounting destination for EXPERT invoices. Client Holded integrations are separate and remain scoped by `client_integrations.company_id`.

The legacy helper `syncSubscriptionToHolded` identifies an EXPERT Holded customer contact by email. A single EXPERT login can now own multiple contracting entities (for example a company and an individual entrepreneur) using the same delivery email, so email alone is not a safe fiscal identity key.

## Required behavior

- New subscription/order/quote accounting syncs must carry `company_id`.
- Resolve the EXPERT Holded customer contact from an `external_mappings` row scoped as:
  - provider: `holded`
  - local_entity: `companies`
  - local_id: `<company_id>`
  - external_entity: `holded_contact`
- If a mapping exists, use only that mapped contact.
- If no mapping exists, do not silently reuse a contact solely because the email matches another entity.
- Do not merge, rename, delete or reassign historical Holded contacts automatically.
- If an existing Holded contact is ambiguous or already mapped to another company, stop and require manual review.
- Preserve the current duplicate-invoice guard: `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` by default.
- Add tests for two companies sharing one login/email.

## Rollout

Implement as a separate code-only PR after entity-scoped billing is merged. No production data migration is required. Existing mappings and Holded contacts remain untouched.
