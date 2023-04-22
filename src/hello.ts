import * as namedpipe from "https://deno.land/x/namedpipe@0.1.2/mod.ts"

console.log("hello, deno!");
let pipe = await namedpipe.connect("\\\\.\\pipe\\mthl");

pipe.
