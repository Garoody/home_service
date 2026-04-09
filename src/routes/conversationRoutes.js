"use strict";

import { Router } from "express";
import ConversationController from "../controllers/ConversationController.js";
import { requireMember } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireMember);

router.get("/", ConversationController.index);
router.get("/:id", ConversationController.show);
router.post("/:id/messages", ConversationController.sendMessage);
router.post("/:id/archive", ConversationController.archive);
router.post("/:id/unarchive", ConversationController.unarchive);
router.post("/:id/delete", ConversationController.delete);
router.post("/:id/block", ConversationController.block);

export default router;
