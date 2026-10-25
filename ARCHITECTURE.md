# ÉCHO (PWA) — architecture

Rédigé le 24/10/2026 d'après le code réel (cas 1 — mobile).

## 1. Modules
| Module | Responsabilité | Taille |
|---|---|---|
| `index.html` | jeu complet : réglages, sons (WebAudio), voix, gyroscope, génération des labyrinthes, boucle, rendu canvas, menus | ≈ 1 740 l. (**écart** : au-delà du seuil de 400 l., hérité) |
| `defi.js` | défi du jour : date de Paris, numéro `#n`, graine FNV-1a + mulberry32, série de jours, texte et bouton de partage | ≈ 150 l. |
| `share-card.js` | carte image du défi 1080×1920 (murs révélés + ondes cyan, ÉCHO, « DÉFI DU JOUR #n », score, éclats, détail, série, URL) ; partage `navigator.share({files, text})`, sinon téléchargement PNG. Même dessin que `CarteDefi.kt` (Android) | ≈ 160 l. |
| `autres-jeux.js` | pastille « AUTRES JEUX » (accueil seulement) + panneau `role=dialog` des 3 autres jeux ; constante `JEUX` (liens web, à remplacer par les liens Play Store) ; Échap et retour Android ferment le panneau | ≈ 115 l. |
| `sw.js` | cache hors ligne | 35 l. |
| `privacy.html` | confidentialité + conditions d'utilisation + mentions légales (7 langues, choix par `#xx` ou langue du navigateur) ; URL donnée au Play Store, ne pas renommer | |
| `404.html` | page introuvable (chemins absolus `/Echo/…`, retour auto au jeu) | |
| `sitemap.xml`, `og-image.png` | référencement, image d'aperçu des liens 1200×630 | |
| `tests/defi.test.js` | module commun (copie identique dans les 4 jeux, sauf la ligne `CHEMIN`) | |
| `tests/echo-defi.test.js` | intégration propre à ÉCHO (contrôles statiques, textes, format du partage) | |
| `tests/carte-et-autres.test.js` | carte image (faux contexte 2D, partage simulé) et carte des autres jeux | |
| `tests/parite.test.js` + `parite-android.json` | vecteurs de parité web → Android (date, graine, tirages, labyrinthe 12×18, mélange, texte partagé) | |

## 2. Sources de vérité uniques
- Traductions : `i18n/strings.json` du projet Android → bloc `<i18n:auto>` de `index.html` (généré par `tools/gen_i18n.py`, qui écrit
  directement dans ce dépôt depuis le 25/10/2026). Tous les textes y sont, défi, carte image et autres jeux compris (l'ancien bloc `<defi:i18n>` est supprimé).
- Logique du défi : `defi.js` uniquement (même fichier dans les 4 jeux, contrôlé par empreinte FNV dans le test).
- Palette : objet `COL` de `index.html`.
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
- Cache : préfixe `echo-` (actuel `echo-v1.9`) ; le SW ne supprime que les caches `echo-*`.
- Nom du fichier image partagé : `echo-defi-<n>.png`.
- Nom de jeu pour la graine du défi : `'echo'`.

## 6. Dépendances externes
Aucune. Texte : `navigator.share` → sinon presse-papiers → sinon zone de texte à copier. Image : `navigator.share` avec fichier (si `canShare`) → sinon téléchargement. Liens des autres jeux : nouvel onglet (`noopener`). Synthèse vocale et vibration facultatives.

## 7. Plan de tests
`node --test` (27 tests) : vecteurs de référence (FNV, graines, tirages), `parisDate` comparé à `Intl` toutes les heures de 2026 à 2035,
changement de jour à minuit de Paris (été/hiver), série (faux localStorage), texte partagé ≤ 280 car., partage simulé,
copie identique de `defi.js`, contrôles statiques (`index.html`, `sw.js`, traductions dans les 7 langues).
Manuel : capture accueil + fin du défi (FR/EN), zéro erreur console, hors ligne après installation.

## 8. Risques connus
- Le jour du déploiement, le labyrinthe du défi change (graine différente) : le record du jour reste.
- Les déplacements des Ombres utilisent `Math.random` : même plan pour tous, pas exactement le même comportement (accepté).
- Android 1.4 : défi porté (`Defi.kt`, `Mulberry32`), même labyrinthe que la PWA (contrôlé par `PariteTest.kt`). Seul écart possible : `Math.hypot` JS vs Java au dernier bit dans `farCell` (égalité quasi impossible, non testée au-delà du labyrinthe).
- Carte image : rendu visuel non vérifié automatiquement (pas de navigateur dans les tests) ; à contrôler à l'œil sur téléphone.
- Voir `PIEGES.md`.
