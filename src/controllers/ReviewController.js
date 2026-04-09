"use strict";

import ReviewService from "../services/ReviewService.js";
import {
  validateReviewPayload,
  validateReviewReplyPayload,
  validateReviewUpdatePayload,
} from "../validators/reviewValidator.js";
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

class ReviewController {
  async new(req, res) {
    try {
      const { bookingId } = req.params;
      const clientId = getUserId(req);
      const booking = await ReviewService.getBookingReviewContext({ bookingId, clientId });

      if (booking.payment_status !== "paid") {
        req.flash("error", "Vous pourrez laisser un avis apres validation du paiement.");
        return res.redirect("/bookings");
      }

      if (booking.review_id) {
        req.flash("info", "Un avis existe deja pour cette reservation. Vous pouvez encore le modifier.");
        return res.redirect(`/reviews/${booking.review_id}/edit`);
      }

      return res.render("pages/reviews/new", {
        title: "Laisser un avis - HomeService",
        booking,
        review: null,
        formAction: "/reviews",
        submitLabel: "Publier mon avis",
        pageHeading: "Laisser un avis",
        introCopy:
          "Votre paiement est valide. Vous pouvez maintenant noter ce prestataire et partager votre experience.",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/bookings");
    }
  }

  async edit(req, res) {
    try {
      const { reviewId } = req.params;
      const clientId = getUserId(req);
      const review = await ReviewService.getReviewByIdForClient({ reviewId, clientId });

      return res.render("pages/reviews/new", {
        title: "Modifier mon avis - HomeService",
        booking: {
          booking_id: review.booking_id,
          provider_id: review.provider_id,
          provider_name: review.provider_name,
          service_title: review.service_title,
        },
        review,
        formAction: `/reviews/${review.id}`,
        submitLabel: "Enregistrer mon avis",
        pageHeading: "Modifier mon avis",
        introCopy:
          "Vous pouvez corriger votre note et votre commentaire a tout moment apres le paiement.",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile/reviews-given");
    }
  }

  async store(req, res) {
    try {
      const clientId = getUserId(req);
      const validation = validateReviewPayload(req.body);
      const reviewFormPath = req.body?.booking_id
        ? `/reviews/bookings/${req.body.booking_id}/new`
        : "/bookings";

      if (!validation.success) {
        req.saveOldInput(req.body);
        req.flash("error", getFirstValidationMessage(validation));
        return res.redirect(reviewFormPath);
      }

      await ReviewService.create({
        booking_id: validation.data.booking_id,
        client_id: clientId,
        provider_id: validation.data.provider_id,
        rating: validation.data.rating,
        comment: validation.data.comment,
      });

      req.flash("success", "Avis publie avec succes.");
      return res.redirect("/users/profile/reviews-given");
    } catch (error) {
      const reviewFormPath = req.body?.booking_id
        ? `/reviews/bookings/${req.body.booking_id}/new`
        : "/bookings";
      req.saveOldInput(req.body);
      req.flash("error", error.message);
      return res.redirect(reviewFormPath);
    }
  }

  async update(req, res) {
    try {
      const clientId = getUserId(req);
      const { reviewId } = req.params;
      const validation = validateReviewUpdatePayload(req.body);
      const editPath = `/reviews/${reviewId}/edit`;

      if (!validation.success) {
        req.saveOldInput(req.body);
        req.flash("error", getFirstValidationMessage(validation));
        return res.redirect(editPath);
      }

      await ReviewService.updateByClient({
        reviewId,
        clientId,
        rating: validation.data.rating,
        comment: validation.data.comment,
      });

      req.flash("success", "Avis mis a jour avec succes.");
      return res.redirect("/users/profile/reviews-given");
    } catch (error) {
      req.saveOldInput(req.body);
      req.flash("error", error.message);
      return res.redirect(`/reviews/${req.params.reviewId}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      const clientId = getUserId(req);
      const { reviewId } = req.params;

      await ReviewService.deleteByClient({ reviewId, clientId });

      req.flash("success", "Avis supprime avec succes.");
      return res.redirect("/users/profile/reviews-given");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile/reviews-given");
    }
  }

  async reply(req, res) {
    try {
      const providerId = getUserId(req);
      const { reviewId } = req.params;
      const validation = validateReviewReplyPayload(req.body);

      if (!validation.success) {
        req.flash("error", getFirstValidationMessage(validation));
        return res.redirect("/users/profile/reviews-received");
      }

      await ReviewService.replyByProvider({
        reviewId,
        providerId,
        providerReply: validation.data.provider_reply,
      });

      req.flash("success", "Reponse publiee avec succes.");
      return res.redirect("/users/profile/reviews-received");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile/reviews-received");
    }
  }
}

export default new ReviewController();
