"use strict";

export const notFound = (req, res) => {
  return res.status(404).render("pages/errors/404", {
    title: "Page introuvable",
    path: req.originalUrl,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.status || err.statusCode || 500;

  return res.status(status).render("pages/errors/500", {
    title: "Erreur",
    message: err.message || "Une erreur est survenue",
  });
};