<p align="center">
  <img src="src/assets/images/logoBlack.png" alt="MamaAir" width="240" />
</p>

<h1 align="center">MamaAir</h1>

<p align="center">
  Pregnancy wellbeing and environmental health guidance for everyday life.
</p>

<p align="center">
  <a href="https://mamaair.africa/">Website</a>
  ·
  <a href="https://github.com/AirborneDiseaseRisksInstitute/mamaair/releases">Android releases</a>
  ·
  <a href="https://github.com/MamaAir/mamaair-kenya-public-dataset">Public research dataset</a>
  ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <a href="https://github.com/AirborneDiseaseRisksInstitute/mamaair/actions/workflows/ci.yml">
    <img src="https://github.com/AirborneDiseaseRisksInstitute/mamaair/actions/workflows/ci.yml/badge.svg?branch=develop" alt="CI status" />
  </a>
</p>

## Product overview

MamaAir brings pregnancy planning, daily check-ins, practical wellbeing actions,
week-by-week guidance, and local environmental context into one mobile
experience. It is designed to help pregnant people understand the factors that
shape their day and take manageable, relevant actions.

Core experiences include:

- pregnancy onboarding and profile management;
- personalized Daily Plans and action completion tracking;
- symptom, feeling, lifestyle, and wellbeing check-ins;
- location-aware air quality, weather, and UV context;
- mother and baby week-by-week views;
- reminders, background tracking, and selected offline persistence;
- English, French, and Swahili localization.

MamaAir provides educational and wellbeing support. It is not a substitute for
medical advice, diagnosis, emergency services, or care from a qualified health
professional.

## Project status

MamaAir is under active development. Android is the current release target;
iOS project files are maintained for development but are not part of the
current release scope.

The latest published Android build is
[v2.3, build 31](https://github.com/AirborneDiseaseRisksInstitute/mamaair/releases/tag/v2.3),
published on 11 August 2026. The `develop` branch contains newer, unreleased
work and is the active integration branch.

## Technical overview

The application is built with React Native and TypeScript. Its main boundaries
are intentionally kept separate:

| Area                                    | Responsibility                                            |
| --------------------------------------- | --------------------------------------------------------- |
| `src/screens`                           | User-facing application flows and navigation destinations |
| `src/components`                        | Shared UI and feature components                          |
| `src/services/api`                      | Authenticated backend communication                       |
| `src/services/recommendationExperience` | Daily Plan, recommendation, and longitudinal experience logic |
| `src/services/tracking`                 | Location and background tracking coordination             |
| `src/services/sync`                     | Background synchronization orchestration                  |
| `src/store`                             | Persisted application and session state                   |
| `src/i18n`                              | English, French, and Swahili translations                 |

The backend remains the source of truth for authenticated profile and health
experience data. Selected user-entered state is persisted locally for continuity,
while network-backed content still requires API availability.

## Data integrity and validation

Authenticated profile, health-experience, and environmental data comes from
MamaAir backend services. The repository also includes typed, privacy-safe
reference trajectories for deterministic automated testing and validation of
longitudinal experiences. Reference fixtures are isolated from production data
paths and never replace authenticated backend data or user-entered health
information.

The related
[MamaAir Kenya Public Dataset](https://github.com/MamaAir/mamaair-kenya-public-dataset)
contains privacy-preserving synthetic maternal health journeys that combine
maternal indicators with climate and air-quality context for research and AI
validation.

## Development setup

### Requirements

- Node.js 20 or newer
- Java 17
- Android Studio and an Android SDK compatible with API 36
- Xcode and CocoaPods only when working on the iOS project

Install the exact JavaScript dependency tree and start Metro:

```bash
npm ci
npm start
```

In a second terminal, run the Android application:

```bash
npm run android
```

Developers on networks that cannot reliably reach the official Google and
Maven repositories can explicitly enable the configured regional mirrors:

```bash
MAMAAIR_USE_REGIONAL_MAVEN_MIRRORS=true npm run android
```

Official repositories remain the default for local development and CI.

## Quality checks

Run the complete local verification pipeline with:

```bash
npm run verify
```

This command performs TypeScript checking, ESLint validation, and the Jest test
suite. GitHub Actions runs the same checks and builds an Android debug APK for
every pull request and every push to `master` or `develop`.

## Android release signing

Release artifacts require a dedicated upload key. Configure these values
outside the repository, such as in `~/.gradle/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=/absolute/path/to/upload-key.jks
MYAPP_UPLOAD_STORE_PASSWORD=replace-with-local-secret
MYAPP_UPLOAD_KEY_ALIAS=replace-with-key-alias
MYAPP_UPLOAD_KEY_PASSWORD=replace-with-local-secret
```

Then build the Android App Bundle:

```bash
cd android
./gradlew bundleRelease
```

The build fails if release signing is incomplete. It never falls back to the
debug certificate.

## Security and privacy

- Do not commit passwords, tokens, signing keys, production exports, or user data.
- Firebase client configuration must be protected with the appropriate platform
  and API restrictions in the provider console.
- Report suspected vulnerabilities through the private process in
  [`SECURITY.md`](SECURITY.md), not a public issue.
