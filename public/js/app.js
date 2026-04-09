document.addEventListener("DOMContentLoaded", () => {
  const initOldInputHydration = () => {
    const oldInputNode = document.getElementById("old-input-data");
    if (!(oldInputNode instanceof HTMLScriptElement)) return;

    let oldInput = {};

    try {
      oldInput = JSON.parse(oldInputNode.textContent || "{}");
    } catch {
      return;
    }

    if (!oldInput || typeof oldInput !== "object") return;

    const isTruthyValue = (value) =>
      value === true ||
      value === "true" ||
      value === "on" ||
      value === "1" ||
      value === 1;

    Object.entries(oldInput).forEach(([name, rawValue]) => {
      if (!name || name === "_csrf") return;

      const fields = Array.from(document.getElementsByName(name));
      if (fields.length === 0) return;

      fields.forEach((field) => {
        if (
          !(
            field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement
          )
        ) {
          return;
        }

        if (
          field instanceof HTMLInputElement &&
          (field.type === "file" || field.type === "password")
        ) {
          return;
        }

        if (
          field instanceof HTMLInputElement &&
          (field.type === "radio" || field.type === "checkbox")
        ) {
          if (field.type === "radio") {
            field.checked = String(field.value) === String(rawValue);
            return;
          }

          if (Array.isArray(rawValue)) {
            field.checked = rawValue.map(String).includes(String(field.value));
            return;
          }

          field.checked =
            field.value && field.value !== "on"
              ? String(field.value) === String(rawValue)
              : isTruthyValue(rawValue);
          return;
        }

        if (field instanceof HTMLSelectElement && field.multiple) {
          const values = Array.isArray(rawValue)
            ? rawValue.map(String)
            : [String(rawValue)];

          Array.from(field.options).forEach((option) => {
            option.selected = values.includes(String(option.value));
          });
          return;
        }

        field.value = rawValue == null ? "" : String(rawValue);
      });
    });
  };

  const initPasswordVisibilityToggles = () => {
    const toggles = Array.from(
      document.querySelectorAll("[data-password-visibility]")
    );

    toggles.forEach((toggle) => {
      if (!(toggle instanceof HTMLInputElement)) return;

      const targetId = toggle.dataset.passwordTarget;
      if (!targetId) return;

      const passwordField = document.getElementById(targetId);
      if (!(passwordField instanceof HTMLInputElement)) return;

      const syncVisibility = () => {
        passwordField.type = toggle.checked ? "text" : "password";
      };

      toggle.addEventListener("change", syncVisibility);
      syncVisibility();
    });
  };

  const initNavigationControls = () => {
    const menuButton = document.getElementById("menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");

    if (
      menuButton instanceof HTMLButtonElement &&
      mobileMenu instanceof HTMLElement
    ) {
      menuButton.addEventListener("click", () => {
        mobileMenu.classList.toggle("hidden");
        menuButton.setAttribute(
          "aria-expanded",
          String(!mobileMenu.classList.contains("hidden"))
        );
      });
    }

    const storageKey = "homeservice-theme";
    const themeButtons = Array.from(
      document.querySelectorAll("[data-theme-toggle]")
    );

    if (themeButtons.length === 0) return;

    const getTheme = () => {
      const currentTheme = document.documentElement.dataset.theme;
      return currentTheme === "dark" ? "dark" : "light";
    };

    const applyTheme = (theme) => {
      const nextTheme = theme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;

      themeButtons.forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return;

        const label = button.querySelector("[data-theme-toggle-label]");
        const isDark = nextTheme === "dark";

        button.classList.toggle("service-nav__theme--active", isDark);
        button.setAttribute("aria-pressed", String(isDark));

        if (label instanceof HTMLElement) {
          label.textContent = isDark ? "Mode clair" : "Mode sombre";
        }
      });
    };

    applyTheme(getTheme());

    themeButtons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;

      button.addEventListener("click", () => {
        const nextTheme = getTheme() === "dark" ? "light" : "dark";
        applyTheme(nextTheme);

        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch {}
      });
    });
  };

  const initBookingPaymentForm = () => {
    const container = document.querySelector("[data-booking-payment-form]");
    if (!(container instanceof HTMLElement)) return;

    const radios = Array.from(
      container.querySelectorAll('input[name="payment_method"]')
    );
    const panels = Array.from(
      container.querySelectorAll("[data-payment-panel]")
    );
    const panelFields = Array.from(
      container.querySelectorAll(
        "[data-payment-panel] input, [data-payment-panel] textarea, [data-payment-panel] select"
      )
    );
    const submitButton = document.getElementById("booking-submit-button");
    const cardNumberInput = document.getElementById("card_number");
    const expiryInput = document.getElementById("expiry");
    const ibanInput = document.getElementById("iban");
    const bicInput = document.getElementById("bic");

    const buttonLabels = {
      cb: "Envoyer la demande",
      paypal: "Envoyer la demande",
      bank_transfer: "Envoyer la demande",
      cash: "Envoyer la demande",
    };

    const syncPaymentSelection = (forcedMethod) => {
      const selectedMethod =
        forcedMethod ||
        container.querySelector('input[name="payment_method"]:checked')?.value ||
        "";

      panels.forEach((panel) => {
        if (!(panel instanceof HTMLElement)) return;
        const isActive = panel.dataset.paymentPanel === selectedMethod;
        panel.style.display = isActive ? "block" : "none";
        panel.setAttribute("aria-hidden", String(!isActive));
      });

      panelFields.forEach((field) => {
        if (
          !(
            field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement
          )
        ) {
          return;
        }

        const panel = field.closest("[data-payment-panel]");
        if (!(panel instanceof HTMLElement)) return;

        field.disabled = panel.dataset.paymentPanel !== selectedMethod;
      });

      radios.forEach((radio) => {
        const label = radio.closest(".payment-choice");
        if (!(label instanceof HTMLElement)) return;

        const isSelected = radio.checked;
        label.classList.toggle("payment-choice--active", isSelected);
      });

      if (submitButton instanceof HTMLElement) {
        submitButton.textContent =
          buttonLabels[selectedMethod] || "Confirmer la reservation";
      }
    };

    radios.forEach((radio) => {
      radio.addEventListener("change", () => syncPaymentSelection(radio.value));
      radio.addEventListener("click", () => syncPaymentSelection(radio.value));
    });

    if (cardNumberInput instanceof HTMLInputElement) {
      cardNumberInput.addEventListener("input", () => {
        const digits = cardNumberInput.value.replace(/\D+/g, "").slice(0, 19);
        cardNumberInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
      });
    }

    if (expiryInput instanceof HTMLInputElement) {
      expiryInput.addEventListener("input", () => {
        const digits = expiryInput.value.replace(/\D+/g, "").slice(0, 4);
        const month = digits.slice(0, 2);
        const year = digits.slice(2, 4);
        expiryInput.value = year ? `${month}/${year}` : month;
      });
    }

    if (ibanInput instanceof HTMLInputElement) {
      ibanInput.addEventListener("input", () => {
        const normalized = ibanInput.value
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 34);

        ibanInput.value = normalized.replace(/(.{4})/g, "$1 ").trim();
      });
    }

    if (bicInput instanceof HTMLInputElement) {
      bicInput.addEventListener("input", () => {
        bicInput.value = bicInput.value
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 11);
      });
    }

    syncPaymentSelection();
  };

  const initBookingDateTimeGuards = () => {
    const dateInputs = Array.from(
      document.querySelectorAll('input[data-booking-date][type="date"]')
    );

    const getParisNow = () => {
      const formatter = new Intl.DateTimeFormat("fr-CA", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });

      const parts = Object.fromEntries(
        formatter
          .formatToParts(new Date())
          .filter((part) => part.type !== "literal")
          .map((part) => [part.type, part.value])
      );

      const today = `${parts.year}-${parts.month}-${parts.day}`;
      const nextMinute =
        Number(parts.hour) * 60 + Number(parts.minute) + 1;

      return {
        today,
        minTimeToday:
          nextMinute <= 1439
            ? `${String(Math.floor(nextMinute / 60)).padStart(2, "0")}:${String(nextMinute % 60).padStart(2, "0")}`
            : null,
      };
    };

    dateInputs.forEach((dateInput) => {
      if (!(dateInput instanceof HTMLInputElement)) return;

      const form = dateInput.closest("form");
      const timeInput = form?.querySelector('input[data-booking-time][type="time"]');
      if (!(timeInput instanceof HTMLInputElement)) return;

      const syncConstraints = () => {
        const { today, minTimeToday } = getParisNow();

        dateInput.min = today;
        dateInput.setCustomValidity("");
        timeInput.setCustomValidity("");
        timeInput.disabled = false;

        if (dateInput.value && dateInput.value < today) {
          dateInput.value = today;
        }

        if (dateInput.value === today) {
          if (!minTimeToday) {
            timeInput.value = "";
            timeInput.disabled = true;
            timeInput.min = "";
            timeInput.setCustomValidity(
              "Aucun creneau n'est disponible pour aujourd'hui."
            );
            return;
          }

          timeInput.min = minTimeToday;

          if (timeInput.value && timeInput.value < minTimeToday) {
            timeInput.value = "";
          }

          return;
        }

        timeInput.min = "00:00";
      };

      dateInput.addEventListener("change", syncConstraints);
      timeInput.addEventListener("focus", syncConstraints);
      syncConstraints();
    });
  };

  const initClickableCards = () => {
    const cards = Array.from(document.querySelectorAll("[data-card-link]"));
    const focusCards = Array.from(document.querySelectorAll("[data-card-focus]"));

    const isInteractiveTarget = (target) =>
      target instanceof Element &&
      Boolean(
        target.closest(
          'a, button, input, textarea, select, label, summary, [role="button"], [role="link"]'
        )
      );

    cards.forEach((card) => {
      if (!(card instanceof HTMLElement)) return;

      const href = card.dataset.cardLink;
      if (!href) return;

      card.addEventListener("click", (event) => {
        if (isInteractiveTarget(event.target)) return;

        const selection = window.getSelection?.();
        if (selection && String(selection).trim()) return;

        window.location.href = href;
      });

      card.addEventListener("keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        if (isInteractiveTarget(event.target)) return;

        event.preventDefault();
        window.location.href = href;
      });
    });

    focusCards.forEach((card) => {
      if (!(card instanceof HTMLElement)) return;

      const targetId = card.dataset.cardFocus;
      if (!targetId) return;

      const focusTarget = document.getElementById(targetId);
      if (!(focusTarget instanceof HTMLElement)) return;

      let highlightTimeout;

      const highlightTarget = () => {
        focusTarget.classList.add("admin-card-panel--active");

        if (highlightTimeout) {
          window.clearTimeout(highlightTimeout);
        }

        highlightTimeout = window.setTimeout(() => {
          focusTarget.classList.remove("admin-card-panel--active");
        }, 1600);
      };

      const focusPrimaryControl = () => {
        const primaryTarget =
          focusTarget.matches(
            'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
          )
            ? focusTarget
            : focusTarget.querySelector(
                'select, textarea, input, button, a[href], [tabindex]:not([tabindex="-1"])'
              );

        if (primaryTarget instanceof HTMLElement) {
          primaryTarget.focus();
        }
      };

      const focusCardTarget = (event) => {
        if (isInteractiveTarget(event.target)) return;

        const selection = window.getSelection?.();
        if (selection && String(selection).trim()) return;

        highlightTarget();
        focusPrimaryControl();
        focusTarget.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      card.addEventListener("click", focusCardTarget);

      card.addEventListener("keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        if (isInteractiveTarget(event.target)) return;

        event.preventDefault();
        highlightTarget();
        focusPrimaryControl();
        focusTarget.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  const initConversationMessageGuards = () => {
    const forms = Array.from(
      document.querySelectorAll("[data-conversation-message-form]")
    );

    forms.forEach((form) => {
      if (!(form instanceof HTMLFormElement)) return;

      const textarea = form.querySelector("[data-conversation-message-input]");
      const submitButton = form.querySelector("[data-conversation-message-submit]");
      const feedback = form.querySelector("[data-conversation-form-feedback]");
      const messagesContainer = document.querySelector("[data-conversation-messages]");
      const emptyState = messagesContainer?.querySelector("[data-conversation-empty-state]");
      const newMessageIndicator = document.querySelector(
        "[data-conversation-new-indicator]"
      );
      const refreshUrl = messagesContainer?.dataset.conversationRefreshUrl || "";
      const currentUserId = String(form.dataset.currentUserId || "");
      const knownMessageIds = new Set(
        Array.from(
          messagesContainer?.querySelectorAll("[data-conversation-message-id]") || []
        )
          .map((node) => node.getAttribute("data-conversation-message-id"))
          .filter(Boolean)
      );

      if (!(textarea instanceof HTMLTextAreaElement)) return;

      let isSubmitting = false;
      let isPolling = false;
      let unseenIncomingCount = 0;

      const setFeedback = (message = "", isError = true) => {
        if (!(feedback instanceof HTMLElement)) return;

        feedback.textContent = message;
        feedback.classList.toggle("hidden", !message);
        feedback.classList.toggle("text-rose-300", Boolean(message) && isError);
        feedback.classList.toggle("text-emerald-300", Boolean(message) && !isError);
      };

      const syncState = () => {
        const isEmpty = textarea.value.trim().length === 0;
        textarea.setCustomValidity(isEmpty ? "Le message est vide." : "");

        if (submitButton instanceof HTMLButtonElement) {
          submitButton.disabled = isEmpty || isSubmitting;
          submitButton.classList.toggle("opacity-60", isEmpty || isSubmitting);
          submitButton.classList.toggle("cursor-not-allowed", isEmpty || isSubmitting);
        }
      };

      const scrollConversationToBottom = (behavior = "smooth") => {
        if (!(messagesContainer instanceof HTMLElement)) return;

        const hasOwnScrollbar =
          messagesContainer.scrollHeight > messagesContainer.clientHeight + 8;

        if (hasOwnScrollbar) {
          messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior,
          });
          return;
        }

        const lastMessage = messagesContainer.lastElementChild;
        if (lastMessage instanceof HTMLElement) {
          lastMessage.scrollIntoView({ behavior, block: "end" });
        }
      };

      const hideNewMessageIndicator = () => {
        unseenIncomingCount = 0;

        if (newMessageIndicator instanceof HTMLButtonElement) {
          newMessageIndicator.classList.add("hidden");
          newMessageIndicator.textContent = "1 nouveau message";
        }
      };

      const showNewMessageIndicator = () => {
        if (!(newMessageIndicator instanceof HTMLButtonElement)) return;

        const label =
          unseenIncomingCount > 1
            ? `${unseenIncomingCount} nouveaux messages`
            : "1 nouveau message";

        newMessageIndicator.textContent = label;
        newMessageIndicator.classList.remove("hidden");
      };

      const isNearBottom = () => {
        if (!(messagesContainer instanceof HTMLElement)) return true;

        return (
          messagesContainer.scrollHeight -
            messagesContainer.scrollTop -
            messagesContainer.clientHeight <
          96
        );
      };

      const buildMessageNode = (message) => {
        const isMine = String(message?.sender_id || "") === currentUserId;
        const wrapper = document.createElement("div");
        wrapper.className = `flex ${isMine ? "justify-end" : "justify-start"}`;

        if (message?.id) {
          wrapper.setAttribute("data-conversation-message-id", String(message.id));
        }

        const bubble = document.createElement("div");
        bubble.className = `${
          isMine
            ? "bg-blue-600/90 text-white"
            : "bg-slate-900/60 text-slate-100 border border-white/10"
        } max-w-xl rounded-2xl px-4 py-3 shadow-lg`;

        const header = document.createElement("div");
        header.className = "flex items-center justify-between gap-3";

        const author = document.createElement("p");
        author.className = `text-xs font-medium ${isMine ? "text-blue-100" : "text-slate-400"}`;
        author.textContent = isMine ? "Vous" : message?.sender_name || "Utilisateur";

        const date = document.createElement("p");
        date.className = `text-[11px] ${isMine ? "text-blue-100/80" : "text-slate-500"}`;
        date.textContent = message?.created_at
          ? new Date(message.created_at).toLocaleString("fr-FR")
          : "";

        header.append(author, date);

        const content = document.createElement("p");
        content.className = "mt-2 whitespace-pre-wrap text-sm leading-6";
        content.textContent = message?.content || "";

        bubble.append(header, content);
        wrapper.appendChild(bubble);
        return wrapper;
      };

      const appendMessage = (message, { behavior = "smooth", forceScroll = false } = {}) => {
        if (!(messagesContainer instanceof HTMLElement) || !message) return;
        if (message.id && knownMessageIds.has(String(message.id))) return;

        if (emptyState instanceof HTMLElement) {
          emptyState.remove();
        }

        const shouldStickToBottom = forceScroll || isNearBottom();
        const wrapper = buildMessageNode(message);
        messagesContainer.appendChild(wrapper);

        if (message.id) {
          knownMessageIds.add(String(message.id));
        }

        if (shouldStickToBottom) {
          hideNewMessageIndicator();
          scrollConversationToBottom(behavior);
          return;
        }

        if (String(message?.sender_id || "") !== currentUserId) {
          unseenIncomingCount += 1;
          showNewMessageIndicator();
        }
      };

      const pollConversation = async () => {
        if (isPolling || !refreshUrl || document.hidden) return;

        isPolling = true;

        try {
          const response = await fetch(refreshUrl, {
            headers: {
              Accept: "application/json",
              "X-Requested-With": "fetch",
            },
          });

          const data = await response.json().catch(() => null);

          if (!response.ok || !data?.success) {
            return;
          }

          const shouldStickToBottom = isNearBottom();
          const messages = Array.isArray(data?.conversation?.messages)
            ? data.conversation.messages
            : [];

          messages.forEach((message) => {
            appendMessage(message, {
              behavior: "smooth",
              forceScroll: shouldStickToBottom,
            });
          });
        } finally {
          isPolling = false;
        }
      };

      textarea.addEventListener("input", syncState);
      textarea.addEventListener("input", () => setFeedback(""));
      textarea.addEventListener("blur", syncState);

      if (messagesContainer instanceof HTMLElement) {
        messagesContainer.addEventListener("scroll", () => {
          if (isNearBottom()) {
            hideNewMessageIndicator();
          }
        });
      }

      if (newMessageIndicator instanceof HTMLButtonElement) {
        newMessageIndicator.addEventListener("click", () => {
          hideNewMessageIndicator();
          scrollConversationToBottom("smooth");
        });
      }

      form.addEventListener("submit", async (event) => {
        syncState();

        if (textarea.value.trim().length === 0) {
          event.preventDefault();
          textarea.reportValidity();
          textarea.focus();
          return;
        }

        event.preventDefault();

        isSubmitting = true;
        setFeedback("");
        syncState();

        const originalButtonLabel =
          submitButton instanceof HTMLButtonElement
            ? submitButton.textContent
            : "";

        if (submitButton instanceof HTMLButtonElement) {
          submitButton.textContent = "Envoi...";
        }

        try {
          const formData = new FormData(form);
          const body = new URLSearchParams();

          formData.forEach((value, key) => {
            if (typeof value === "string") {
              body.append(key, value);
            }
          });

          const response = await fetch(form.action, {
            method: form.method || "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
              "X-Requested-With": "fetch",
            },
            body: body.toString(),
          });

          const data = await response.json().catch(() => null);

          if (!response.ok || !data?.success) {
            throw new Error(data?.error || "Impossible d'envoyer le message.");
          }

          appendMessage(data.message, {
            behavior: "smooth",
            forceScroll: true,
          });
          form.reset();
          textarea.value = "";
          setFeedback("");
          textarea.focus();
        } catch (error) {
          setFeedback(error.message || "Impossible d'envoyer le message.");
        } finally {
          isSubmitting = false;

          if (submitButton instanceof HTMLButtonElement) {
            submitButton.textContent = originalButtonLabel || "Envoyer le message";
          }

          syncState();
        }
      });

      syncState();

      requestAnimationFrame(() => {
        hideNewMessageIndicator();
        scrollConversationToBottom("auto");
      });

      const pollInterval = window.setInterval(pollConversation, 5000);

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          pollConversation();
        }
      });

      window.addEventListener(
        "beforeunload",
        () => {
          window.clearInterval(pollInterval);
        },
        { once: true }
      );
    });
  };

  const initFilePickerButtons = () => {
    const triggers = Array.from(document.querySelectorAll("[data-file-trigger]"));

    triggers.forEach((trigger) => {
      if (!(trigger instanceof HTMLButtonElement)) return;

      const targetId = trigger.dataset.fileTrigger;
      if (!targetId) return;

      const fileInput = document.getElementById(targetId);
      if (!(fileInput instanceof HTMLInputElement) || fileInput.type !== "file") return;

      const status = document.querySelector(`[data-file-status="${targetId}"]`);

      trigger.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", () => {
        if (!(status instanceof HTMLElement)) return;

        const files = Array.from(fileInput.files || []);
        if (files.length === 0) {
          status.textContent = "";
          return;
        }

        status.textContent =
          files.length === 1
            ? files[0].name
            : `${files.length} fichiers selectionnes`;
      });
    });
  };

  const initImagePreview = () => {
    const triggers = Array.from(document.querySelectorAll("[data-image-preview]"));
    const modal = document.querySelector("[data-image-preview-modal]");
    const previewImage = document.querySelector("[data-image-preview-target]");
    const closeButtons = Array.from(
      document.querySelectorAll("[data-image-preview-close]")
    );

    if (!(modal instanceof HTMLElement) || !(previewImage instanceof HTMLImageElement)) {
      return;
    }

    const openModal = ({ src, alt }) => {
      previewImage.src = src;
      previewImage.alt = alt || "Image";
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
      previewImage.src = "";
      previewImage.alt = "";
    };

    triggers.forEach((trigger) => {
      if (!(trigger instanceof HTMLElement)) return;

      trigger.addEventListener("click", (event) => {
        event.preventDefault();

        const src =
          trigger.dataset.imageSrc ||
          trigger.querySelector("img")?.getAttribute("src") ||
          "";
        const alt =
          trigger.dataset.imageAlt ||
          trigger.querySelector("img")?.getAttribute("alt") ||
          "Image";

        if (!src) return;
        openModal({ src, alt });
      });
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    });
  };

  const initCompactHeaderOnScroll = () => {
    const header = document.querySelector(".service-shell-header");
    if (!(header instanceof HTMLElement)) return;

    const compactThreshold = 72;
    const expandThreshold = 16;
    let isCompact = false;

    const syncHeaderState = () => {
      const scrollY = window.scrollY;

      if (!isCompact && scrollY > compactThreshold) {
        isCompact = true;
      } else if (isCompact && scrollY < expandThreshold) {
        isCompact = false;
      }

      header.classList.toggle("service-shell-header--compact", isCompact);
    };

    window.addEventListener("scroll", syncHeaderState, { passive: true });
    syncHeaderState();
  };

  const initAdminModerationForms = () => {
    const forms = Array.from(
      document.querySelectorAll("[data-admin-moderation-form]")
    );

    if (forms.length === 0) return;

    const actionConfig = {
      user: {
        warn: {
          submitLabel: "Envoyer l'avertissement",
          confirmMessage: "Voulez-vous vraiment envoyer cet avertissement ?",
          summary: "Vous allez envoyer un avertissement a ce compte.",
          reasonPlaceholder: "Motif de l'avertissement admin",
          showWarningLevel: true,
        },
        suspend: {
          submitLabel: "Suspendre le compte",
          confirmMessage: "Voulez-vous vraiment suspendre ce compte ?",
          summary: "Vous allez suspendre ce compte.",
          reasonPlaceholder: "Motif de la suspension admin",
        },
        unsuspend: {
          submitLabel: "Lever la suspension",
          confirmMessage: "Voulez-vous vraiment lever la suspension de ce compte ?",
          summary: "Vous allez lever la suspension de ce compte.",
          reasonPlaceholder: "Commentaire interne facultatif",
        },
        ban: {
          submitLabel: "Bannir le compte",
          confirmMessage: "Voulez-vous vraiment bannir ce compte ?",
          summary: "Vous allez bannir ce compte et couper ses usages.",
          reasonPlaceholder: "Motif du bannissement admin",
        },
        unban: {
          submitLabel: "Lever le bannissement",
          confirmMessage: "Voulez-vous vraiment lever le bannissement de ce compte ?",
          summary: "Vous allez lever le bannissement de ce compte.",
          reasonPlaceholder: "Commentaire interne facultatif",
        },
        disable_messages: {
          submitLabel: "Couper la messagerie",
          confirmMessage: "Voulez-vous vraiment couper la messagerie de ce compte ?",
          summary: "Vous allez couper la messagerie de ce compte.",
          reasonPlaceholder: "Motif de la coupure de messagerie",
        },
        enable_messages: {
          submitLabel: "Retablir la messagerie",
          confirmMessage: "Voulez-vous vraiment retablir la messagerie de ce compte ?",
          summary: "Vous allez retablir la messagerie de ce compte.",
          reasonPlaceholder: "Commentaire interne facultatif",
        },
        disable_publishing: {
          submitLabel: "Couper la publication",
          confirmMessage: "Voulez-vous vraiment couper la publication de services pour ce compte ?",
          summary: "Vous allez couper la publication de services pour ce compte.",
          reasonPlaceholder: "Motif de la coupure de publication",
        },
        enable_publishing: {
          submitLabel: "Retablir la publication",
          confirmMessage: "Voulez-vous vraiment retablir la publication de services pour ce compte ?",
          summary: "Vous allez retablir la publication de services pour ce compte.",
          reasonPlaceholder: "Commentaire interne facultatif",
        },
        delete: {
          submitLabel: "Supprimer le compte cote admin",
          confirmMessage: "Voulez-vous vraiment supprimer ce compte cote admin ?",
          summary: "Vous allez supprimer ce compte cote admin.",
          reasonPlaceholder: "Motif de la suppression admin",
        },
      },
      review: {
        visible: {
          submitLabel: "Rendre l'avis visible",
          confirmMessage: "Voulez-vous vraiment rendre cet avis visible ?",
          summary: "Vous allez rendre cet avis visible.",
          reasonPlaceholder: "Commentaire interne facultatif",
        },
        hidden: {
          submitLabel: "Masquer l'avis",
          confirmMessage: "Voulez-vous vraiment masquer cet avis publiquement ?",
          summary: "Vous allez masquer publiquement cet avis.",
          reasonPlaceholder: "Motif du masquage public",
        },
        deleted: {
          submitLabel: "Supprimer l'avis cote admin",
          confirmMessage: "Voulez-vous vraiment supprimer cet avis cote admin ?",
          summary: "Vous allez supprimer cet avis cote admin.",
          reasonPlaceholder: "Motif de la suppression admin",
        },
      },
      service: {
        active: {
          submitLabel: "Rendre le service actif",
          confirmMessage: "Voulez-vous vraiment rendre ce service actif ?",
          summary: "Vous allez rendre ce service actif.",
          reasonPlaceholder: "Commentaire interne facultatif",
        },
        suspended: {
          submitLabel: "Suspendre le service",
          confirmMessage: "Voulez-vous vraiment suspendre ce service ?",
          summary: "Vous allez suspendre ce service.",
          reasonPlaceholder: "Motif de la suspension du service",
        },
        deleted: {
          submitLabel: "Supprimer le service cote admin",
          confirmMessage: "Voulez-vous vraiment supprimer ce service cote admin ?",
          summary: "Vous allez supprimer ce service cote admin.",
          reasonPlaceholder: "Motif de la suppression du service",
        },
      },
    };

    const getActionMeta = (kind, action) =>
      actionConfig[kind]?.[action] || {
        submitLabel: "Appliquer l'action",
        confirmMessage: "Voulez-vous vraiment appliquer cette action ?",
      };

    forms.forEach((form) => {
      if (!(form instanceof HTMLFormElement)) return;

      const kind = String(form.dataset.adminModerationForm || "").trim();
      const actionSelect = form.querySelector("[data-admin-action-select]");
      const submitButton = form.querySelector("[data-admin-submit-button]");
      const actionSummary = form.querySelector("[data-admin-action-summary]");
      const reasonInput = form.querySelector("[data-admin-reason-input]");
      const warningField = form.querySelector("[data-admin-warning-field]");
      const warningSelect = warningField?.querySelector("select");

      if (!(actionSelect instanceof HTMLSelectElement)) return;
      if (!(submitButton instanceof HTMLButtonElement)) return;

      const syncActionUi = () => {
        const meta = getActionMeta(kind, actionSelect.value);
        submitButton.textContent = meta.submitLabel;

        if (actionSummary instanceof HTMLElement) {
          actionSummary.textContent =
            meta.summary || "Vous allez appliquer cette action admin.";
        }

        if (reasonInput instanceof HTMLTextAreaElement) {
          reasonInput.placeholder =
            meta.reasonPlaceholder || "Motif de moderation";
        }

        if (warningField instanceof HTMLElement) {
          const shouldShowWarningLevel = Boolean(meta.showWarningLevel);
          warningField.classList.toggle("hidden", !shouldShowWarningLevel);

          if (warningSelect instanceof HTMLSelectElement) {
            warningSelect.disabled = !shouldShowWarningLevel;
          }
        }
      };

      actionSelect.addEventListener("change", syncActionUi);

      form.addEventListener("submit", (event) => {
        const meta = getActionMeta(kind, actionSelect.value);
        if (!window.confirm(meta.confirmMessage)) {
          event.preventDefault();
        }
      });

      syncActionUi();
    });
  };

  initOldInputHydration();
  initNavigationControls();
  initConversationMessageGuards();
  initPasswordVisibilityToggles();
  initBookingPaymentForm();
  initBookingDateTimeGuards();
  initClickableCards();
  initFilePickerButtons();
  initImagePreview();
  initCompactHeaderOnScroll();
  initAdminModerationForms();

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const message = form.getAttribute("data-confirm");
    if (!message) return;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest("a[data-confirm]");
    if (!link) return;

    const message = link.getAttribute("data-confirm");
    if (!message) return;

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });
});
