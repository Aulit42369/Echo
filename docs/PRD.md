# ÉCHO — PRD (cahier des charges produit)

Rédigé le 28/10/2026 d'après le code et les docs du dépôt (`README.md`, `ARCHITECTURE.md`, `A_FAIRE.md`).

## Concept
Jeu de labyrinthe dans le noir : le joueur ne voit rien ; chaque écho révèle les murs un instant… et attire les Ombres.
Il faut trouver la sortie de chaque niveau sans se faire prendre. Jeu sonore (casque conseillé), gratuit, hors ligne, sans compte.

## Joueurs visés
- Joueurs mobiles qui cherchent un « jeu de labyrinthe dans le noir » (requête SEO visée), en 7 langues.
- Joueurs qui jouent à l'oreille : mode audio et annonces vocales.
- Communauté du stream d'Aulit42369 (Défi du jour commun aux 4 jeux).
- Profil précis (âge, pays) : à confirmer par Olivier.

## Fonctions (présentes dans le code)
| Fonction | Détail |
|---|---|
| Niveaux | Labyrinthes générés par graine, étages, éclats à ramasser, étoiles par niveau, niveau de la Mère, record (niveau + étoiles) |
| Actions | Écho circulaire, écho dirigé (cône), leurre, balise, murs fissurés à briser |
| Ombres | Rôdeuse, Patrouille, Aveugle, Reflet, Mère : alertées par le bruit |
| Défi du jour | Même labyrinthe pour tous, change à minuit heure de Paris, numéro `#n`, série ; seule une sortie atteinte compte |
| Partage | Texte (partage natif → copie → zone à copier, raccourci P) et image 1080×1920 |
| Options | Mode facile, écho réaliste, mode audio, gyroscope, langue (7), lien Confidentialité |
| Commandes | Tactile, souris, clavier (flèches/ZQSD, Espace, F, E, B), retour Android |
| Autres jeux | Pastille « AUTRES JEUX » sur l'accueil → panneau des 3 autres jeux |

## Hors périmètre
- Pas de serveur, de compte, de classement en ligne ni de multijoueur.
- Pas d'achat intégré ni de publicité.
- Pas de mesure d'audience (non décidé).

## Critères de réussite
À confirmer par Olivier (ex. : installations Play Store, avis, joueurs quotidiens du Défi du jour).
