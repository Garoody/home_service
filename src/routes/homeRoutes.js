"use strict";

import { Router } from "express";

const router = Router();

// GET /
router.get("/", (_req, res) => res.redirect("/services"));

router.get("/qui-sommes-nous", (_req, res) => {
  res.render("pages/site/about", {
    title: "Qui sommes-nous - HomeService",
  });
});

router.get("/mentions-legales", (_req, res) => {
  res.render("pages/site/legal", {
    title: "Mentions legales - HomeService",
  });
});

export default router;
