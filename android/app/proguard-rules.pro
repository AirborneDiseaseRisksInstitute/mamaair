# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native and Hermes
-keep class com.facebook.** { *; }
-keep class com.swmansion.** { *; }
-keep class com.reactnative.** { *; }
-keep class com.google.** { *; }
-keep class com.notifee.** { *; }
-keep class com.transistorsoft.** { *; }
-keep class com.squareup.okhttp3.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }

# Kotlin coroutines
-keep class kotlinx.** { *; }

# Gson / Jackson
-keep class com.google.gson.** { *; }
-keep class com.fasterxml.jackson.** { *; }

# Suppress missing classes reported by R8
-dontwarn javax.lang.model.element.Modifier

# Keep react-native generated classes
-keepclassmembers class * {
  @com.facebook.proguard.annotations.DoNotStrip *;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Do not strip enum method names
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
