// Release derlemesini ~/.android-keys/cetele-upload.properties içindeki yükleme anahtarıyla imzalar.
// Dosya yoksa (ör. EAS bulut derlemesi) Expo'nun varsayılanı kullanılır.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARK = '// cetele-release-signing';

module.exports = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes(MARK)) return cfg;
    g = g.replace(
      /signingConfigs \{/,
      `signingConfigs {
        ${MARK}
        def keyProps = new Properties()
        def keyFile = new File(System.getProperty("user.home"), ".android-keys/cetele-upload.properties")
        if (keyFile.exists()) keyFile.withInputStream { keyProps.load(it) }
        if (keyProps.storeFile) {
            upload {
                storeFile file(keyProps.storeFile)
                storePassword keyProps.storePassword
                keyAlias keyProps.keyAlias
                keyPassword keyProps.keyPassword
            }
        }`,
    );
    g = g.replace(
      /(release \{[^}]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.findByName("upload") ?: signingConfigs.debug',
    );
    cfg.modResults.contents = g;
    return cfg;
  });
