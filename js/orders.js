document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("fabricModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelEdit");

  if (!modal || !openBtn || !closeBtn || !cancelBtn) return;

  
  openBtn.onclick = () => {
    modal.style.display = "flex";
  };

  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
});
