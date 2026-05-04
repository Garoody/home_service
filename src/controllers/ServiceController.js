"use strict";

import { unlink } from "node:fs/promises";
import ServiceService from "../services/ServiceService.js";
import CategoryService from "../services/CategoryService.js";
import ReviewService from "../services/ReviewService.js";
import UserService from "../services/UserService.js";
import BookingService from "../services/BookingService.js";
import { validateServicePayload } from "../validators/serviceValidator.js";
import { PROVIDER_STATUS_OPTIONS } from "../constants/providerStatuses.js";
import { getFirstValidationMessage } from "../utils/formState.js";

function getCategoryId(category) {
  return category?.id || category?.id_category || null;
}

function getUploadedPhotoPaths(files = []) {
  if (!Array.isArray(files)) return [];
  return files
    .map((file) => file?.filename)
    .filter(Boolean)
    .map((fileName) => `/uploads/${fileName}`);
}

async function attachViewerStatesToServices({ services, currentUser }) {
  if (!Array.isArray(services) || services.length === 0 || !currentUser || currentUser.role === "admin") {
    return services || [];
  }

  const userId = currentUser.id || currentUser.id_user || currentUser.userId || null;
  if (!userId) return services;

  const serviceIds = services
    .map((service) => service?.id || service?.slug)
    .filter(Boolean);

  const viewerStates = await BookingService.getServiceViewerStatesForUser({
    clientId: userId,
    serviceIds,
  });

  return services.map((service) => ({
    ...service,
    viewer_state: viewerStates.get(String(service.id || service.slug)) || null,
  }));
}

async function cleanupUploadedFiles(files = []) {
  if (!Array.isArray(files) || files.length === 0) return;

  await Promise.allSettled(
    files
      .map((file) => file?.path)
      .filter(Boolean)
      .map((filePath) => unlink(filePath))
  );
}

