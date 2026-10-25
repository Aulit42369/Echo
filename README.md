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
| `sw.js` | service worker (cache `echo-vX.Y`) |
| `manifest.webmanifest`, `icons/`, `screenshots/` | installation PWA |
| `privacy.html` | politique de confidentialité (7 langues) |
| `tests/` | tests automatiques |

## Tests

Depuis ce dossier : `node --test` (Node 24, aucune dépendance). Ne pas écrire `node --test tests/`.

## Mise en ligne

GitHub Desktop → commit → Push origin. À chaque changement d'un fichier du jeu, monter `VERSION` dans `sw.js`.
