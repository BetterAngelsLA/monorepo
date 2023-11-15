from enum import Enum

class RecordMode(str, Enum):
    ALL: str
    ANY: str
    NEW_EPISODES: str
    NONE: str
    ONCE: str
