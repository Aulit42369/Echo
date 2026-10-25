# ÉCHO (PWA) — pièges

- **`defi.js` est une copie identique dans 4 dépôts** (Echo, lumen-jeu, fragments-jeu `js/`, resonance-jeu). Le modifier ici sans
  modifier les 3 autres fait échouer le test « copie identique » ; après une vraie modif, mettre à jour `EMPREINTE` dans les 4 `tests/defi.test.js`.
- **Bloc `<i18n:auto>` généré** par `tools/gen_i18n.py` (projet Android, dans `JEUX`) : toute modif à la main y est perdue. Depuis le lot 18 (25/10/2026) le script écrit directement `F:/GITHUB/Echo/js/i18n.js` (en fins de ligne LF ; avant : `index.html`) et **tous** les textes sont dans `strings.json` ; ne plus rien ajouter à la main hors du bloc.
- **Parité Android** : changer le labyrinthe (`js/labyrinthe.js` : `Maze`, `mulberry32`, `shuffle` ; ordre des tirages dans `startLevel` de `js/niveau.js`) ou `defi.js` change le défi du jour ; `tests/parite.test.js` échoue alors exprès → `MAJ_PARITE=1 node --test`, recopier `parite-android.json` côté Android et porter le même changement dans `Maze.kt` / `GameView.kt`.
- **Carte image** : `share-card.js` et `CarteDefi.kt` dessinent la même carte ; modifier les deux ensemble. `ctx.letterSpacing` ajoute aussi l'espace après la dernière lettre : le texte centré est décalé d'une demi-espace (compensé dans `texte()`).
- **Retour Android et panneau « autres jeux »** : le panneau ajoute sa propre entrée d'historique ; le jeu ignore `popstate` sur l'accueil, donc pas de conflit. Ne pas l'ouvrir hors de l'accueil.
- **Service worker en « cache d'abord »** pour tout sauf la page : un fichier ajouté (comme `defi.js`) doit être dans `FILES`
  **et** `VERSION` doit changer, sinon les joueurs installés gardent l'ancien fichier ou cassent hors ligne.
- **`404.html` est servie à n'importe quelle profondeur** (`/Echo/a/b/c`) : tous ses liens, polices et icônes en chemin absolu (`/Echo/…`), jamais relatif. Elle n'est pas mise en cache par le SW.
- **Aperçus de liens** : `og:image` doit rester une URL absolue (`https://aulit42369.github.io/Echo/og-image.png`) ; après modification de l'image, Facebook/Discord gardent l'ancienne en cache plusieurs jours.
- **`robots.txt`** ne peut pas vivre dans ce dépôt (site de projet) : seul `sitemap.xml` est publié.
- **`node --test tests/`** échoue sous Node 24 : lancer `node --test` à la racine.
- **Clavier et panneaux HTML** : le gestionnaire `keydown` global ignore les touches dont la cible est dans `#defiFin`, `#autres` ou `#autresBtn`,
  sinon Entrée/Espace sur le bouton « Partager » renverrait aussi au menu.
- **URL de partage fixe** (`URL_JEU`) : ne jamais utiliser `location.href` (donnerait `file://` dans une appli WebView).
- **Le défi est figé au lancement** (`defiJour`) : ne pas recalculer `Defi.today()` en cours de partie.
- **Raccourci P (partage) avant `if (e.repeat) return;`** : il doit ignorer lui-même `e.repeat`, sinon la touche maintenue relance le partage ; `partager()` est en plus verrouillé par `partageEnCours` (double clic).
- **JSON-LD en fin de `<body>`** (25/10) : `tests/defi.test.js` exige que `defi.js` soit le **premier** `<script>` de `index.html` ; un bloc `application/ld+json` dans le `<head>` fait échouer le test.

- **Fichier `google9ad7f8bd44912903.html` (25/10)** : validation Google Search Console (propriété + sitemap envoyé). Ne jamais le supprimer ni le renommer, sinon la propriété perd sa validation.

- **Fichiers `js/` (lot 18) : une seule portée globale.** Ce sont des scripts classiques, pas des modules : un nom de haut niveau
  (`const`, `let`, `function`, `class`) ne doit exister que dans **un** fichier (sinon « already been declared » et le jeu ne démarre pas),
  et ne doit pas s'appeler comme `defi.js` / `share-card.js` / `autres-jeux.js` (`Defi`, `ShareCard`, `AutresJeux`). Le code exécuté
  au chargement (écouteurs, `resize()`, `AutresJeux.init`…) ne peut utiliser que des fichiers chargés **avant** lui.
- **Ajouter / renommer un fichier `js/`** : balise dans `index.html` **et** liste `JEU` de `sw.js` (même ordre), puis monter `VERSION` ;
  `tests/chargement.test.js` échoue si un fichier de la page manque au cache.
- **Tests statiques** : ils lisent la page entière via `tests/page.js` (`source()` = HTML + css + js). Ne plus lire `index.html` seul.
- **Géométrie partagée avec Android** (`segCross`, `segDist`, `losClear`, `wallVisible`, `wallInCone`, `farCell`, `Maze.bfs`) : un changement
  voulu fait échouer `tests/geometrie.test.js` → `MAJ_PARITE=1 node --test`, recopier `tests/geometrie-android.json` dans
  `app/src/test/resources/` et porter le changement dans `Geometrie.kt`.
