# Masterglass

## Installation
### Prérequis
Avant d'installer et d'exécuter le projet, assurez-vous d'avoir installé :
- [Node.js](https://nodejs.org/en/download)

Pensez à activer votre micro sur votre ordinateur, ainsi que le son des haut parleur

## Clonage du projet
Une fois avoir installer Node.js, cloner le dépôt du projet.
Pour cela ouvrez un terminal, afin de lancer la commande suivante :   

```sh
git clone https://github.com/marcusaasjensen/masterglass.git
```
Ensuite ouvrez le dépôt du projet à la racine avec votre IDE préféré.

## Installation de l'application mobile
Accéder au dossier de l'application mobile `App/masterglass` et installer les dépendances avec les commandes suivantes : 

```sh
cd App/masterglass
npm install
```

## Installation de l'application mobile
Accéder au dossier du serveur `Server` et installer les dépendances avec les commandes suivantes : 

```sh
cd Server
npm install
```

## Execution
### Lancer l'application mobile

Rendez vous dans le dossier de l'application mobile :
```sh
cd App/masteglass
```
Démarrez l'application avec Expo :
```sh
npx expo start
```
Appuyez sur `w` pour ouvrir l'application dans un navigateur web.

### Lancer le serveur
Se rendre dans le dossier du serveur `Server`:

```sh
cd Server
```

Exécutez le script du serveur avec Node.js :

```sh
node server.js
```
