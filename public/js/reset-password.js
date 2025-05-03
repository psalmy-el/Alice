document.addEventListener('DOMContentLoaded', function() {
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm_password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
  const passwordStrength = document.getElementById('passwordStrength');
  const passwordMatch = document.getElementById('passwordMatch');
  const submitBtn = document.getElementById('submitBtn');
  
  // Toggle password visibility for main password field
  togglePasswordBtn.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  });
  
  // Toggle password visibility for confirm password field
  toggleConfirmPasswordBtn.addEventListener('click', function() {
    const type = confirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  });
  
  // Check password strength
  passwordInput.addEventListener('input', function() {
    const value = this.value;
    let strength = 0;
    
    if (value.length >= 8) strength += 25;
    if (value.match(/[a-z]/)) strength += 25;
    if (value.match(/[A-Z]/)) strength += 25;
    if (value.match(/[0-9]/)) strength += 25;
    
    passwordStrength.style.width = strength + '%';
    
    if (strength < 50) {
      passwordStrength.className = 'password-strength bg-danger';
    } else if (strength < 75) {
      passwordStrength.className = 'password-strength bg-warning';
    } else {
      passwordStrength.className = 'password-strength bg-success';
    }
    
    checkPasswordMatch();
  });
  
  // Check password match
  confirmInput.addEventListener('input', checkPasswordMatch);
  
  function checkPasswordMatch() {
    if (confirmInput.value === '') {
      passwordMatch.textContent = '';
      passwordMatch.className = 'form-text';
      return;
    }
    
    if (passwordInput.value === confirmInput.value) {
      passwordMatch.textContent = 'Passwords match!';
      passwordMatch.className = 'form-text text-primary';
      submitBtn.disabled = false;
    } else {
      passwordMatch.textContent = 'Passwords do not match!';
      passwordMatch.className = 'form-text text-danger';
      submitBtn.disabled = true;
    }
  }
});