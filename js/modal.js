const modal = document.getElementById('itemModal');
const buttons = document.querySelectorAll('.open-modal-info');
const closeBtn = document.querySelector('.close');

// Open modal when any "View Info" button is clicked
buttons.forEach(button => {
  button.addEventListener('click', () => {
    modal.style.display = 'block';
  });
});

// Close modal when X button is clicked
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal when clicking outside it
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});