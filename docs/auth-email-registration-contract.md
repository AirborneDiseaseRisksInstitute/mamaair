# Email registration contract

## Current contract (updated 2026-09-28)

`POST /api/auth/email/register/` accepts `email`, `password`, and
`password_confirm`. The backend stores the submitted password for the new
account and sends a verification email. The emailed page only confirms the
email address; it must not ask the user to choose or replace the password.
The checked-in `schema.yaml` predates these email endpoints.

The live registration schema lists 202, 400, and 503 responses; the proposed
409 account-state codes and 429 rate-limit contract are not documented yet.

The mobile UI collects the email, password, and password confirmation. It
requires the password fields to match, then sends the selected password in
both API password fields. The app does not call the verification endpoint;
the emailed web page owns email confirmation and directs the user back to
mobile sign-in.

The rest of the registration behavior remains:

- `POST /api/auth/email/register/`: create an unverified account, retain the
  submitted password, and send a verification link. Do not allow login before
  verification.
- `POST /api/auth/email/resend/`: send a new verification link for an
  eligible unverified account. Do not change its password.
- Repeated registration must never replace an existing password or create
  another account. Match email case-insensitively. Return the agreed
  `account_exists` or `email_verification_required` code with HTTP 409;
  keep disabled-account status private. Preserve 400 validation and 429
  rate-limit responses.

Check new and existing email, expired/used tokens, resend, login before
verification, verification without changing the chosen password, login with
the chosen password after verification,
Google-created accounts, disabled accounts, and rate limits.

## Abuse protection

The retired shared `X-API-Key` was removed from the mobile client on
2026-10-01. The live email-authentication and token endpoints were verified to
accept requests without that header, and the current live OpenAPI schema no
longer declares it. Backend rate limits and abuse controls must remain the
protection for public registration and password-reset endpoints. The checked-in
legacy `schema.yaml` still documents the older `/api/auth/register/` contract
and must not be used as the current email-registration contract.
