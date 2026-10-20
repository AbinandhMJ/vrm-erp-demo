/** Prints the current page in light mode (dark text on dark backgrounds would be unreadable on paper). */
export const printLight = () => {
  const html = document.documentElement;
  const wasDark = html.classList.contains('dark');
  html.classList.remove('dark');
  window.print();
  if (wasDark) html.classList.add('dark');
};
