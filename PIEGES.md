# ÉCHO (PWA) — pièges

- **`defi.js` est une copie identique dans 4 dépôts** (Echo, lumen-jeu, fragments-jeu `js/`, resonance-jeu). Le modifier ici sans
  modifier les 3 autres fait échouer le test « copie identique » ; après une vraie modif, mettre à jour `EMPREINTE` dans les 4 `tests/defi.test.js`.
- **Bloc `<i18n:auto>` généré** par `tools/gen_i18n.py` (projet Android, dans `JEUX`) : toute modif à la main y est perdue. Les textes du défi sont dans `<defi:i18n>`.
- **Service worker en « cache d'abord »** pour tout sauf la page : un fichier ajouté (comme `defi.js`) doit être dans `FILES`
  **et** `VERSION` doit changer, sinon les joueurs installés gardent l'ancien fichier ou cassent hors ligne.
- **`404.html` est servie à n'importe quelle profondeur** (`/Echo/a/b/c`) : tous ses liens, polices et icônes en chemin absolu (`/Echo/…`), jamais relatif. Elle n'est pas mise en cache par le SW.
- **Aperçus de liens** : `og:image` doit rester une URL absolue (`https://aulit42369.github.io/Echo/og-image.png`) ; après modification de l'image, Facebook/Discord gardent l'ancienne en cache plusieurs jours.
- **`robots.txt`** ne peut pas vivre dans ce dépôt (site de projet) : seul `sitemap.xml` est publié.
- **`node --test tests/`** échoue sous Node 24 : lancer `node --test` à la racine.
- **Clavier et panneau HTML** : le gestionnaire `keydown` global ignore les touches dont la cible est dans `#defiFin`,
  sinon Entrée/Espace sur le bouton « Partager » renverrait aussi au menu.
- **URL de partage fixe** (`URL_JEU`) : ne jamais utiliser `location.href` (donnerait `file://` dans une appli WebView).
- **Le défi est figé au lancement** (`defiJour`) : ne pas recalculer `Defi.today()` en cours de partie.
- **Raccourci P (partage) avant `if (e.repeat) return;`** : il doit ignorer lui-même `e.repeat`, sinon la touche maintenue relance le partage ; `partager()` est en plus verrouillé par `partageEnCours` (double clic).
- **JSON-LD en fin de `<body>`** (25/10) : `tests/defi.test.js` exige que `defi.js` soit le **premier** `<script>` de `index.html` ; un bloc `application/ld+json` dans le `<head>` fait échouer le test.

- **Fichier `google9ad7f8bd44912903.html` (25/10)** : validation Google Search Console (propriété + sitemap envoyé). Ne jamais le supprimer ni le renommer, sinon la propriété perd sa validation.
