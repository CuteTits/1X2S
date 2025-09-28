import bcrypt from 'bcrypt';

const password = "1234"; // your plain password
const saltRounds = 10;

const hashed = await bcrypt.hash(password, saltRounds);
console.log(hashed);
