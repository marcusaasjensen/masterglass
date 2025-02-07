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

### Lancer le serveur
Rendez-vous dans le dossier du serveur `Server`:

```sh
cd Server
```

Exécutez le script du serveur avec Node.js :

```sh
node server.js
```
