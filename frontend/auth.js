let API_URL = '/api';
// Fallback for developers using VSCode Live Server (5500) or opening static HTML files directly
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
    if (window.location.port !== '5000') {
        API_URL = 'http://localhost:5000/api';
    }
}

function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
  }
  return token;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function applyRoleBasedUI() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    
    const nameLabel = document.getElementById('userNameLabel');
    if (nameLabel) nameLabel.innerText = user.username;
    
    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge) {
      roleBadge.innerText = user.role;
      if (user.role === 'Admin') {
        roleBadge.classList.add('role-admin');
      } else {
        roleBadge.classList.add('role-user');
      }
    }

    if (user.role !== 'Admin') {
      const adminElements = document.querySelectorAll('.admin-only');
      adminElements.forEach(el => el.style.display = 'none');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
       checkAuth();
       applyRoleBasedUI();
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', e => {
            e.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
        });
    }
});
