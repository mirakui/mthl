import * as crypto from 'crypto'
import * as readlineSync from 'readline-sync';
import fs from 'fs';

export interface SecretFileType {
  secret: string;
  username: string;
  password: string;
}

export class SecretFile {
  algorithm = "aes-256-cbc";
  iv = Buffer.alloc(16, 0);
  salt = "mthl";
  keyLength = 32;
  encryptEncoding: crypto.Encoding = "hex";
  rawEncoding: crypto.Encoding = "utf8";

  path;

  _secretToken?: string;

  constructor(path: string) {
    this.path = path;
  }

  askAndRenewFile() {
    const username = readlineSync.question('HighLow username: ');

    const password = readlineSync.question('HighLow password: ', {
      hideEchoBack: true,
    });

    const data: SecretFileType = {
      secret: this.secretToken,
      username: username,
      password: this.encrypt(password),
    };

    this.saveFile(data);
  }

  readDecrypted(): SecretFileType {
    const data = this.readFile();
    data.password = this.decrypt(data.password);
    return data;
  }
  encrypt(input: string): string {
    const key = crypto.scryptSync(this.secretToken, this.salt, this.keyLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, this.iv);
    let cipheredData = cipher.update(input, this.rawEncoding, this.encryptEncoding);
    cipheredData += cipher.final(this.encryptEncoding);
    return cipheredData;
  }

  decrypt(input: string): string {
    const key = crypto.scryptSync(this.secretToken, this.salt, this.keyLength);
    const decipher = crypto.createDecipheriv(this.algorithm, key, this.iv);
    let decipheredData = decipher.update(input, this.encryptEncoding, this.rawEncoding);
    decipheredData += decipher.final(this.rawEncoding);
    return decipheredData;
  }

  get secretToken(): string {
    if (this.fileExists()) {
      this._secretToken = this.readFile().secret;
    }
    else if (this._secretToken === undefined) {
      this._secretToken = crypto.randomBytes(32).toString('hex');
    }
    return this._secretToken;
  }

  get key() {
    return
  }

  fileExists(): boolean {
    return fs.existsSync(this.path);
  }

  readFile(): SecretFileType {
    return JSON.parse(fs.readFileSync(this.path, 'utf8')) as SecretFileType;
  }

  saveFile(data: SecretFileType): void {
    fs.writeFileSync(this.path, JSON.stringify(data));
  }
}
