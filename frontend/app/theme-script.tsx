export function ThemeScript() {
  const themeScript = `
    (function() {
      function getInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          return savedTheme;
        }
        // Default to light mode instead of checking system preference
        return 'light';
      }
      
      const theme = getInitialTheme();
      document.documentElement.classList.add(theme);
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
    />
  );
}