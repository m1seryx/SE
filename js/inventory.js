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

  
  openAdd.onclick = () => addModal.style.display = "flex";

  
  closeBtns.forEach(btn => btn.onclick = () => {
    addModal.style.display = "none";
    adjustModal.style.display = "none";
    deleteModal.style.display = "none";
  });


  window.onclick = e => {
    if (e.target === addModal) addModal.style.display = "none";
    if (e.target === adjustModal) adjustModal.style.display = "none";
    if (e.target === deleteModal) deleteModal.style.display = "none";
  };

  document.querySelectorAll(".adjustBtn").forEach(btn => {
    btn.onclick = () => adjustModal.style.display = "flex";
  });

 
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.onclick = () => deleteModal.style.display = "flex";
  });

  [discardAdd, discardAdjust, cancelDelete].forEach(btn => {
    btn.onclick = () => {
      addModal.style.display = "none";
      adjustModal.style.display = "none";
      deleteModal.style.display = "none";
    };
  });

 
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
