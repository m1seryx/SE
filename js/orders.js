document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("fabricModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelEdit");

  if (!modal || !openBtn || !closeBtn || !cancelBtn) return;

  // Open modal
  openBtn.onclick = () => {
    modal.style.display = "flex";
  };

  // Close modal (X or cancel)
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };

  // Close when clicking outside modal box
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
});
