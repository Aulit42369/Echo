# ÉCHO — plan de mise en œuvre

## État au 28/10/2026
- PWA en ligne (cache `echo-v2.3`), 33 tests `node --test` verts.
- Fait : Défi du jour commun, partage texte + image, autres jeux, lot 18 (découpage de `index.html`), 7 langues,
  politique LCEN/RGPD, CSP, `<main>` autour du jeu (28/10).
- Android 1.4 (versionCode 5) au même niveau (défi, partage, In-App Review, autres jeux), dans `JEUX\Echo-PlayStore-1.1.0\Echo`.

## Prochaines étapes (d'après `A_FAIRE.md`)
1. Play Console : vérifier la fiche « Sécurité des données » (aucune donnée collectée ; avis gérés par Google).
2. Vérifier l'URL de politique saisie dans la Play Console : `https://aulit42369.github.io/Echo/privacy.html`.
3. Vérifier à l'œil la carte image (web et Android) sur téléphone.
4. Remplacer les liens de `JEUX` (`autres-jeux.js`) et `AutresJeux.JEUX` (Android) quand les autres jeux seront sur le Play Store.
5. Purger un jour les anciennes clés `echo_daily_*`.

## Décisions en attente (Olivier)
- Mesure d'audience : rien d'installé (si oui : option sans cookie, à ajouter à `privacy.html`).
- Domaine propre (`echo-jeu.github.io` comme les 3 autres jeux) : non décidé, ne pas changer sans décision (l'`id` du manifest en dépend).
