const bcrypt = require('bcrypt');

const password = 'Alice123@'; // your plain password
const saltRounds = 10; // the number of salt rounds

// Hashing the password
bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
  if (err) {
    console.log('Error hashing password:', err);
  } else {
    console.log('Hashed Password:', hashedPassword);
  }
});
