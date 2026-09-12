-- Restore the review fields used by the current application without deleting or rewriting history.
-- Production preflight on 2026-09-06 found 0 rows in review_requests and reviews.

alter table public.review_requests
  add column if not exists token text,
  add column if not exists expires_at timestamptz;

create unique index if not exists review_requests_token_unique
  on public.review_requests (token)
  where token is not null;

alter table public.reviews
  add column if not exists allow_publish boolean not null default false,
  add column if not exists status text not null default 'pending',
  add column if not exists featured boolean not null default false;

-- Keep the existing `published` compatibility column untouched. New application
-- code continues to use allow_publish + status; no historical rows are mutated.
