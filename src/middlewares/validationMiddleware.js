"use strict";

// On valide et en cas d’erreur on redirige (pas JSON) 



import { ZodError } from "zod";

export const validate = (schema, where = "body") => (req, res, next) => {
  try {
    req[where] = schema.parse(req[where]);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      req.flash?.("error", messages.join(" | "));
      return res.redirect("back");
    }
    next(err);
  }
};