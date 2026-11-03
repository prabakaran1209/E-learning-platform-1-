/**
 * Dynamic Navbar & User Session State Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

function renderNavbar() {
  const authContainer = document.getElementById('navbar-auth-section');
  if (!authContainer) return;

  const user = Auth.getUser();
  const currentPath = window.location.pathname;

  // Highlight active nav links
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (href === 'index.html' && (currentPath === '/' || currentPath.endsWith('index.html'))))) {
      link.classList.add('active');
    }
  });

  if (user) {
    const isAdm = user.role === 'admin';
    const dashUrl = isAdm ? 'admin-dashboard.html' : 'student-dashboard.html';
    const dashLabel = isAdm ? 'Admin Portal' : 'My Learning';

    authContainer.innerHTML = `
      <a href="${dashUrl}" class="btn btn-outline btn-sm">
        <span>📊</span> ${dashLabel}
      </a>
      <div class="user-badge">
        <div class="user-avatar-circle">${user.name.charAt(0).toUpperCase()}</div>
        <span>${user.name.split(' ')[0]}</span>
      </div>
      <button onclick="Auth.logout()" class="btn btn-secondary btn-sm" title="Log out">
        <span>🚪</span> Logout
      </button>
    `;
  } else {
    authContainer.innerHTML = `
      <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
      <a href="register.html" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }
}

