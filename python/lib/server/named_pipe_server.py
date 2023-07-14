import win32pipe
import win32file
import pywintypes
from .server import Server

class NamedPipeServer(Server):
    def __init__(self, address):
        super().__init__(address)
        self.pipe_handle = win32pipe.CreateNamedPipe(
            self.address,
            win32pipe.PIPE_ACCESS_DUPLEX,
            win32pipe.PIPE_TYPE_MESSAGE | win32pipe.PIPE_WAIT,
            1, 65536, 65536,
            0,
            None)

    def listen(self):
        win32pipe.ConnectNamedPipe(self.pipe_handle, None)

    def readlines(self):
        data = ""
        while True:
            _, chunk = win32file.ReadFile(self.pipe_handle, 1)
            chunk = chunk.decode()
            if chunk == "":
                break
            data += chunk
        return data.strip()

    def close(self):
        win32file.CloseHandle(self.pipe_handle)
