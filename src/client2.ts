const pipeName = "\\\\.\\pipe\\myNamedPipe";
const conn = await Deno.connect({ path: pipeName, transport: "unix" });

try {
  const message = "Hello, server!";
  const encodedMessage = new TextEncoder().encode(message);
  await conn.write(encodedMessage);
  console.log("Sent message:", message);
} catch (err) {
  console.error("Connection error:", err);
} finally {
  conn.close();
}
