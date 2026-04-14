# 🖥️ Node.js CLI & Module `fs`

Dans le contexte de **Node.js**, `fs` signifie **File System** (système de fichiers).

C’est un module intégré (core module) qui permet d’effectuer des opérations d’**entrée/sortie (I/O)** sur les fichiers et dossiers du serveur.

Il est très utilisé pour :

- gérer des fichiers
- créer des dossiers
- lire des fichiers JSON
- écrire des logs
- manipuler des uploads

---

## 📦 Import du module

```javascript
import fs from "fs";

ou (CommonJS)

const fs = require("fs");
📚 Principales fonctionnalités
📄 1️⃣ Lecture / Écriture de fichiers
Lecture asynchrone (recommandée)
fs.readFile("data.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});
Lecture synchrone (bloquante)
const data = fs.readFileSync("data.txt", "utf8");
console.log(data);

⚠️ readFileSync() bloqué le thread principal.

Écriture de fichier
fs.writeFile("output.txt", "Contenu écrit", (err) => {
  if (err) console.error(err);
});

Version synchrone :

fs.writeFileSync("output.txt", "Contenu écrit");
📁 2️⃣ Gestion des dossiers
Création
fs.mkdir("uploads", { recursive: true }, (err) => {
  if (err) console.error(err);
});

recursive: true permet de créer les sous-dossiers si besoin.

Suppression
fs.rmdir("uploads", (err) => {
  if (err) console.error(err);
});

⚠️ Pour supprimer un dossier non vide :

fs.rm("uploads", { recursive: true, force: true }, (err) => {
  if (err) console.error(err);
});
Lecture du contenu d’un dossier
fs.readdir("uploads", (err, files) => {
  if (err) console.error(err);
  console.log(files);
});
🔄 3️⃣ Opérations synchrones vs asynchrones

Node.js est non bloquant.

🔹 Asynchrone (recommandé)
fs.readFile("file.txt", callback);

Non bloquant

Performant

Adapté aux serveurs

🔹 Synchrone
fs.readFileSync("file.txt");

Bloque l’exécution

Utilisable en CLI simple

À éviter en production serveur

🌊 4️⃣ Manipulation des flux (Streams)

Les streams sont utiles pour les gros fichiers.

Lecture en flux
const stream = fs.createReadStream("bigfile.txt", "utf8");

stream.on("data", (chunk) => {
  console.log(chunk);
});
Écriture en flux
const writeStream = fs.createWriteStream("copy.txt");

writeStream.write("Texte 1\n");
writeStream.write("Texte 2\n");
writeStream.end();
📊 5️⃣ Accès aux métadonnées
Obtenir les infos d’un fichier
fs.stat("data.txt", (err, stats) => {
  if (err) console.error(err);

  console.log("Taille :", stats.size);
  console.log("Créé le :", stats.birthtime);
  console.log("Est-ce un fichier ?", stats.isFile());
  console.log("Est-ce un dossier ?", stats.isDirectory());
});

Version synchrone :

const stats = fs.statSync("data.txt");
console.log(stats.size);
🧰 Utilisation en CLI (Command Line Interface)

Node.js peut être utilisé en ligne de commande.

Exemple simple :
// cli.js
import fs from "fs";

const filename = process.argv[2];

if (!filename) {
  console.log("Usage: node cli.js <filename>");
  process.exit(1);
}

const content = fs.readFileSync(filename, "utf8");
console.log(content);

Exécution :

node cli.js data.txt
🧠 Bonnes pratiques

Préférer les versions asynchrones (readFile au lieu de readFileSync)

Utiliser les streams pour les gros fichiers

Toujours gérer les erreurs (if (err))

Ne pas exposer les chemins système sensibles

Utiliser path module pour gérer les chemins :

import path from "path";

const filePath = path.join(process.cwd(), "uploads", "file.txt");
🏗️ Cas concrets dans HomeServices

Le module fs peut servir à :

Stocker des photos de profil

Sauvegarder des logs

Lire des fichiers JSON de configuration

Gérer des uploads temporaires

Dernière mise à jour : 23/02/2026
```
