# ÉCHO — TRD (exigences techniques)

## Pile
- HTML + CSS + JavaScript classique (scripts sans `import`, portée globale partagée, mode strict), **aucune dépendance npm**, aucun outil de construction.
- Rendu : un seul `<canvas>` plein écran (monde, HUD, menus dessinés) ; seuls éléments HTML posés dessus : panneau de fin du défi, lien légal (écran Options), pastille et panneau « autres jeux ».
- Sons : Web Audio synthétisé en stéréo ; synthèse vocale et vibrations facultatives.
- Ordre de chargement imposé : `defi.js` → `share-card.js` → `autres-jeux.js` → `js/i18n.js` → … → `js/boucle.js`.

## PWA
- Hébergement : GitHub Pages, `https://aulit42369.github.io/Echo/` (domaine partagé avec le site, écart connu).
- `sw.js` : constante `VERSION` (`echo-v2.3` au 28/10/2026) à monter à chaque changement ; liste `JEU` = mêmes fichiers que les balises de `index.html` ; ne purge que les caches `echo-*`.
- Manifest : `id` `/Echo/` (ne jamais modifier), `start_url` / `scope` `./`.
- CSP en balise meta : `script-src 'self'` (aucun script en ligne exécutable).
- Pas de `robots.txt` possible (site de projet) : seul `sitemap.xml`.

## Android
- Appli Kotlin native 1.4 (versionCode 5) : `F:\Stream\files\JEUX\Echo-PlayStore-1.1.0\Echo` (hors de ce dépôt). La clé de signature est dans `echo-release` (secret, jamais lu).
- Parité contrôlée : labyrinthe et défi (`tests/parite-android.json` ⇄ `PariteTest.kt`), géométrie (`tests/geometrie-android.json` ⇄ `GeometrieTest.kt`), carte image (`share-card.js` ⇄ `CarteDefi.kt`).
- Textes : `i18n/strings.json` du projet Android → `tools/gen_i18n.py` → bloc généré de `js/i18n.js` (ne jamais l'éditer à la main).

## Contraintes
- `defi.js` identique octet pour octet dans les 4 jeux (empreinte vérifiée) et toujours premier `<script>`.
- JSON-LD en fin de `<body>`.
- Accessibilité : `<main>` autour du `<h1>` masqué, du canvas (`tabindex`, `aria-label`), du lien légal, du panneau du défi et de la pastille « autres jeux » ; statut annoncé (`role="status"`), mode audio, annonces vocales, contraste AA des petits textes du canvas.
- Plein écran : canvas `position: fixed` ; pas de pied de page (il passerait sous le canvas) : le lien `privacy.html` s'affiche sur l'écran Options.
- Tests : `node --test` à la racine (Node 24). Après un changement voulu du labyrinthe, du défi ou de la géométrie : `MAJ_PARITE=1 node --test` et recopier les JSON côté Android.
