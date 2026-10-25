# ÉCHO (PWA) — à faire

## Fait
- 24/10 : Défi du jour unifié avec les 3 autres jeux (`defi.js` commun) : jour qui change à minuit heure de Paris, numéro `#n`,
  graine `Defi.seed('echo', AAAA-MM-JJ)`, série de jours consécutifs (`echo.defi.v1`), sous-ligne d'accueil (`#24 · à faire` / `fait ✓` + flamme),
  écran de fin avec série, « Prochain défi dans … », bouton « Partager le résultat » (partage natif → copie → zone à copier), raccourci `P`, annonce vocale.
- 24/10 : cache du service worker `echo-v1.5` → `echo-v1.6`, `defi.js` mis en cache.
- 24/10 : premiers tests automatiques (`node --test`, 16 tests) ; README, ARCHITECTURE, PIEGES créés.
- 24/10 : correction relecture — touche P maintenue sur l'écran de fin du défi : répétitions ignorées et un seul partage à la fois (`partageEnCours`), plus de faux « Résultat copié » pendant que la fenêtre de partage est ouverte (17 tests).

## En cours
- Rien.

## À faire
- Reporter les clés `defi*` et `sDefiFin` (bloc `<defi:i18n>`) dans `i18n/strings.json` du projet Android, puis supprimer le bloc à la régénération.
- Android : porter `parisDate`, `fnv1a`, `seed`, mulberry32, série et partage (`Intent.ACTION_SEND`) dans `GameView.kt` pour avoir le même défi que la PWA.
- Purger un jour les anciennes clés `echo_daily_*` (une par jour joué).
- `index.html` dépasse largement 400 lignes : découpage à prévoir lors d'une revue L99.

## Décisions prises
- Défi du jour : minuit **heure de Paris** pour tout le monde (pas le minuit local du joueur) — option sûre, question Q1 posée à Olivier.
- Texte partagé traduit dans la langue du joueur (Q4) ; nom du jeu, `#n` et emoji non traduits.
- Clé de record `echo_daily_AAAAMMJJ` conservée telle quelle : aucune migration.
- Seule une sortie atteinte compte pour la série ; une mort ne compte pas.
- Textes du défi hors du bloc généré `<i18n:auto>`, pour ne pas être effacés par `gen_i18n.py`.
