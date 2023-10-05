from django.contrib.gis.db.backends.postgis.base import (
    DatabaseWrapper as PostGISDatabaseWrapper,
)

# isort: off
from django_iam_dbauth.aws.postgresql.base import (  # type: ignore
    DatabaseWrapper as IAMDatabaseWrapper,
)

# isort: on


class DatabaseWrapper(IAMDatabaseWrapper, PostGISDatabaseWrapper):  # type: ignore
    pass
