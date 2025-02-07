# Masterglass

## Installation
### Prérequis
Avant d'installer et d'exécuter le projet, assurez-vous d'avoir installé :
- [Node.js](https://nodejs.org/en/download)

Pensez à activer votre micro sur votre ordinateur, ainsi que le son des haut-parleurs.

## Clonage du projet
Une fois avoir installé Node.js, clonez le dépôt du projet.
Pour cela ouvrez un terminal afin de lancer la commande suivante :   

```sh
git clone https://github.com/marcusaasjensen/masterglass.git
```
Ensuite, ouvrez le dépôt du projet à la racine avec votre IDE préféré.

## Installation de l'application mobile
Accédez au dossier de l'application mobile `App/masterglass` et installez les dépendances.  
Dans un terminal, exécutez les commandes suivantes : 

```sh
cd App/masterglass
npm install
```

## Installation du serveur
Accédez au dossier du serveur `Server` et installez les dépendances.  
Dans un terminal, exécutez les commandes suivantes : 

```sh
cd Server
npm install
```

## Execution
### Lancer le serveur
Rendez-vous dans le dossier du serveur `Server`:

```sh
cd Server
```

Exécutez le script du serveur avec Node.js :

```sh
node server.js
```

### Lancer l'application mobile

Rendez-vous dans le dossier de l'application mobile `App/masterglass` avec la commande suivante :
```sh
cd App/masterglass
```

Démarrez l'application avec Expo avec la commande suivante :
```sh
npx expo start
```
Appuyez sur `w` afin d'ouvrir l'application dans un navigateur web.

### Lancer l'application Hololens
Pour plus d'informations sur le lancement d'une application Unity sur le Hololens : https://learn.microsoft.com/en-us/windows/mixed-reality/develop/advanced-concepts/using-visual-studio?tabs=hl2

Télécharger et extraire le dossier Build via ce lien : https://drive.google.com/file/d/1qVsYrYTOO9EuB7Y_VhAnDSQRjRNgjeco/view?usp=sharing

Ouvrir la solution Hololens.sln avec Visual Studio.

Changer les options de compilation comme sur la capture d'écran si dessous :
- *Solution Configuration* en **Release**
- *Solution Platform* en **ARM64**
- Mode de lancement en **Device**

<img width="203" alt="image" src="https://github.com/user-attachments/assets/392fd198-ae1c-4068-a6a2-69df7c8d3199" />

Allumer le Hololens 2 et connectez vous avec les identifiants indiqués dans la boîte.

Changer le mode du Hololens 2 en mode développeur en allant dans **Settings > Update and Security > For Developers** et en activant **Developer Mode**. 
Brancher le casque Hololens 2 à l'ordinateur en connexion USB. Regardez bien si le Hololens apparait parmi les appareils connectés sur votre ordinateur.

Avec le Hololens branché à l'ordinateur, lancer la compilation de l'application Hololens 2 dans **Debug > Start Without Debugging**.
Attendez la compilation de la solution qui peut prendre plusieurs minutes.

Proche de la fin de la compilation, vous verrez une Popup apparaître sur Visual Studio vous demandant un **code PIN**. Vous trouverez ce **code PIN** via le casque Hololens dans **Update > For Developers** et en tapant sur **Pair**. Tapez le code PIN sur Visual Studio puis continuez la compilation de l'application.

Si la compilation réussie, vous verrez une Popup dans le Hololens vous demander d'effectuer un recalibrage des yeux, vous n'êtes pas obligé de le faire. Au moment où vous voyez le Logo Unity s'afficher vous pouvez débrancher le casque de l'ordinateur et vous positionner en face du vide. L'application est donc lancé et vous verrez un panel de l'application **Masterglass**.

<img width="139" alt="image" src="https://github.com/user-attachments/assets/009bfa3a-484f-411d-9540-a6679e95cf89" />

Sur le panel, vous pouvez quitter l'application en appuyant sur l'icone en haut à droite du panel.
Pour enregistrer son microphone, appuyer sur le bouton **Call Alice**.

<img width="267" alt="image" src="https://github.com/user-attachments/assets/78fc9063-85a1-471b-95f8-22a162a92e33" />


Vous pouvez écouter le microphone de la personne à distance en appuyant sur **Playback**.
Vous pouvez désactiver l'enregistrement de votre microphone en recliquant sur le bouton **Call Alice**. Si votre voix a bien été enregistrée, vous aurez le répertoire affiché en texte en bas du panel. il vous suffira de brancher le Hololens à votre ordintauer et vérifier que l'enregistrement a bien été effecué dans le répertoire de stockage.

<img width="242" alt="image" src="https://github.com/user-attachments/assets/fd0ddfd5-40e2-45cb-bdc9-a5ab1e66fd44" />


