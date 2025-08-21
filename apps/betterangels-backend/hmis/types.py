from typing import Optional, Union

import strawberry


@strawberry.type
class HmisLoginSuccess:
    hmisToken: str


@strawberry.type
class HmisLoginError:
    message: str
    field: Optional[str] = None


HmisLoginResult = Union[HmisLoginSuccess, HmisLoginError]
