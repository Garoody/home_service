"use strict";

// est là pour mettre les valeurs métier fixes dans un endroit central, 
// afin d’avoir un projet plus propre, plus cohérent et plus facile à maintenir.

export const PROVIDER_STATUS_OPTIONS = Object.freeze([
  { value: "Particulier", label: "Particulier" },
  { value: "Auto-entrepreneur", label: "Auto-entrepreneur" },
  { value: "Entreprise", label: "Entreprise" },
  { value: "Association", label: "Association" },
  { value: "Artisan", label: "Artisan" },
  { value: "Independant / Freelance", label: "Independant / Freelance" },
  { value: "Autre", label: "Autre" },
]);

export const PROVIDER_STATUS_VALUES = Object.freeze(
  PROVIDER_STATUS_OPTIONS.map((option) => option.value)
);

export function isProviderStatusValue(value) {
  return PROVIDER_STATUS_VALUES.includes(value);
}


// Concrètement, ça sert à 4 choses :

// Éviter les doublons
// Au lieu de réécrire la même liste partout, tu la définis une seule fois.

// Garder la cohérence
// Les mêmes statuts sont utilisés partout dans l’application.

// Faciliter la validation
// Les validateurs comme userValidator.js et serviceValidator.js s’appuient dessus pour accepter seulement les bonnes valeurs.

// Alimenter les formulaires
// Les contrôleurs comme UserController.js et ServiceController.js peuvent envoyer cette liste aux vues pour afficher les options dans les formulaires.