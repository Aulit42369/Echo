# ÉCHO (PWA) — architecture

Rédigé le 24/10/2026 d'après le code réel (cas 1 — mobile).

## 0. Lot 18 — refactorisation pure (plan écrit avant de coder, 25/10/2026 ; **fait** le même jour)
But : plus aucun fichier de code au-delà d'≈ 400 lignes, **sans rien changer** au comportement, au rendu, aux 7 langues,
aux clés de sauvegarde, à l'`id` du manifest ni au Défi du jour (parité web ↔ Android).

**Web** — `index.html` (1 840 l.) ne garde que le HTML ; le script unique (une IIFE) est coupé à ses frontières de sections,
**à l'identique**, en fichiers statiques chargés dans l'ordre après `defi.js` (toujours premier, non modifié) :
`css/echo.css` · `js/i18n.js` (bloc généré) · `js/reglages.js` · `js/labyrinthe.js` · `js/sons.js` · `js/appareil.js` ·
`js/etat.js` · `js/entrees.js` · `js/niveau.js` · `js/logique.js` · `js/echos.js` · `js/ombres.js` · `js/rendu.js` ·
`js/ecrans.js` · `js/defi-ecran.js` · `js/boucle.js`. Plus d'IIFE : scripts classiques en mode strict qui partagent la portée
globale (`const`/`let` de haut niveau). `gen_i18n.py` écrit désormais dans `js/i18n.js`. `sw.js` : nouveaux fichiers + version.
Étapes : (1) tests de non-régression d'abord (`tests/page.js` : la page exécutée dans un faux navigateur, parcours au clavier,
7 langues, clés de textes) + trace dorée (état + journal complet des appels canvas, identique avant/après) ; (2) découpage ;
(3) tests statiques adaptés pour lire la page entière (HTML + css + js) ; (4) contrôle en Chromium sans tête (Playwright).

**Android** — `GameView.kt` (2 464 l.) : la classe garde l'état, le cycle de vie et la boucle ; ses fonctions sont déplacées
telles quelles en **fonctions d'extension** `GameView.xxx()` dans des fichiers par responsabilité (entrées, niveau, logique,
partie, échos, Ombres, rendu, HUD, écrans, défi) ; constantes et couleurs dans `Reglages.kt` ; la géométrie pure
(segments, ligne de vue, `farCell`…) en fonctions de haut niveau dans `Geometrie.kt`, testée par JUnit (vecteurs calculés
par la PWA). `private` → `internal` (visibilité du module seulement). Aucun changement de logique.
Résultat : `GameView.kt` 325 l. + 13 fichiers de 48 à 344 l. (détail dans le `README.md` du projet Android) ; `GeometrieTest.kt` ajouté.

