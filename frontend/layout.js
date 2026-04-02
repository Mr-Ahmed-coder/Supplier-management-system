const passwordModalHTML = `
<div class="modal fade" id="passwordModal" tabindex="-1" aria-labelledby="passwordModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow">
      <div class="modal-header border-bottom-0 pb-0">
        <h5 class="modal-title fw-bold" id="passwordModalLabel"><i class="bi bi-shield-lock text-primary me-2"></i>Change Password</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body pb-4">
        <form id="changePasswordForm">
          <div class="mb-3">
            <label class="form-label text-muted fw-semibold small">Current Password</label>
            <div class="input-group">
                <input type="password" class="form-control" id="currentPassword" required>
                <button class="btn btn-outline-secondary toggle-pass" type="button"><i class="bi bi-eye"></i></button>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label text-muted fw-semibold small">New Password</label>
            <div class="input-group">
                <input type="password" class="form-control" id="newPassword" minlength="6" required>
                <button class="btn btn-outline-secondary toggle-pass" type="button"><i class="bi bi-eye"></i></button>
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label text-muted fw-semibold small">Confirm New Password</label>
            <div class="input-group">
                <input type="password" class="form-control" id="confirmPassword" minlength="6" required>
                <button class="btn btn-outline-secondary toggle-pass" type="button"><i class="bi bi-eye"></i></button>
            </div>
          </div>
          <div id="passwordAlert" class="alert d-none py-2 small fw-semibold"></div>
          <button type="submit" class="btn btn-primary w-100 fw-bold">Update Password</button>
        </form>
      </div>
    </div>
  </div>
</div>
`;

const sidebarHTML = `
  <div class="sidebar-heading">
    <i class="bi bi-box-seam me-2"></i> SysAdmin
  </div>
  <div class="list-group list-group-flush mt-3">
    <a href="dashboard.html" class="list-group-item admin-only" id="nav-dashboard"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a>
    <a href="suppliers.html" class="list-group-item admin-only" id="nav-suppliers"><i class="bi bi-truck me-2"></i> Suppliers</a>
    <a href="customers.html" class="list-group-item" id="nav-customers"><i class="bi bi-people me-2"></i> Customers</a>
    <a href="inventory.html" class="list-group-item" id="nav-inventory"><i class="bi bi-boxes me-2"></i> Inventory</a>
    <a href="invoice.html" class="list-group-item" id="nav-invoice"><i class="bi bi-receipt me-2"></i> Invoices</a>
    <a href="reports.html" class="list-group-item admin-only" id="nav-reports"><i class="bi bi-graph-up me-2"></i> Reports</a>
    <a href="users.html" class="list-group-item admin-only" id="nav-users"><i class="bi bi-person-badge me-2"></i> User Management</a>
  </div>
`;

// Apply theme immediately to prevent white flashing (script is at bottom of body)
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
}

document.addEventListener("DOMContentLoaded", () => {
    const sidebarWrapper = document.getElementById("sidebar-wrapper");
    if (sidebarWrapper) {
        sidebarWrapper.innerHTML = sidebarHTML;
        // Set active link based on current path
        const path = window.location.pathname;
        let page = path.split("/").pop();
        if (page === "" || page === "/") page = "dashboard.html"; // default

        // Remove all .active classes
        const links = sidebarWrapper.querySelectorAll(".list-group-item");
        links.forEach(l => l.classList.remove("active"));

        // Attempt to match IDs like nav-dashboard if page is dashboard.html
        const navId = 'nav-' + page.replace('.html', '');
        const activeLink = document.getElementById(navId);
        if (activeLink) {
            activeLink.classList.add("active");
        }
    }

    // Inject Change Password Modal dynamically into body
    if (!document.getElementById('passwordModal')) {
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = passwordModalHTML;
        document.body.appendChild(modalDiv.firstElementChild);

        // Bind form submit logic
        document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const alertBox = document.getElementById('passwordAlert');
            
            if (newPassword !== confirmPassword) {
                alertBox.className = 'alert alert-danger py-2 small fw-semibold';
                alertBox.innerText = "New passwords do not match.";
                return;
            }
            if (newPassword.length < 6) {
                alertBox.className = 'alert alert-danger py-2 small fw-semibold';
                alertBox.innerText = "Password must be at least 6 characters.";
                return;
            }

            try {
                let API_URL_BASE = '/api';
                if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
                    if (window.location.port !== '5000') {
                        API_URL_BASE = 'http://localhost:5000/api';
                    }
                }

                const res = await fetch(`${API_URL_BASE}/users/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                    },
                    body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
                });

                const data = await res.json();

                if (!res.ok) {
                    alertBox.className = 'alert alert-danger py-2 small fw-semibold';
                    alertBox.innerText = data.message || "Failed to update password.";
                } else {
                    alertBox.className = 'alert alert-success py-2 small fw-semibold';
                    alertBox.innerText = "Success! Please log in again.";
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = "login.html";
                    }, 1500);
                }
            } catch (err) {
                alertBox.className = 'alert alert-danger py-2 small fw-semibold';
                alertBox.innerText = "System error, try again.";
            }
        });

        // Toggle password visibility
        document.querySelectorAll('.toggle-pass').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.previousElementSibling;
                const icon = this.querySelector('i');
                if (input.type === "password") {
                    input.type = "text";
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                } else {
                    input.type = "password";
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                }
            });
        });
    }

    // Inject Theme Toggle Button dynamically
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        const themeBtn = document.createElement('button');
        themeBtn.id = 'themeToggleBtn';
        themeBtn.className = 'btn btn-outline-secondary btn-sm ms-3 d-flex align-items-center justify-content-center';
        themeBtn.style.width = '32px';
        themeBtn.style.height = '32px';
        themeBtn.style.padding = '0';
        themeBtn.style.borderRadius = '8px';

        const setBtnIcon = (isDark) => {
            themeBtn.innerHTML = isDark ? '<i class="bi bi-moon-fill"></i>' : '<i class="bi bi-brightness-high-fill" style="color:#eab308;"></i>';
            themeBtn.className = isDark ? 'btn btn-outline-light btn-sm ms-3' : 'btn btn-outline-secondary btn-sm ms-3';
            themeBtn.style.width = '32px'; themeBtn.style.height = '32px'; themeBtn.style.padding = '0'; themeBtn.style.borderRadius = '8px';
        };

        const currentDark = document.body.classList.contains('dark');
        setBtnIcon(currentDark);

        themeBtn.addEventListener('click', () => {
            const isDarkNow = document.body.classList.toggle('dark');
            localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
            setBtnIcon(isDarkNow);
        });

        const passBtn = document.createElement('button');
        passBtn.id = 'changePassBtn';
        passBtn.className = 'btn btn-outline-primary btn-sm ms-3 d-flex align-items-center justify-content-center';
        passBtn.innerHTML = '<i class="bi bi-key-fill"></i>';
        passBtn.title = "Change Password";
        passBtn.setAttribute('data-bs-toggle', 'modal');
        passBtn.setAttribute('data-bs-target', '#passwordModal');

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            userInfo.insertBefore(passBtn, logoutBtn);
            userInfo.insertBefore(themeBtn, passBtn);
        } else {
            userInfo.appendChild(themeBtn);
            userInfo.appendChild(passBtn);
        }
    }
});
