const modal = document.getElementById('itemModal');
const buttons = document.querySelectorAll('.open-modal-info');
const closeBtn = document.querySelector('.close');

buttons.forEach(button => {
  button.addEventListener('click', () => {
    modal.style.display = 'block';
  });
});


closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});