## 1. Modules
| Module | Responsabilité | Taille |
|---|---|---|
| `index.html` | HTML seul : métadonnées / SEO, canvas, panneau de fin du défi, balises `<script>` dans l'ordre, JSON-LD | 102 l. |
| `css/echo.css` | styles (plein écran, panneau du défi, lien légal) | 36 l. |
| `js/i18n.js` | **généré** : bloc `<i18n:auto>` (table `I18N`), langue `lang`, fonctions `L` / `LL` | 11 l. (1 ligne très longue) |
| `js/reglages.js` | réglages `C`, palette `COL`, constantes (types d'Ombres, d'échos, écrans), raccourcis `Math` | 28 l. |
| `js/labyrinthe.js` | `mulberry32`, `shuffle`, `Maze` (génération, BFS, chemins, murs) — **parité Android** | 126 l. |
| `js/sons.js` | `Sound` : sons synthétisés Web Audio, stéréo, boucle d'ambiance | 98 l. |
| `js/appareil.js` | vibrations, voix, gyroscope, `store` (localStorage `echo_*`), langue détectée | 79 l. |
| `js/etat.js` | canvas + `resize`, toutes les variables d'état de la partie, petites aides (`setFloor`, `say`…) | 58 l. |
| `js/entrees.js` | tactile / souris / clavier, retour Android (`popstate`), écran allumé, installation | 104 l. |
| `js/niveau.js` | construction d'un niveau (`buildFloor`, `farCell`, `addHunter`, `startLevel`) | 140 l. |
| `js/logique.js` | `update`, menus (accueil, options), partie (`updatePlay`), mode audio, étages, fin de niveau | 264 l. |
| `js/echos.js` | géométrie (segments, ligne de vue, cône), échos, leurres, balises, murs fissurés | 187 l. |
| `js/ombres.js` | Ombres (alerte, déplacement, Reflet), balises éteintes, collisions, mort, particules | 144 l. |
| `js/rendu.js` | primitives canvas, `render`, monde, mode audio | 219 l. |
| `js/ecrans.js` | dessin des Ombres, HUD, écrans de fin, accueil, options, lien légal | 182 l. |
| `js/defi-ecran.js` | défi du jour à l'écran : sous-ligne d'accueil, panneau de fin, partage texte / image, flamme | 85 l. |
| `js/boucle.js` | boucle `requestAnimationFrame`, accès de test `window.ECHO`, enregistrement du SW | 31 l. |
| `defi.js` | défi du jour : date de Paris, numéro `#n`, graine FNV-1a + mulberry32, série de jours, texte et bouton de partage | ≈ 150 l. |
| `share-card.js` | carte image du défi 1080×1920 (murs révélés + ondes cyan, ÉCHO, « DÉFI DU JOUR #n », score, éclats, détail, série, URL) ; partage `navigator.share({files, text})`, sinon téléchargement PNG. Même dessin que `CarteDefi.kt` (Android) | ≈ 160 l. |
| `autres-jeux.js` | pastille « AUTRES JEUX » (accueil seulement) + panneau `role=dialog` des 3 autres jeux ; constante `JEUX` (liens web, à remplacer par les liens Play Store) ; Échap et retour Android ferment le panneau | ≈ 115 l. |
| `sw.js` | cache hors ligne (liste `JEU` = mêmes fichiers `js/` que les balises de `index.html`) | 39 l. |
| `privacy.html` | confidentialité + conditions d'utilisation + mentions légales (7 langues, choix par `#xx` ou langue du navigateur) ; URL donnée au Play Store, ne pas renommer | |
| `404.html` | page introuvable (chemins absolus `/Echo/…`, retour auto au jeu) | |
| `sitemap.xml`, `og-image.png` | référencement, image d'aperçu des liens 1200×630 | |
| `tests/defi.test.js` | module commun (copie identique dans les 4 jeux, sauf la ligne `CHEMIN`) | |
| `tests/echo-defi.test.js` | intégration propre à ÉCHO (contrôles statiques, textes, format du partage) | |
| `tests/carte-et-autres.test.js` | carte image (faux contexte 2D, partage simulé) et carte des autres jeux | |
| `tests/parite.test.js` + `parite-android.json` | vecteurs de parité web → Android (date, graine, tirages, labyrinthe 12×18, mélange, texte partagé) | |
| `tests/geometrie.test.js` + `geometrie-android.json` | vecteurs web → Android de la géométrie (BFS, `farCell`, ligne de vue, écho réaliste, cône), rejoués par `GeometrieTest.kt` | |
| `tests/page.js` | outil de test : lit la page entière (HTML + css + js dans l'ordre) et l'exécute dans un faux navigateur (hasard et date fixés) | |
| `tests/chargement.test.js` | la page se charge et se joue sans erreur (parcours clavier, niveaux 1 à 12, 7 langues), clés de textes, fichiers en cache | |

Ordre de chargement (scripts classiques, portée globale partagée, mode strict par fichier) : `defi.js` (toujours **premier**),
`share-card.js`, `autres-jeux.js`, puis `js/` dans l'ordre du tableau. Un fichier ne doit **rien exécuter au chargement** qui
dépende d'un fichier chargé après lui (les fonctions, elles, peuvent s'appeler entre fichiers une fois tout chargé).

Accessibilité (28/10) : `<h1>` masqué, canvas, lien légal et panneau du défi sont dans un `<main>` sans style ; `autres-jeux.js` ajoute sa pastille et son panneau dans ce `<main>` (repli sur `body`). Pas de pied de page (canvas plein écran) : lien `privacy.html` sur l'écran Options.
Documents de cadrage dans `docs/` : `PRD.md`, `TRD.md`, `APP_FLOW.md`, `DESIGN_BRIEF.md`, `BACKEND_SCHEMA.md`, `IMPLEMENTATION_PLAN.md`.

## 2. Sources de vérité uniques
- Traductions : `i18n/strings.json` du projet Android → bloc `<i18n:auto>` de `js/i18n.js` (généré par `tools/gen_i18n.py`, qui écrit
  directement dans ce dépôt depuis le 25/10/2026 ; dans `index.html` avant le lot 18). Tous les textes y sont, défi, carte image et autres jeux compris (l'ancien bloc `<defi:i18n>` est supprimé).
- Logique du défi : `defi.js` uniquement (même fichier dans les 4 jeux, contrôlé par empreinte FNV dans le test).
- Palette : objet `COL` de `js/reglages.js`.
- Lien légal : clé `legal` du bloc généré ; lien HTML `#lienLegal` visible seulement sur l'écran Options (`majLienLegal()` dans `render()`).
- Liens des autres jeux : constante `JEUX` de `autres-jeux.js` (et `AutresJeux.JEUX` côté Android).

## 3. Persistance (localStorage, sur l'appareil seulement)
| Clé | Contenu |
|---|---|
| `echo_best`, `echo_stars_<n>`, `echo_easy`, `echo_realistic`, `echo_audio`, `echo_gyro`, `echo_lang` | progression et options |
| `echo_daily_AAAAMMJJ` | meilleur score du défi de ce jour (format inchangé, date de Paris depuis le 24/10/2026) |
| `echo.defi.v1` | série du défi : `{ v, last, count, best, jours: { 'AAAA-MM-JJ': { score, texte } } }`, 30 jours gardés, écrit par `defi.js` |

Survit aux mises à jour (rien n'est migré ni effacé). Lecture défensive : données corrompues → série remise à zéro, sans erreur.

## 4. Sécurité
Aucun secret, aucun réseau, aucune donnée personnelle. Le texte partagé ne contient que numéro, score, grille, temps, série et l'URL fixe (sans paramètre).

## 5. Identité
- URL : `https://aulit42369.github.io/Echo/` (**écart connu** : domaine partagé, contraire à la règle « un domaine par app » ; ne pas changer sans décision).
- `id` du manifest : `/Echo/` — **ne jamais modifier**. `start_url` / `scope` : `./`.
- Cache : préfixe `echo-` (actuel `echo-v2.5`) ; le SW ne supprime que les caches `echo-*`.
- Nom du fichier image partagé : `echo-defi-<n>.png`.
- Nom de jeu pour la graine du défi : `'echo'`.

## 6. Dépendances externes
Aucune. Texte : `navigator.share` → sinon presse-papiers → sinon zone de texte à copier. Image : `navigator.share` avec fichier (si `canShare`) → sinon téléchargement. Liens des autres jeux : nouvel onglet (`noopener`). Synthèse vocale et vibration facultatives.

## 7. Plan de tests
`node --test` (33 tests) : vecteurs de référence (FNV, graines, tirages), `parisDate` comparé à `Intl` toutes les heures de 2026 à 2035,
changement de jour à minuit de Paris (été/hiver), série (faux localStorage), texte partagé ≤ 280 car., partage simulé,
copie identique de `defi.js`, contrôles statiques (page entière, `sw.js`, traductions dans les 7 langues), page exécutée dans un faux
navigateur (parcours au clavier, niveaux 1 à 12, 7 langues), vecteurs de géométrie pour Android.
Lot 18 : en plus, trace dorée (état + journal complet des appels canvas sur une partie scriptée, 3 langues) identique avant/après
découpage, et contrôle en Chromium sans tête (Playwright) : zéro erreur console, 26 fichiers en cache `echo-v2.0`.
Manuel : capture accueil + fin du défi (FR/EN), zéro erreur console, hors ligne après installation.

## 8. Risques connus
- Le jour du déploiement, le labyrinthe du défi change (graine différente) : le record du jour reste.
- Les déplacements des Ombres utilisent `Math.random` : même plan pour tous, pas exactement le même comportement (accepté).
- Android 1.4 : défi porté (`Defi.kt`, `Mulberry32`), même labyrinthe que la PWA (contrôlé par `PariteTest.kt`). Seul écart possible : `Math.hypot` JS vs Java au dernier bit dans `farCell` (égalité quasi impossible, non testée au-delà du labyrinthe).
- Carte image : rendu visuel non vérifié automatiquement (pas de navigateur dans les tests) ; à contrôler à l'œil sur téléphone.
- Lot 18 : les fonctions de haut niveau sont désormais globales (`window.alert` est masquée par la fonction `alert` des Ombres, sans effet : le jeu n'utilise pas la boîte native).
- Voir `PIEGES.md`.

## Statistiques de visite (28/10/2026)
GoatCounter sans cookie, chemins `/echo/…`, chargé par le script d'une ligne en fin de `index.html` uniquement sur `*.github.io` et sans `skipgc` (détail : `docs/TRD.md`, section Traceurs). `privacy.html` le déclare dans toutes ses langues, avec le bouton « Ne pas être compté ». Test : `tests/statistiques.test.js` (identique dans les 4 jeux, seul `PREFIXE` change).
