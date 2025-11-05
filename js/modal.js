const modal = document.getElementById('itemModal');
const buttons = document.querySelectorAll('.open-modal-info');
const closeBtn = document.querySelector('.close');

buttons.forEach(button => {
  button.addEventListener('click', () => {
    modal.style.display = 'block';
  });
});

<<<<<<< HEAD

=======
>>>>>>> 947502e4b43822bd0ac43013006e951c0af156bd
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});