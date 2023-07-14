import win32pipe
import win32file
import pywintypes
import winerror
from .server import Server


class NamedPipeServer(Server):
    def __init__(self, address):
        super().__init__(address)
        self.pipe_handle = win32pipe.CreateNamedPipe(
            self.address,
            win32pipe.PIPE_ACCESS_DUPLEX,
            win32pipe.PIPE_TYPE_MESSAGE | win32pipe.PIPE_WAIT,
            1,
            65536,
            65536,
            0,
            None,
        )

    def listen(self):
        win32pipe.ConnectNamedPipe(self.pipe_handle, None)

    def readlines(self):
        data = ""
        while True:
            try:
                result, chunk = win32file.ReadFile(self.pipe_handle, 1)
                if result != 0:  # ReadFileが0以外の結果を返した場合
                    raise Exception("Pipe connection error")
                chunk = chunk.decode()
                if chunk != "":
                    data += chunk
                else:
                    return data.strip()
                if data[-1] == "\n":
                    return data.strip()
            except pywintypes.error as e:
                if e.winerror == winerror.ERROR_BROKEN_PIPE:  # 109
                    win32pipe.DisconnectNamedPipe(self.pipe_handle)
                    win32pipe.ConnectNamedPipe(self.pipe_handle, None)
                    print("New connection established. (109)")
                    if data != "":
                        # 受信中に切断されたら正常終了とみなす
                        return data.strip()
                elif e.winerror == winerror.ERROR_PIPE_NOT_CONNECTED:  # 233
                    win32pipe.ConnectNamedPipe(self.pipe_handle, None)
                    print("New connection established. (233)")
                else:
                    raise e

    def close(self):
        win32file.CloseHandle(self.pipe_handle)
