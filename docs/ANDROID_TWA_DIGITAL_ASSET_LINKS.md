# Configuration Digital Asset Links pour Android (TWA / PWABuilder)

Ce document décrit la configuration nécessaire pour permettre à la future application Android (Trusted Web Activity - TWA) de **VraiPrix Maroc** de s'ouvrir en plein écran natif, **sans afficher la barre d'adresse du navigateur (Chrome CCT)**.

---

## 1. Pourquoi le fichier `assetlinks.json` est-il indispensable ?

Lorsqu'une application Android ouvre une PWA via une **Trusted Web Activity (TWA)**, le système d'exploitation Android et le moteur Chrome vérifient que l'application Android et le site web appartiennent bien à la même entité.

Pour prouver cette association bilatérale :
- L'application Android déclare le nom de domaine qu'elle souhaite afficher.
- Le site web publie à sa racine le fichier `/.well-known/assetlinks.json` contenant :
  1. Le **Package Name** exact de l'application Android (ex. `ma.vraiprix.app`).
  2. L'empreinte numérique **SHA-256** du certificat réel utilisé pour signer l'APK.

**Si cette vérification réussit :**
- L'application s'exécute comme une application 100% native (pas d'URL affichée, pas de barre d'adresse, immersion complète).

**Si la vérification échoue ou si le fichier est absent :**
- Chrome affiche une barre d'adresse avec l'URL en haut de l'écran par mesure de sécurité.

---

## 2. Emplacement et publication

Le fichier doit être servi impérativement en HTTPS direct à l'adresse exacte :

```
https://[VOTRE-DOMAINE-DEFINITIF]/.well-known/assetlinks.json
```

Dans ce projet :
- Le modèle source est situé dans `/public/.well-known/assetlinks.json`.
- Lors du build (`npm run build`), Vite copie automatiquement ce dossier dans `/dist/.well-known/assetlinks.json`.
- Le fichier `/public/_headers` est configuré pour que **Cloudflare Pages** serve ce fichier avec le bon type MIME (`application/json; charset=utf-8`) et les en-têtes CORS appropriés.

---

## 3. Données à renseigner lors de la génération de l'APK

Le fichier `/public/.well-known/assetlinks.json` actuel contient deux espaces réservés explicites :

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "A_REMPLACER_PAR_LE_PACKAGE_NAME_REEL",
      "sha256_cert_fingerprints": [
        "A_REMPLACER_PAR_LE_SHA256_REEL_DU_CERTIFICAT"
      ]
    }
  }
]
```

### A. Le Package Name (`package_name`)
- Doit correspondre **exactement** à l'identifiant d'application configuré dans PWABuilder ou dans le projet Android (ex. `ma.vraiprix.app`).
- Sensible à la casse (généralement en minuscules).

### B. L'empreinte du certificat (`sha256_cert_fingerprints`)
- Doit correspondre au **certificat réel** ayant servi à signer l'APK :
  - **Signature manuelle (Keystore de release) :** Obtenez l'empreinte avec `keytool -list -v -keystore mon-keystore.jks` (format hexadécimal séparé par des deux-points, ex. `14:6D:E9:...`).
  - **Google Play App Signing :** Si vous publiez sur le Google Play Store avec la signature gérée par Google, l'empreinte SHA-256 à utiliser est celle fournie dans la console Google Play (*Configuration > Intégrité de l'application > Certificat de clé de signature d'application*).
  - **PWABuilder :** PWABuilder fournit directement le SHA-256 et le fichier `assetlinks.json` prêt à l'emploi après la génération du package.

> ⚠️ **Important :** Si vous changez de clé de signature, régénérez un keystore ou changez de mode de signature, le SHA-256 change et le fichier `assetlinks.json` doit être mis à jour immédiatement sur le serveur sous peine de voir réapparaître la barre d'adresse.

---

## 4. Outils de vérification officielle

Une fois déployé sur votre domaine réel, vous pourrez tester la validité de l'association avec :
- L'outil de test officiel Google :
  `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://[VOTRE-DOMAINE]&relation=delegate_permission/common.handle_all_urls`
- L'outil d'analyse PWABuilder ou l'inspecteur TWA d'Android Studio.
