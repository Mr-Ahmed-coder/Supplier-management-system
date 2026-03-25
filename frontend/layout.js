const sidebarHTML = `
  <div class="sidebar-heading">
    <i class="bi bi-box-seam me-2"></i> SysAdmin
  </div>
  <div class="list-group list-group-flush mt-3">
    <a href="dashboard.html" class="list-group-item" id="nav-dashboard"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a>
    <a href="suppliers.html" class="list-group-item" id="nav-suppliers"><i class="bi bi-truck me-2"></i> Suppliers</a>
    <a href="customers.html" class="list-group-item" id="nav-customers"><i class="bi bi-people me-2"></i> Customers</a>
    <a href="inventory.html" class="list-group-item" id="nav-inventory"><i class="bi bi-boxes me-2"></i> Inventory</a>
    <a href="invoice.html" class="list-group-item" id="nav-invoice"><i class="bi bi-receipt me-2"></i> Invoices</a>
    <a href="reports.html" class="list-group-item" id="nav-reports"><i class="bi bi-graph-up me-2"></i> Reports</a>
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

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            userInfo.insertBefore(themeBtn, logoutBtn);
        } else {
            userInfo.appendChild(themeBtn);
        }
    }
});
