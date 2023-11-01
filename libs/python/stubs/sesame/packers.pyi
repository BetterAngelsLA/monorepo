from _typeshed import Incomplete

class BasePacker:
    def pack_pk(self, user_pk) -> None: ...
    def unpack_pk(self, data) -> None: ...

class StructPackerMeta(type):
    def __new__(cls, name, bases, namespace, **kwds): ...

class StructPacker(BasePacker, metaclass=StructPackerMeta):
    fmt: str
    @classmethod
    def pack_pk(cls, user_pk): ...
    @classmethod
    def unpack_pk(cls, data): ...

class ShortPacker(StructPacker):
    fmt: str

class UnsignedShortPacker(StructPacker):
    fmt: str

class LongPacker(StructPacker):
    fmt: str
IntPacker = LongPacker

class UnsignedLongPacker(StructPacker):
    fmt: str
UnsignedIntPacker = UnsignedLongPacker

class LongLongPacker(StructPacker):
    fmt: str

class UnsignedLongLongPacker(StructPacker):
    fmt: str

class UUIDPacker(BasePacker):
    @staticmethod
    def pack_pk(user_pk): ...
    @staticmethod
    def unpack_pk(data): ...

class BytesPacker(BasePacker):
    @staticmethod
    def pack_pk(user_pk): ...
    @staticmethod
    def unpack_pk(data): ...

class StrPacker(BytesPacker):
    @staticmethod
    def pack_pk(user_pk): ...
    @staticmethod
    def unpack_pk(data): ...

packer: Incomplete
