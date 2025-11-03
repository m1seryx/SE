document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addProductModal");
  const adjustModal = document.getElementById("adjustStockModal");
  const deleteModal = document.getElementById("deleteModal");

  const openAdd = document.getElementById("openAddModal");
  const closeBtns = document.querySelectorAll(".close");

  const discardAdd = document.getElementById("discardAdd");
  const saveAdd = document.getElementById("saveAdd");

  const discardAdjust = document.getElementById("discardAdjust");
  const saveAdjust = document.getElementById("saveAdjust");

  const cancelDelete = document.getElementById("cancelDelete");
  const confirmDelete = document.getElementById("confirmDelete");

  // Open Add Modal
  openAdd.onclick = () => addModal.style.display = "flex";

  // Close all modals on (x)
  closeBtns.forEach(btn => btn.onclick = () => {
    addModal.style.display = "none";
    adjustModal.style.display = "none";
    deleteModal.style.display = "none";
  });

  // Close by clicking outside
  window.onclick = e => {
    if (e.target === addModal) addModal.style.display = "none";
    if (e.target === adjustModal) adjustModal.style.display = "none";
    if (e.target === deleteModal) deleteModal.style.display = "none";
  };

  // Adjust Stock Buttons
  document.querySelectorAll(".adjustBtn").forEach(btn => {
    btn.onclick = () => adjustModal.style.display = "flex";
  });

  // Delete Item Buttons
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.onclick = () => deleteModal.style.display = "flex";
  });

  // Close modals with cancel buttons
  [discardAdd, discardAdjust, cancelDelete].forEach(btn => {
    btn.onclick = () => {
      addModal.style.display = "none";
      adjustModal.style.display = "none";
      deleteModal.style.display = "none";
    };
  });

  // Example save actions
  saveAdd.onclick = () => {
    alert("Product added successfully!");
    addModal.style.display = "none";
  };
  saveAdjust.onclick = () => {
    alert("Stock adjusted successfully!");
    adjustModal.style.display = "none";
  };
  confirmDelete.onclick = () => {
    alert("Item deleted successfully!");
    deleteModal.style.display = "none";
  };
});
