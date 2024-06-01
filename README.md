# institute-bot

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) installé sur votre machine
- [Docker Compose](https://docs.docker.com/compose/install/) installé sur votre machine

## Instructions

### 1. Cloner le dépôt

Clonez ce dépôt sur votre machine locale en utilisant la commande suivante :

```bash
git clone https://github.com/nayzflux/institute-bot.git
cd institute-bot
```

### 2. Build l'image Docker

Construisez l'image Docker avec le tag latest en exécutant la commande suivante dans le répertoire racine du projet :

```bash
docker build -t institute-bot:latest .
```

### 3. Modifier les variables d'environnement

Modifiez le fichier `compose.yml` pour ajouter vos variables d'environnement. Voici un exemple de section où les variables d'environnement doivent être ajoutées

```env
DISCORD_TOKEN=<your bot token>
DISCORD_CLIENT_ID=<your bot client id>
DATABASE_URL=<your database url>
```

### 3. Démarrer le Docker Compose

Une fois les variables d'environnement configurées, démarrez les services définis dans le `compose.yml` en exécutant la commande suivante :

```bash
docker-compose up -d
```

Votre application devrait maintenant être en cours d'exécution dans des conteneurs Docker.

### 4. Mise à jour

```bash
git pull
```

```bash
docker-compose up -d
```
