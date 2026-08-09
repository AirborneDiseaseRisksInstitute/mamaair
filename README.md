<p align="center">
  <img src="https://optim.tildacdn.net/tild3533-6166-4961-b232-343937646330/-/resize/302x/-/format/webp/mama_air_logo_line_o.png.webp" alt="MamaAir" width="302" />
</p>

<h1 align="center">MamaAir</h1>

<p align="center">
  A pregnancy companion for everyday wellbeing, environmental awareness, and a clearer week-by-week journey.
</p>

<p align="center">
  <a href="https://github.com/AirborneDiseaseRisksInstitute/mamaair">Repository</a>
  ·
  <a href="#android-apk-build-history">APK build history</a>
</p>

## About MamaAir

MamaAir is a React Native mobile application that helps expectant mothers follow their pregnancy journey with personalised daily check-ins, activity plans, wellbeing trends, environmental context, and mother/baby progress views.

It is designed to present supportive, easy-to-understand information. It does not replace professional medical advice, diagnosis, or care.

## Android APK build history

| Date | APK version | Build | Status | Notes |
| --- | --- | ---: | --- | --- |
| 2025 Q3 | v1.0 | 1 | Internal test | First Android testing line. *Estimated — prior GitHub account history is unavailable.* |
| 2025 Q4 | v2.0 | 12 | Internal test | Early pregnancy journey and tracking iterations. *Estimated — prior GitHub account history is unavailable.* |
| 11 Mar 2026 | v2.6 | 25 | Internal test | Project baseline restored in the current GitHub account. |
| 27 May 2026 | v3.0 | 30 | Internal test | Stable tracking, local storage, daily tasks, notifications, and guidance updates. |
| 08 Aug 2026 | **v3.2** | **31** | **Latest test APK** | Current internal Android test build. |

> The 2025 entries are a reconstruction because the former GitHub account was replaced and its build history is not available here. APKs in this table are internal testing builds, not Play Store releases.

## Development setup

**Requirements:** Node.js 20+, Java 17, Android Studio/SDK for Android, and Xcode/CocoaPods for iOS.

```bash
npm install
npm start
```

In a second terminal, run one of the following:

```bash
npm run android
# or, on macOS
npm run ios
```

For iOS native dependencies, run `bundle exec pod install` from the `ios` directory when needed.

## Quality checks

```bash
npm test -- --runInBand
npm run lint
```
