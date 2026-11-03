# Sayaç / Counter

Hedeften geriye sayan sayaç ve gün sayacı. Çevrimdışı çalışan PWA.

- **Sayaç:** Hedef girilirse hedeften 0'a düşer, girilmezse ileri sayar.
- **Gün:** Gün sayısı (ör. 10) girilir, her gece yarısı bir düşer.

Telefona kurulum: GitHub Pages linkini aç → Android: menü › Ana ekrana ekle · iPhone: Paylaş › Ana Ekrana Ekle.

## Android uygulaması (`app/`)

Aynı uygulamanın Expo (React Native) ile yazılmış yerel Android sürümü. Telefon diline göre "Sayaç" ya da "Counter" adıyla görünür. Paket adı: `com.fatihgoren.cetele`.

```bash
cd app
npm install
npm run check                 # lint + typecheck + test
npx expo run:android          # emülatörde/cihazda çalıştır
npx eas-cli@latest build -p android --profile production   # Play Store için .aab
npx eas-cli@latest submit -p android                       # Play Console'a yükle
```

Mağaza metinleri ve görselleri: `app/store/`. Gizlilik politikası: `privacy.html`.
