"use strict";

import ConversationService from "../services/ConversationService.js";
import { validateConversationMessagePayload } from "../validators/conversationValidator.js";
import { getFirstValidationMessage } from "../utils/formState.js";

function getUserId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

function wantsJson(req) {
  const acceptHeader = String(req.get("accept") || "");
  const requestedWith = String(req.get("x-requested-with") || "");

  return acceptHeader.includes("application/json") || requestedWith.toLowerCase() === "fetch";
}

class ConversationController {
  async index(req, res) {
    try {
      const userId = getUserId(req);
      const scope = req.query.scope === "archived" ? "archived" : "active";
      const conversations = await ConversationService.listForUser(userId, { scope });

      res.render("pages/conversations/index", {
        title: "Mes conversations - HomeService",
        conversations,
        conversationScope: scope,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/users/profile");
    }
  }

  async show(req, res) {
    const expectsJson = wantsJson(req);

    try {
      const userId = getUserId(req);
      const conversation = await ConversationService.getByIdForUser({
        conversationId: req.params.id,
        userId,
      });

      if (expectsJson) {
        return res.json({
          success: true,
          conversation: {
            id: conversation.id,
            is_blocked: conversation.is_blocked,
            blocked_by_me: conversation.blocked_by_me,
            blocked_by_other: conversation.blocked_by_other,
            messages: conversation.messages,
          },
        });
      }

      res.render("pages/conversations/show", {
        title: "Discussion - HomeService",
        conversation,
        csrfToken: res.locals.csrfToken,
        unreadConversationCount: await ConversationService.getUnreadCountForUser(userId),
      });
    } catch (error) {
      if (expectsJson) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      req.flash("error", error.message);
      res.redirect("/conversations");
    }
  }

  async sendMessage(req, res) {
    const expectsJson = wantsJson(req);

    try {
      const userId = getUserId(req);
      const conversationId = req.params.id;
      const validation = validateConversationMessagePayload(req.body);

      if (!validation.success) {
        if (expectsJson) {
          return res.status(422).json({
            success: false,
            error: getFirstValidationMessage(validation),
          });
        }

        req.saveOldInput(req.body);
        req.flash("error", getFirstValidationMessage(validation));
        return res.redirect(`/conversations/${conversationId}`);
      }

      const message = await ConversationService.sendMessage({
        conversationId,
        userId,
        message: validation.data.message,
      });

      if (expectsJson) {
        return res.status(201).json({
          success: true,
          message,
        });
      }

      return res.redirect(`/conversations/${conversationId}`);
    } catch (error) {
      if (expectsJson) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      req.saveOldInput(req.body);
      req.flash("error", error.message);
      return res.redirect(`/conversations/${req.params.id}`);
    }
  }

  async archive(req, res) {
    try {
      await ConversationService.archiveForUser({
        conversationId: req.params.id,
        userId: getUserId(req),
      });
      req.flash("success", "Conversation archivee.");
      return res.redirect("/conversations?scope=archived");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect(`/conversations/${req.params.id}`);
    }
  }

  async unarchive(req, res) {
    try {
      await ConversationService.unarchiveForUser({
        conversationId: req.params.id,
        userId: getUserId(req),
      });
      req.flash("success", "Conversation reactivee.");
      return res.redirect(`/conversations/${req.params.id}`);
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/conversations?scope=archived");
    }
  }

  async delete(req, res) {
    try {
      await ConversationService.deleteForUser({
        conversationId: req.params.id,
        userId: getUserId(req),
      });
      req.flash("success", "Conversation supprimee de votre espace.");
      return res.redirect("/conversations");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect(`/conversations/${req.params.id}`);
    }
  }

  async block(req, res) {
    try {
      await ConversationService.blockForUser({
        conversationId: req.params.id,
        userId: getUserId(req),
      });
      req.flash("success", "Conversation bloquee.");
      return res.redirect(`/conversations/${req.params.id}`);
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect(`/conversations/${req.params.id}`);
    }
  }
}

export default new ConversationController();
