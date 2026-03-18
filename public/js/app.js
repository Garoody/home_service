document.addEventListener("DOMContentLoaded", () => {
  const initBookingPaymentForm = () => {
    const container = document.querySelector("[data-booking-payment-form]");
    if (!(container instanceof HTMLElement)) return;

    const radios = Array.from(
      container.querySelectorAll('input[name="payment_method"]')
    );
    const panels = Array.from(
      container.querySelectorAll("[data-payment-panel]")
    );
    const submitButton = document.getElementById("booking-submit-button");
    const cardNumberInput = document.getElementById("card_number");
    const expiryInput = document.getElementById("expiry");

    const buttonLabels = {
      cb: "Reserver et payer par carte",
      paypal: "Reserver avec PayPal",
      bank_transfer: "Reserver par virement bancaire",
      cash: "Reserver avec paiement en especes",
    };

    const syncPaymentSelection = (forcedMethod) => {
      const selectedMethod =
        forcedMethod ||
        container.querySelector('input[name="payment_method"]:checked')?.value ||
        "cb";

      panels.forEach((panel) => {
        if (!(panel instanceof HTMLElement)) return;
        panel.style.display =
          panel.dataset.paymentPanel === selectedMethod ? "block" : "none";
      });

      radios.forEach((radio) => {
        const label = radio.closest(".payment-choice");
        if (!(label instanceof HTMLElement)) return;

        const isSelected = radio.checked;
        label.classList.toggle("border-blue-500/60", isSelected);
        label.classList.toggle("bg-blue-500/10", isSelected);
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

    syncPaymentSelection();
  };

  initBookingPaymentForm();

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
