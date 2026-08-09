<p align="center">
  <img src="https://optim.tildacdn.net/tild3533-6166-4961-b232-343937646330/-/resize/302x/-/format/webp/mama_air_logo_line_o.png.webp" alt="MamaAir" width="302" />
</p>

<h1 align="center">MamaAir</h1>

<p align="center">
  A little extra support for every week of pregnancy.
</p>

<p align="center">
  <a href="https://github.com/AirborneDiseaseRisksInstitute/mamaair">Repository</a>
  ·
  <a href="#android-apk-build-history">APK build history</a>
</p>

## About MamaAir

Pregnancy comes with a lot to keep track of. MamaAir brings the everyday pieces together in one calm, simple place: daily check-ins, helpful activity ideas, wellbeing trends, environmental context, and week-by-week views for both mother and baby.

The app is there to help people feel more informed and supported along the way. It is not a substitute for medical advice, diagnosis, or care from a qualified professional.

## Related public dataset

For a closer look at MamaAir's research data work, visit the [MamaAir Kenya Public Dataset](https://github.com/MamaAir/mamaair-kenya-public-dataset). It contains privacy-preserving, synthetic 40-week maternal health journeys that combine maternal indicators with climate and air-quality context for research and AI validation.

## Android APK build history

| Date | APK version | Build | Status | Notes |
| --- | --- | ---: | --- | --- |
| 2025 Q3 | v1.0 | 1 | Internal test | First Android testing line. *Estimated — prior GitHub account history is unavailable.* |
| 2025 Q4 | v2.0 | 12 | Internal test | Early pregnancy journey and tracking iterations. *Estimated — prior GitHub account history is unavailable.* |
| 11 Mar 2026 | v2.6 | 25 | Internal test | Project baseline restored in the current GitHub account. |
| 27 May 2026 | v3.0 | 30 | Internal test | Stable tracking, local storage, daily tasks, notifications, and guidance updates. |
| 08 Aug 2026 | **v3.2** | **31** | **Latest test APK** | Current internal Android test build. |

## Development setup

Want to run MamaAir locally? You will need Node.js 20+, Java 17, Android Studio with the Android SDK, and—if you are working on iOS—Xcode and CocoaPods.

```bash
npm install
npm start
```

Then open a second terminal and choose the platform you need:

```bash
npm run android
# or, on macOS
npm run ios
```

For iOS native dependencies, run `bundle exec pod install` inside the `ios` directory when needed.

## Quality checks

Before sharing a change, run:

```bash
npm test -- --runInBand
npm run lint
```
