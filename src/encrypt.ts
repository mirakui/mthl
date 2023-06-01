import * as crypto from 'crypto'
import * as readlineSync from 'readline-sync';

const password = readlineSync.question('Enter a password: ', {
  hideEchoBack: true,
});

const algorithm = 'aes-256-cbc';
const salt = '12345678';
const iv = crypto.randomBytes(16);
const key = crypto.scryptSync(password, salt, 32);
const cipher = crypto.createCipheriv(algorithm, key, iv);

const secretValue = readlineSync.question('Secret value: ', {
  hideEchoBack: true,
});

let cipheredData = cipher.update(secretValue, 'utf8', 'hex')
cipheredData += cipher.final('hex')
console.log('Encrypted: ', cipheredData)
