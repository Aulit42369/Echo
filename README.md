# ÉCHO — ancienne adresse (renvoi)

ÉCHO a déménagé sur **https://echo-jeu.github.io/** (dépôt `echo-jeu/echo-jeu.github.io`, dossier local `F:\GITHUB\Echo`).

Ce dépôt ne sert plus qu'à l'ancienne adresse `https://aulit42369.github.io/Echo/` :
- `index.html`, `privacy.html`, `404.html` renvoient vers la même page sur la nouvelle adresse (chemin, requête et fragment conservés) ;
- `sw.js` vide **uniquement** les caches `echo-*` des joueurs (l'origine est partagée avec le Site et Cra), se désinscrit et recharge les onglets ;
- `manifest.webmanifest` est gardé, inoffensif ; `google9ad7f8bd44912903.html` est gardé (ancienne propriété Search Console).

Ne plus jamais y publier le jeu. Test : `node --test`.
