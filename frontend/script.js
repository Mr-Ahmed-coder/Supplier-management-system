function escapeHTML(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Encapsulate variables to prevent global strict-mode SyntaxError collisions across different pages
document.addEventListener("DOMContentLoaded", () => {
    const globalSearchInput = document.getElementById("searchInput");
    const rows = document.querySelectorAll("#invoiceTable tr");

    if (globalSearchInput) {
        globalSearchInput.addEventListener("keyup", function () {
            const value = this.value.toLowerCase();

            rows.forEach(row => {
                row.style.display =
                    row.innerText.toLowerCase().includes(value) ? "" : "none";
            });
        });
    }
});