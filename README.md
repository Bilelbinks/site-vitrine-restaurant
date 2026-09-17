# Chez Augustine — Site vitrine (démo)

Site vitrine statique (HTML/CSS/JS pur, aucune dépendance à installer) réalisé comme
**exemple à montrer à une entreprise/un commerçant qui n'a pas encore de site web**.
Contenu et coordonnées entièrement fictifs (restaurant imaginaire).

## Comment l'ouvrir
Double-clique sur `index.html`, ou ouvre le dossier avec l'extension VS Code
"Live Server" pour un rendu avec rechargement automatique.

## Ce qu'il montre
- Header sticky avec navigation + menu mobile (burger)
- Hero plein écran avec image de fond
- Section "À propos" avec mise en page image/texte
- Carte du restaurant avec onglets (Entrées / Plats / Desserts / Boissons)
- Galerie photo avec lightbox (clic pour agrandir)
- Carrousel d'avis clients
- Bloc infos pratiques (horaires, adresse, carte OpenStreetMap intégrée sans clé API)
- **Formulaire de réservation intelligent** : les créneaux horaires proposés sont générés à
  partir des vrais horaires d'ouverture (`reservations.js`), un jour fermé (lundi) ou un
  créneau qui atteint sa capacité max (32 couverts par défaut) devient indisponible
  ("complet") côté client, avant même l'envoi du formulaire.
- **Espace pro** (`admin.html`, mot de passe démo `admin1234`) : tableau de bord pour le
  restaurateur — réservations du jour, taux de remplissage par créneau, coordonnées
  (téléphone/e-mail) des clients, actions annuler/réactiver/supprimer.
- Footer avec mention "Site conçu par Bilel Ben Younes" (à personnaliser/retirer selon le client)

## Réservations : comment ça marche (et ses limites)
Les créneaux, la capacité par service et les réservations elles-mêmes vivent dans
`reservations.js`, partagé entre `index.html` et `admin.html`. Les données sont stockées en
`localStorage` : ça permet une démo 100% statique (gratuite à héberger, aucun serveur), mais
**les réservations ne sont visibles que dans le navigateur où elles ont été créées** — pas de
synchronisation entre le poste client et celui du restaurateur, ni entre plusieurs appareils.
C'est suffisant pour montrer le concept à un prospect ; pour une vraie mise en production, il
faudrait un vrai backend (API + base de données) qui centralise les réservations — exactement
le principe déjà implémenté dans le projet **reservation-rdv** (PHP + MySQL, calcul de
créneaux par chevauchement, espace admin sécurisé) : cette même logique de créneaux/capacité
peut y être branchée telle quelle.

Pour rejouer la démo depuis zéro (effacer les réservations créées pendant un essai), le bouton
"Réinitialiser les données de démo" dans l'espace pro régénère le jeu de données d'exemple.

## Pour l'adapter à un vrai client
- Remplacer le nom, les textes, les images (`index.html`) et les couleurs (`style.css`,
  variables `:root` en haut du fichier) par l'identité du commerce.
- Mettre à jour les horaires, l'intervalle des créneaux et la capacité par service dans
  `reservations.js` (constantes `OPENING_HOURS`, `SLOT_INTERVAL_MIN`, `CAPACITY_PER_SLOT`).
- Changer le mot de passe de démo de l'espace pro dans `admin.js` (`ADMIN_PASSWORD`) — et,
  avant toute mise en ligne réelle, remplacer ce système par une authentification côté serveur.
- Mettre à jour les coordonnées de la carte OpenStreetMap (bbox + marker) dans `index.html`.
- Remplacer ou retirer la ligne de crédit en pied de page une fois le site livré.

## Déploiement gratuit
- **Netlify** ou **Vercel** : glisser-déposer le dossier, un lien est généré directement.
- **GitHub Pages** : déposer le dossier dans un repo, activer Pages dans les Settings.

## Structure
```
index.html        → contenu et structure du site public
admin.html        → espace pro (tableau de bord réservations)
style.css         → style du site public (palette bistrot chaleureux)
admin.css         → style additionnel de l'espace pro
script.js         → menu mobile, onglets, carrousel, lightbox, formulaire
admin.js          → logique du tableau de bord (login démo, listes, actions)
reservations.js   → horaires, créneaux, capacité, persistance (partagé public/admin)
assets/favicon.svg → favicon (monogramme "A")
```
