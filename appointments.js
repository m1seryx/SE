const declineButtons = document.querySelectorAll(".decline-btn");
const modal = document.getElementById("declineModal");
const confirmBtn = document.getElementById("confirmDecline");
const cancelBtn = document.getElementById("cancelDecline");

let currentCard = null;

declineButtons.forEach(button => {
  button.addEventListener("click", (e) => {
    modal.style.display = "flex";
    currentCard = e.target.closest(".appointment-card");
  });
});

cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
  currentCard = null;
});

confirmBtn.addEventListener("click", () => {
  if (currentCard) {
    currentCard.querySelector(".decline-btn").textContent = "Declined";
    currentCard.querySelector(".decline-btn").style.backgroundColor = "#bdc3c7";
    currentCard.querySelector(".decline-btn").disabled = true;
    currentCard.querySelector(".accept-btn").disabled = true;
  }
  modal.style.display = "none";
});
