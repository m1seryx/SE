// Optional subtle entrance animation
document.addEventListener("DOMContentLoaded", () => {
  const loginBox = document.querySelector(".login-box");
  loginBox.style.opacity = 0;

  setTimeout(() => {
    loginBox.style.transition = "opacity 1.2s ease";
    loginBox.style.opacity = 1;
  }, 300);
});
