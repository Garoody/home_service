document.addEventListener("DOMContentLoaded", () => {
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
