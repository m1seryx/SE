document.addEventListener("DOMContentLoaded", () => {


  const cancelDelete = document.getElementById("cancelDelete");
  const confirmDelete = document.getElementById("confirmDelete");

  
  openAdd.onclick = () => addModal.style.display = "flex";

  
  closeBtns.forEach(btn => btn.onclick = () => {

    deleteModal.style.display = "none";
  });


  window.onclick = e => {
    if (e.target === deleteModal) deleteModal.style.display = "none";
  };

  document.querySelectorAll(".viewBtn").forEach(btn => {
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
