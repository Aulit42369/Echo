# ÉCHO (PWA) — à faire

## Fait
- 24/10 : Défi du jour unifié avec les 3 autres jeux (`defi.js` commun) : jour qui change à minuit heure de Paris, numéro `#n`,
  graine `Defi.seed('echo', AAAA-MM-JJ)`, série de jours consécutifs (`echo.defi.v1`), sous-ligne d'accueil (`#24 · à faire` / `fait ✓` + flamme),
  écran de fin avec série, « Prochain défi dans … », bouton « Partager le résultat » (partage natif → copie → zone à copier), raccourci `P`, annonce vocale.
- 24/10 : cache du service worker `echo-v1.5` → `echo-v1.6`, `defi.js` mis en cache.
- 24/10 : premiers tests automatiques (`node --test`, 16 tests) ; README, ARCHITECTURE, PIEGES créés.
- 24/10 : correction relecture — touche P maintenue sur l'écran de fin du défi : répétitions ignorées et un seul partage à la fois (`partageEnCours`), plus de faux « Résultat copié » pendant que la fenêtre de partage est ouverte (17 tests).

- 25/10 : checklist « avant lancement » : `privacy.html` complétée dans les 7 langues (cookies, partage, conditions d'utilisation, mentions légales, contact = tickets GitHub au lieu de `CONTACT_EMAIL`), lien « Confidentialité · conditions » sur l'écran Options, titre + description + Open Graph + `og-image.png` 1200×630, `404.html` dans le style du jeu, `sitemap.xml`, contraste AA des petits textes du canvas (options inactives, note du défi, aide clavier, libellé mode audio), cache `echo-v1.7`.
- 25/10 : passe SEO éditoriale (requête « jeu de labyrinthe dans le noir ») : `<title>`, description, Open Graph alignés ; `<h1>` masqué visuellement (lecteurs d'écran et moteurs) + paragraphe `<noscript>` ; données structurées `VideoGame` (gratuit, Android + web, 7 langues) en fin de `<body>` ; cache `echo-v1.8`.
- 25/10 : **lot 4** partage du défi en image : `share-card.js` (carte 1080×1920 style ÉCHO : murs révélés, ondes cyan, ÉCHO, « DÉFI DU JOUR #n », score, éclats, détail, série, URL), bouton « Partager l'image » sous « Partager le résultat » (`navigator.share({files, text})`, sinon téléchargement `echo-defi-<n>.png`).
- 25/10 : **lot 6** carte « Les autres jeux d'Aulit » : pastille « AUTRES JEUX » en haut à droite de l'accueil → panneau LUMEN / Fragments / Résonance (`autres-jeux.js`, liens dans la constante `JEUX`).
- 25/10 : textes du défi + lien légal + nouveaux textes reportés dans `i18n/strings.json` (Android) ; bloc `<defi:i18n>` supprimé ; `gen_i18n.py` écrit maintenant ce `index.html`.
- 25/10 : Android 1.4 (versionCode 5) : défi porté à l'identique (`Defi.kt`, `Mulberry32`, `farCell` en Double), partage image + texte, In-App Review après le 3e défi réussi, écran « autres jeux », lien confidentialité dans Options. Vecteurs de parité `tests/parite-android.json` rejoués par `PariteTest.kt`.
- 25/10 : cache `echo-v1.9` ; 27 tests web.

## En cours
- Rien.

## À faire
- Vérifier à l'œil la carte image (web et Android) sur téléphone : aucun rendu automatique possible dans les tests.
- Quand LUMEN / Fragments / Résonance seront sur le Play Store : remplacer les liens de `JEUX` (`autres-jeux.js`) et `AutresJeux.JEUX` (Android).
- Purger un jour les anciennes clés `echo_daily_*` (une par jour joué).
- `index.html` dépasse largement 400 lignes : découpage à prévoir lors d'une revue L99.

- **URL de politique dans la Play Console à vérifier** : `PLAY_STORE.md` donnait `…/echo/privacy.html` (minuscule, **404**) — corrigé le 25/10 en `https://aulit42369.github.io/Echo/privacy.html` ; vérifier ce qui est saisi dans la Play Console.
- Ajouter une adresse e-mail de contact publique dans `privacy.html` si souhaité (aujourd'hui : tickets GitHub).
- `robots.txt` impossible : il devrait être à la racine `aulit42369.github.io/` (aucun dépôt utilisateur) — seul `sitemap.xml` est fourni, à déclarer dans Google Search Console.
- Mesure d'audience : rien d'installé (à décider ; si oui, option sans cookie type GoatCounter/Plausible, à ajouter à `privacy.html`).

## Décisions prises
- 25/10 : image partagée par un **second bouton** (« Partager l'image ») : le partage texte existant et ses tests restent inchangés.
- 25/10 : « Autres jeux » sur l'**accueil** (pastille en haut à droite), pas dans Options (déjà plein) ; Android identique (écran dédié).
- 25/10 : In-App Review comptée sur des **jours différents** réussis (rejouer le même défi ne compte pas).
- 25/10 : `pwa/` du projet Android n'est plus mise à jour (ancienne copie) ; la PWA vit ici.
- 25/10 : contact de la politique = page « Issues » du dépôt GitHub (aucune adresse personnelle publiée sans accord).
- 25/10 : CGU et mentions légales dans `privacy.html` (une seule page, déjà liée depuis le Play Store) plutôt qu'une page de plus.
- Défi du jour : minuit **heure de Paris** pour tout le monde (pas le minuit local du joueur) — option sûre, question Q1 posée à Olivier.
- Texte partagé traduit dans la langue du joueur (Q4) ; nom du jeu, `#n` et emoji non traduits.
- Clé de record `echo_daily_AAAAMMJJ` conservée telle quelle : aucune migration.
- Seule une sortie atteinte compte pour la série ; une mort ne compte pas.
- Textes du défi hors du bloc généré `<i18n:auto>`, pour ne pas être effacés par `gen_i18n.py`.
