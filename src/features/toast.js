let toastTimer;
export function toast(message) {
  const element = document.querySelector('.toast');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.hidden = true;
  }, 4500);
}
