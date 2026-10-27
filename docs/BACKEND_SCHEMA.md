# ÉCHO — schéma des données

**Aucun serveur, aucune base de données, aucun compte.** Tout est stocké sur l'appareil du joueur (localStorage du navigateur,
ou stockage de l'appli Android). Aucun appel réseau en dehors du chargement des fichiers du site.

## Stockage local (localStorage)
| Clé | Contenu | Écrit par |
|---|---|---|
| `echo_best` | Record (niveau atteint) | `js/logique.js` (via `store` de `js/appareil.js`, préfixe `echo_`) |
| `echo_stars_<n>` | Étoiles du niveau n | `js/logique.js` |
| `echo_easy`, `echo_realistic`, `echo_audio`, `echo_gyro` | Options | `js/logique.js` (écran Options) |
| `echo_lang` | Langue choisie (index parmi 7) | `js/logique.js` |
| `echo_daily_AAAAMMJJ` | Meilleur score du défi de ce jour (date de Paris), une clé par jour joué | `js/logique.js` |
| `echo.defi.v1` | Série du défi `{v, last, count, best, jours: {'AAAA-MM-JJ': {score, texte}}}` (30 jours) | `defi.js` |

Rien n'est migré ni effacé à une mise à jour. Lecture défensive : données corrompues → série remise à zéro sans erreur.

## Données fixes
- Labyrinthes : générés par graine (`js/labyrinthe.js`, `mulberry32`), rien n'est stocké.
- Textes : bloc généré de `js/i18n.js` (source : `i18n/strings.json` du projet Android).

## Cache hors ligne
Cache du service worker `echo-v2.3` : copie des fichiers du site, aucune donnée de joueur.

## Données partagées
Texte et image du Défi du jour, envoyés seulement quand le joueur appuie sur « Partager » (numéro, score, grille, temps, série, lien fixe sans paramètre).
Fichier image : `echo-defi-<n>.png`.
