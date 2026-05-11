const bcrypt = require("bcrypt");

async function generateHash() {
  const password = "admin123"; // change this if you want another password
  const hash = await bcrypt.hash(password, 10);

  console.log("Plain password:", password);
  console.log("Bcrypt hash:", hash);
}

generateHash();