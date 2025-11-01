// MODAL CONTROL
const modal = document.getElementById("editModal");
const closeBtn = document.querySelector(".close");
const cancelBtn = document.getElementById("cancelEdit");
const editButtons = document.querySelectorAll(".edit-btn");

editButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    modal.style.display = "flex";
  });
});

closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// SAVE BUTTON (STATIC FOR NOW)
document.getElementById("saveChanges").addEventListener("click", () => {
  alert("Changes saved (placeholder, connect to PHP later).");
  modal.style.display = "none";
});
