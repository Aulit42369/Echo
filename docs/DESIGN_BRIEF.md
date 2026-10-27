# ÉCHO — brief de design (identité réelle)

## Direction
Noir presque total ; le monde n'existe que là où l'écho passe. Murs révélés en blanc qui s'effacent, ondes cyan,
Ombres colorées et menaçantes. Un seul univers sombre, quel que soit le thème du téléphone. Le son compte autant que l'image (casque conseillé).

## Couleurs (`css/echo.css` et `COL` de `js/reglages.js`)
| Rôle | Valeur |
|---|---|
| Fond | #05070a |
| Texte, murs | #ffffff (textes secondaires en blanc translucide) |
| Écho, focus | cyan #5cf2ff |
| Danger / Ombres | rouge #ff3b5c, rose #ff4fd8, violet #c08bff, Mère #8c143c |
| Récompense | or #ffc94d ; orange #ff8a3d ; glace #aae1ff ; escaliers #a0b4ff ; fissures #ffd6aa |

## Typographie
Police système (`system-ui`, Segoe UI, Roboto…) en graisse **300**, capitales espacées (`letter-spacing`) pour les menus et boutons.

## Formes et mouvement
Boutons HTML en pilule à bord fin blanc translucide, fond transparent. Ondes circulaires et cône pour l'écho dirigé, traînée du joueur,
particules à la mort. Carte de partage 1080×1920 : murs révélés, ondes cyan, « DÉFI DU JOUR #n ».

## Accessibilité
`<h1>` masqué visuellement, canvas focalisable avec `aria-label`, mode audio et annonces vocales, contraste AA des petits textes du canvas,
contour de focus cyan sur les éléments HTML.
