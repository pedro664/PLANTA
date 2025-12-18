import 'dotenv/config';

export default {
  expo: {
    name: "EduCultivo",
    slug: "planta-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    description: "EduCultivo - Aplicativo para cuidar das suas plantas, acompanhar crescimento e conectar com uma comunidade de jardineiros.",
    primaryColor: "#2E4A3D",
    splash: {
      image: "./assets/logo-loading.png",
      resizeMode: "contain",
      backgroundColor: "#2E4A3D"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.planta.app",
      buildNumber: "1.0.0",
      requireFullScreen: false,
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSCameraUsageDescription: "Precisamos de acesso à câmera para você adicionar fotos das suas plantas e escanear QR codes para compartilhar plantas.",
        NSPhotoLibraryUsageDescription: "Precisamos de acesso à galeria para você escolher fotos das suas plantas do seu dispositivo.",
        NSPhotoLibraryAddUsageDescription: "Permitir que o app salve fotos das suas plantas na galeria.",
        CFBundleDisplayName: "EduCultivo",
        CFBundleName: "EduCultivo"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundImage: "./assets/adaptive-icon.png"
      },
      package: "com.planta.app",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      edgeToEdgeEnabled: true,
      allowBackup: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "planta-app",
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/c5aa848d-53da-44e9-aa38-eb55f3179db5"
    },
    runtimeVersion: "1.0.0",
    assetBundlePatterns: ["**/*"],
    plugins: [
      "expo-font",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#2E4A3D",
          image: "./assets/logo-loading.png",
          imageWidth: 200
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Permitir que $(PRODUCT_NAME) acesse a câmera para escanear QR codes das plantas."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Permitir que $(PRODUCT_NAME) acesse suas fotos para adicionar imagens das plantas.",
          cameraPermission: "Permitir que $(PRODUCT_NAME) acesse a câmera para tirar fotos das plantas."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "c5aa848d-53da-44e9-aa38-eb55f3179db5"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};
