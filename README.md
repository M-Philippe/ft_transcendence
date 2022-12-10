# ft_transcendence

Ce projet consiste à créer un site web pour participer à une compétition du célèbre jeu Pong !

### bases
• Le backend est écrit en NestJS.
• Le frontend est réalisé avec le framework React en TypeScript.
Dernières versions stables de chaque bibliothèque ou framework utilisé (au dernier push).

• Une partie de l'interface est réalisée avec MUI (Material UI).
• Le site est une application web monopage. L'utilisateur peut utiliser les boutons Précédent et Suivant du navigateur.
• La base de données utilise PostgreSQL.
• Le site web est compatible avec la dernière version stable à jour de Google Chrome, Safari et Firefox
• Le projet se lance par un simple appel à : docker-compose up --build
Mais nécessite des fichiers .env qui ne sont pas push sur ce repo pour des raisons de sécurité.
• Le site est responsive.
  
### Sécurité
• Tout mot de passe stocké dans la base de données est chiffré.
• Le site est protégé contre les injections SQL.
• Un système de validation côté serveur pour les formulaires et toute requête utilisateur est implémenté.
• L'utilisateur peut se connecter avec le système OAuth de l'intranet 42 et l'Api.
• L'utilisateur peut choisir un nom d'utilisateur unique qui sera affiché sur le site web.
• L'utilisateur peut télécharger un avatar. S'il n'en met pas, un avatar par défaut est affiché.
• L'utilisateur peut activer l'authentification à deux facteurs, ou 2FA (Google Authenticator),
• L'utilisateur peut ajouter d'autres utilisateurs comme ami(e)s et voir leur statut en temps réel (en ligne, hors-ligne, en pleine partie, etc.).
• Des stats (telles que : victoires et défaites, rang et niveaux, hauts faits, etc.) sont affichées sur le profil de l'utilisateur.
• Chaque utilisateur a un 'Match History' (historique comportant les parties 1 contre 1 etc..). Toute personne connectée peut le consulter.
  
### Le Chat
Un chat pour les utilisateurs est disponible :
• L'utilisateur peut :
- créer des channels (salons de discussion) pouvant être soit publics, privés, ou protégés par mot de passe.
- envoyer des messages direct à d'autres utilisateurs.
- en bloquer d'autres. Ainsi, il ne verra plus les messages envoyés par les comptes qu'il aura bloqués.

• L'utilisateur qui crée un nouveau channel devient automatiquement son propriétaire jusqu'à ce qu'il quitte le channel.
• Le propriétaire du channel peut définir un mot de passe requis pour accéder au channel, le modifier et le retirer.
• Le propriétaire du channel est également un administrateur. Il peut donner le rôle d'administrateur à d'autres utilisateurs.
• Les administrateurs du channel peuvent bannir ou "muter" d'autres utilisateurs pendant une durée déterminée.
• Grâce à l'interface de chat, l'utilisateur peut inviter d'autres personnes à jouer à Pong. Il peut également accéder aux profils d'autres joueurs.
 
### Le Jeu  
Le principal objectif de ce site web est de permettre aux utilisateurs de jouer à Pong avec d'autres joueurs et de montrer leur talent.

• Par conséquent, l'utilisateur peut lancer une partie de Pong en direct contre un autre joueur directement sur le site web.
• Il y a un système de matching : l'utilisateur rejoint une file d'attente jusqu'à ce qu'il soit automatiquement jumelé avec quelqu'un d'autre.
• Le jeu est un jeu canvas avec quelques options de personnalisation (des power-ups et des cartes différentes).
• L'utilisateur peut regarder les parties d'autres joueurs en temps réel, mais sans intervenir.
• Les déconnexions inattendues ou les latences sont gérées. Si un utilisateur se déconnecte ou perd la connexion, il a 10 secondes pour se reconnecter.