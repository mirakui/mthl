import win32pipe
import win32file
import pywintypes
from .server import Server

class NamedPipeServer(Server):
    def __init__(self, address):
        super().__init__(address)
        self.pipe_handle = win32pipe.CreateNamedPipe(
            self.address,
            win32pipe.PIPE_ACCESS_INBOUND,
            win32pipe.PIPE_TYPE_MESSAGE | win32pipe.PIPE_WAIT,
            1, 65536, 65536,
            0,
            None)

    def listen(self):
        win32pipe.ConnectNamedPipe(self.pipe_handle, None)
        pass

    def readlines(self):
        data = ""
        while True:
            try:
                result, chunk = win32file.ReadFile(self.pipe_handle, 1)
                if result != 0:  # ReadFileが0以外の結果を返した場合
                    raise Exception("Pipe connection error")
                chunk = chunk.decode()
                if chunk:  # 読み取ったデータがあれば追加する
                    data += chunk
                else:  # データがなければクライアントからの接続が閉じられていると判断
                    break
            except pywintypes.error as e:  # ReadFileが例外を投げた場合
                if e.winerror == 109:  # ERROR_BROKEN_PIPE
                    win32pipe.DisconnectNamedPipe(self.pipe_handle)
                    print("Client disconnected. (109)")
                    if data == "":
                        win32pipe.ConnectNamedPipe(self.pipe_handle, None)
                        print("New connection established. (109)")
                    else:
                        break
                if e.winerror == 233:
                    win32pipe.ConnectNamedPipe(self.pipe_handle, None)
                    print("New connection established. (233)")
                else:
                    raise e
        return data

    def close(self):
        win32file.CloseHandle(self.pipe_handle)
