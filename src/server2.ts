import { connResetException } from "https://deno.land/std@0.177.0/node/internal/errors.ts";
import * as namedpipe from "https://deno.land/x/namedpipe@0.1.2/mod.ts"
const pipeName = "\\\\.\\pipe\\myNamedPipe";

console.log("Connecting ", pipeName);
let conn = await namedpipe.connect(pipeName);
console.log("Connected");

try {
  conn.read(new Uint8Array(1024)).then((data) => {
    console.log("Received: ", data);
  });
} catch (err) {
  console.error("Error: ", err);
} finally {
  console.error("Closing");
  conn.close();
}
