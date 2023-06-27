import { SecretFile } from "./lib/secret_file";

const path = "config/.secret.json";
const secretFile = new SecretFile(path);

secretFile.askAndRenewFile();
console.log(`updated ${path}`);

const secretFile2 = new SecretFile(path);
const data = secretFile2.readDecrypted();
console.log(data);