class ServiceController {
  async index(req, res) {
    try {
      const { q, category_id, city } = req.query;
      const currentUser = req.session?.user || null;

      const [rawServices, categories] = await Promise.all([
        ServiceService.search({ q, category_id, city }),
        CategoryService.list(),
      ]);
      const services = await attachViewerStatesToServices({
        services: rawServices,
        currentUser,
      });

      res.render("pages/services/index", {
        title: "Services - HomeService",
        services,
        categories,
        q: q || "",
        category_id: category_id || "",
        city: city || "",
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/");
    }
  }

  async show(req, res) {
    try {
      const { slug } = req.params;
      const [rawService, reviews] = await Promise.all([
        ServiceService.getBySlug(slug),
        ReviewService.getByService(slug),
      ]);
      const [service] = await attachViewerStatesToServices({
        services: [rawService],
        currentUser: req.session?.user || null,
      });

      const currentUser = req.session?.user || null;
      const isAdmin = currentUser?.role === "admin";
      const isOwner =
        currentUser && String(currentUser.id || "") === String(service.provider_id || "");

      if (service.admin_status && service.admin_status !== "active" && !isAdmin && !isOwner) {
        throw new Error("Ce service est indisponible pour le moment.");
      }

      res.render("pages/services/show", {
        title: "Détail du service - HomeService",
        service,
        reviews,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/services");
    }
  }

  async create(req, res) {
    try {
      const userId = req.session?.user?.id ?? req.session?.userId;
      const [categories, user] = await Promise.all([
        CategoryService.list(),
        userId ? UserService.getById(userId) : Promise.resolve(null),
      ]);

      if (!user || user.deletedByAdminAt || user.bannedAt || user.suspendedAt) {
        req.flash("error", "Votre compte ne permet pas de publier de services.");
        return res.redirect("/auth/login");
      }

      if (!user.canPublishServices) {
        req.flash("error", "La publication de services est suspendue sur votre compte.");
        return res.redirect("/users/profile");
      }

      res.render("pages/services/new", {
        title: "Créer un service - HomeService",
        categories,
        providerStatusOptions: PROVIDER_STATUS_OPTIONS,
        defaultProviderStatus: user?.providerStatus || "",
        csrfToken: res.locals.csrfToken,
      });
      
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/services");
    }
  }

  async store(req, res) {
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];

    try {
      const providerId = req.session?.user?.id ?? req.session?.userId;

      if (!providerId) {
        req.flash("error", "Vous devez être connecté pour publier un service.");
        return res.redirect("/auth/login");
      }

      const provider = await UserService.getById(providerId);
      if (!provider || provider.deletedByAdminAt || provider.bannedAt || provider.suspendedAt) {
        await cleanupUploadedFiles(uploadedFiles);
        req.flash("error", "Votre compte ne permet pas de publier de services.");
        return res.redirect("/auth/login");
      }

      if (!provider.canPublishServices) {
        await cleanupUploadedFiles(uploadedFiles);
        req.flash("error", "La publication de services est suspendue sur votre compte.");
        return res.redirect("/users/profile");
      }

      const validation = validateServicePayload(req.body);
      if (!validation.success) {
        await cleanupUploadedFiles(uploadedFiles);
        req.saveOldInput(req.body);
        req.flash("error", getFirstValidationMessage(validation));
        return res.redirect("/services/new");
      }

      const category =
        validation.data.category_id === "other"
          ? await CategoryService.findOrCreateByName(validation.data.custom_category_name)
          : { id: validation.data.category_id };

      const categoryId = getCategoryId(category);
      if (!categoryId) {
        await cleanupUploadedFiles(uploadedFiles);
        req.saveOldInput(req.body);
        req.flash("error", "La catégorie du service est introuvable.");
        return res.redirect("/services/new");
      }

      const photoPaths = getUploadedPhotoPaths(uploadedFiles);
      if (
        photoPaths.length > 0 &&
        !(await ServiceService.hasServicePhotosTable())
      ) {
        await cleanupUploadedFiles(uploadedFiles);
        req.saveOldInput(req.body);
        req.flash("error", "Les photos de réalisations ne sont pas encore disponibles.");
        return res.redirect("/services/new");
      }

      const createdService = await ServiceService.create({
        provider_id: providerId,
        category_id: categoryId,
        title: validation.data.title,
        description: validation.data.description,
        price: validation.data.price,
        provider_status: validation.data.provider_status,
        experience_years: validation.data.experience_years,
        trainings: validation.data.trainings,
        has_driving_license: validation.data.has_driving_license,
        service_area: validation.data.service_area,
      });

      await UserService.updateProviderStatus({
        userId: providerId,
        provider_status: validation.data.provider_status,
      });

      if (photoPaths.length > 0) {
        await ServiceService.addPhotos(
          createdService.id || createdService.id_service,
          photoPaths
        );
      }

      req.flash("success", "Service créé et ajouté automatiquement dans sa catégorie.");
      res.redirect(`/services?category_id=${encodeURIComponent(String(categoryId))}`);
    } catch (error) {
      await cleanupUploadedFiles(uploadedFiles);
      req.saveOldInput(req.body);
      req.flash("error", error.message);
      res.redirect("/services/new");
    }
  }

  async edit(req, res) {
    try {
      const { slug } = req.params;
      const userId = req.session?.user?.id ?? req.session?.userId;
      const user = userId ? await UserService.getById(userId) : null;

      if (user?.role === "admin") {
        req.flash("error", "L'administrateur ne peut pas modifier un service depuis cet espace.");
        return res.redirect("/admin/services");
      }

      if (user && !user.canPublishServices) {
        req.flash("error", "La modification de vos services est suspendue par l'administration.");
        return res.redirect("/users/profile");
      }

      const [service, categories] = await Promise.all([
        ServiceService.getBySlug(slug),
        CategoryService.list(),
      ]);

      res.render("pages/services/edit", {
        title: "Modifier le service - HomeService",
        service,
        categories,
        providerStatusOptions: PROVIDER_STATUS_OPTIONS,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/services");
    }
  }

  async update(req, res) {
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];

    try {
      const { slug } = req.params;
      const userId = req.session?.user?.id ?? req.session?.userId;
      const user = userId ? await UserService.getById(userId) : null;

      if (user?.role === "admin") {
        await cleanupUploadedFiles(uploadedFiles);
        req.flash("error", "L'administrateur ne peut pas modifier un service depuis cet espace.");
        return res.redirect("/admin/services");
      }

      if (user && !user.canPublishServices) {
        await cleanupUploadedFiles(uploadedFiles);
        req.flash("error", "La modification de vos services est suspendue par l'administration.");
        return res.redirect("/users/profile");
      }

      const validation = validateServicePayload(req.body);
      if (!validation.success) {
        await cleanupUploadedFiles(uploadedFiles);
        req.saveOldInput(req.body);
        req.flash("error", getFirstValidationMessage(validation));
        return res.redirect(`/services/${slug}/edit`);
      }

      const category =
        validation.data.category_id === "other"
          ? await CategoryService.findOrCreateByName(validation.data.custom_category_name)
          : { id: validation.data.category_id };

      const categoryId = getCategoryId(category);
      if (!categoryId) {
        await cleanupUploadedFiles(uploadedFiles);
        req.saveOldInput(req.body);
        req.flash("error", "La catégorie du service est introuvable.");
        return res.redirect(`/services/${slug}/edit`);
      }

      const photoPaths = getUploadedPhotoPaths(uploadedFiles);
      const currentService =
        photoPaths.length > 0 ? await ServiceService.getBySlug(slug) : null;

      if (
        photoPaths.length > 0 &&
        !(await ServiceService.hasServicePhotosTable())
      ) {
        await cleanupUploadedFiles(uploadedFiles);
        req.saveOldInput(req.body);
        req.flash("error", "Les photos de réalisations ne sont pas encore disponibles.");
        return res.redirect(`/services/${slug}/edit`);
      }

      if (photoPaths.length > 0) {
        const currentCount = await ServiceService.getPhotoCountByServiceId(
          currentService?.id
        );

        if (currentCount + photoPaths.length > 6) {
          await cleanupUploadedFiles(uploadedFiles);
          req.saveOldInput(req.body);
          req.flash(
            "error",
            "Vous pouvez publier jusqu'à 6 photos de réalisations par service."
          );
          return res.redirect(`/services/${slug}/edit`);
        }
      }

      await ServiceService.updateBySlug(slug, {
        category_id: categoryId,
        title: validation.data.title,
        description: validation.data.description,
        price: validation.data.price,
        provider_status: validation.data.provider_status,
        experience_years: validation.data.experience_years,
        trainings: validation.data.trainings,
        has_driving_license: validation.data.has_driving_license,
        service_area: validation.data.service_area,
      });

      if (userId) {
        await UserService.updateProviderStatus({
          userId,
          provider_status: validation.data.provider_status,
        });
      }

      if (photoPaths.length > 0 && currentService?.id) {
        await ServiceService.addPhotos(currentService.id, photoPaths);
      }

      req.flash("success", "Service mis a jour.");
      res.redirect(`/services/${slug}`);
    } catch (error) {
      await cleanupUploadedFiles(uploadedFiles);
      req.saveOldInput(req.body);
      req.flash("error", error.message);
      res.redirect(`/services/${req.params.slug}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      const { slug } = req.params;
      const providerId = req.session?.user?.id ?? req.session?.userId;

      if (!providerId) {
        req.flash("error", "Vous devez être connecte pour supprimer ce service.");
        return res.redirect("/auth/login");
      }

      await ServiceService.deleteBySlug({
        slug,
        providerId,
      });

      req.flash("success", "Service supprime.");
      return res.redirect("/users/profile");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect(`/services/${req.params.slug}`);
    }
  }
}

export default new ServiceController();
