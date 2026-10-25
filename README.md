# ÉCHO — version web (PWA)

Jeu mobile de labyrinthe dans le noir : un écho révèle les murs… et attire les Ombres.
Publié sur GitHub Pages : https://aulit42369.github.io/Echo/ (7 langues, hors ligne après la première visite).

L'appli Android (Kotlin natif) et la source des traductions (`i18n/strings.json`, `tools/gen_i18n.py`)
vivent dans `F:\Stream\files\JEUX\Echo-PlayStore-1.1.0\Echo`, pas ici.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | tout le jeu (canvas, sons, menus, niveaux) |
| `defi.js` | défi du jour commun aux 4 jeux (date de Paris, graine, série, partage) — **copie identique** dans LUMEN, Fragments, Résonance |
| `share-card.js` | carte image 1080×1920 du défi (format story) + partage avec fichier, sinon téléchargement |
| `autres-jeux.js` | pastille « AUTRES JEUX » de l'accueil et panneau des 3 autres jeux d'Aulit |
| `sw.js` | service worker (cache `echo-vX.Y`) |
| `manifest.webmanifest`, `icons/`, `screenshots/` | installation PWA |
| `privacy.html` | confidentialité, conditions d'utilisation, mentions légales (7 langues) |
| `404.html`, `sitemap.xml`, `og-image.png` | page introuvable, plan du site, image d'aperçu des liens |
| `tests/` | tests automatiques |

## Tests

Depuis ce dossier : `node --test` (Node 24, aucune dépendance). Ne pas écrire `node --test tests/`.
Après un changement voulu du défi ou du labyrinthe : `MAJ_PARITE=1 node --test`, puis recopier `tests/parite-android.json`
dans `app/src/test/resources/` du projet Android (test de parité `PariteTest.kt`).

Textes : `i18n/strings.json` du projet Android puis `python tools/gen_i18n.py` (écrit directement le bloc `<i18n:auto>` de ce `index.html`).

## Mise en ligne

GitHub Desktop → commit → Push origin. À chaque changement d'un fichier du jeu, monter `VERSION` dans `sw.js`.
