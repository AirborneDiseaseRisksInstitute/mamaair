# Contributing to MamaAir

Thank you for helping improve MamaAir. Changes should preserve the reliability,
privacy, and clarity expected from a pregnancy wellbeing application.

## Development workflow

1. Branch from `develop` and keep each pull request focused.
2. Install the locked dependency tree with `npm ci`.
3. Follow the existing TypeScript, component, service, and localization patterns.
4. Run `npm run verify` before opening a pull request.
5. Build the Android debug application when changing native configuration,
   dependencies, assets, permissions, or background behavior.

Use concise, professional commit messages that describe the change, such as:

```text
fix: restore location tracking after process restart
feat: connect account deletion to the authenticated API
chore: improve repository dependency hygiene
```

## Product and safety expectations

- Do not invent or alter medical recommendations without product and domain
  approval.
- Keep non-production reference fixtures typed, centralized, clearly identified,
  and separate from authenticated user data.
- Add user-facing copy to English, French, and Swahili localization files.
- Preserve accessibility, loading, empty, offline, and error states.
- Avoid broad rewrites when an incremental change can preserve working behavior.

## Security and privacy

Never commit passwords, access tokens, signing keys, production exports, exact
user locations, personal health information, or internal API and agent working
documents. Use sanitized fixtures in tests and examples.

Report suspected vulnerabilities using the private process in
[`SECURITY.md`](SECURITY.md), not a public issue.

## Pull requests

Describe the behavior changed, the verification performed, and any known
limitations. Include screenshots or recordings for visible UI changes and list
the Android devices or API levels used for manual testing when relevant.
