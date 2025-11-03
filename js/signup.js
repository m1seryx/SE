document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const terms = document.getElementById("terms").checked;

  if (!terms) {
    alert("You must agree to the terms and conditions.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  // Simulate registration success
  alert(`Welcome, ${firstName}! Your registration is successful.`);
  document.getElementById("signupForm").reset();

  // Redirect to login page
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
});
