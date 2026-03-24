function escapeHTML(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const searchInput = document.getElementById("searchInput");
const rows = document.querySelectorAll("#invoiceTable tr");

searchInput.addEventListener("keyup", function () {
  const value = this.value.toLowerCase();

  rows.forEach(row => {
    row.style.display =
      row.innerText.toLowerCase().includes(value) ? "" : "none";
  });
});