import os
import socket
from .server import Server

class SocketServer(Server):
    def __init__(self, address):
        super().__init__(address)
        if os.path.exists(self.address):
            os.remove(self.address)
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.bind(self.address)

    def listen(self):
        self.sock.listen(1)

    def readlines(self):
        conn, _ = self.sock.accept()
        data = ""
        try:
            while True:
                chunk = conn.recv(1).decode()
                if chunk == "":
                    break
                data += chunk
        finally:
            conn.close()

        return data.strip()

    def close(self):
        self.sock.close()
