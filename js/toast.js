/**
 * @param {string} message
 */
export function showToast(message) {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    el.hidden = true;
  }, 2800);
}
