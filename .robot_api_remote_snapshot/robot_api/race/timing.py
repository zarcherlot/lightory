import time


class RaceTimer:
    def __init__(self) -> None:
        self.started = time.monotonic()

    def elapsed_ms(self) -> int:
        return int((time.monotonic() - self.started) * 1000)
