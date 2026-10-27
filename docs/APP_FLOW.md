# ÉCHO — parcours (écran par écran)

Les écrans sont dessinés dans le canvas (`TITLE`, `OPTIONS`, `PLAY`, `DEAD`, `CLEAR` dans `js/reglages.js`) ; le `<main>` de `index.html`
contient le canvas et les quelques éléments HTML posés dessus.

1. **Accueil** (`TITLE`) : titre ÉCHO, accroche « Dans le noir, seul l'écho te guide. », JOUER, DÉFI DU JOUR (sous-ligne `#n · à faire` / `fait ✓` + flamme de série),
   OPTIONS, INSTALLER L'APPLI (si possible), record, conseil casque, aide clavier ; pastille **AUTRES JEUX** en haut à droite → panneau des 3 autres jeux (Échap / retour Android le ferme).
2. **Options** (`OPTIONS`) : mode facile, écho réaliste, mode audio, gyroscope, langue (7) ; lien « Confidentialité · conditions » en haut (→ `privacy.html`) ; retour à l'accueil.
3. **Partie** (`PLAY`) : labyrinthe noir, échos (Espace / toucher), écho dirigé (F), leurre (E), balise (B), Ombres qui approchent ; étages ; HUD (niveau et étage, éclats ◆ ramassés, énergie des échos en points cyan, croissance de la Mère ; en Défi du jour : chrono et éclats).
   En mode audio : toucher le haut de l'écran pour jouer, repères sonores et vocaux.
4. **Mort** (`DEAD`) : prise par une Ombre → recommencer ou accueil.
5. **Niveau réussi** (`CLEAR`) : étoiles, niveau suivant.
6. **Fin du Défi du jour** : panneau HTML `#defiFin` (aperçu, série, « Partager le résultat », « Partager l'image », zone à copier, « Prochain défi dans … ») ; raccourci P.
7. **Retour Android** (`popstate`) : revient à l'écran précédent ; ignoré sur l'accueil.
8. **Pages annexes** : `privacy.html` (7 langues), `404.html`.
