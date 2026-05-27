from accounts.permissions import UserOrganizationPermissions
from accounts.schema import Mutation as AccountsMutation
from accounts.schema import Query as AccountsQuery
from clients.schema import Mutation as ClientsMutation
from clients.schema import Query as ClientsQuery
from common.graphql.schema import Query as CommonQuery
from common.graphql.types import SCALAR_MAP
from hmis.schema import Mutation as HmisMutation
from hmis.schema import Query as HmisQuery
from notes.schema import Mutation as NotesMutation
from notes.schema import Query as NotesQuery
from reports.permissions import ReportOrgPermissions
from reports.schema import Query as ReportsQuery
from shelters.schema import Mutation as SheltersMutation
from shelters.schema import Query as SheltersQuery
from strawberry import Schema
from strawberry.schema.config import StrawberryConfig
from strawberry.tools import merge_types
from strawberry_django.optimizer import DjangoOptimizerExtension
from tasks.schema import Mutation as TasksMutation
from tasks.schema import Query as TasksQuery

# Schema Stiching
# https://github.com/strawberry-graphql/strawberry/issues/566#issuecomment-1346660629
queries = (AccountsQuery, ClientsQuery, CommonQuery, HmisQuery, NotesQuery, ReportsQuery, TasksQuery, SheltersQuery)
Query = merge_types("Query", queries)

mutations = (AccountsMutation, ClientsMutation, HmisMutation, NotesMutation, TasksMutation, SheltersMutation)
Mutation = merge_types("Mutation", mutations)

schema = Schema(
    query=Query,
    mutation=Mutation,
    extensions=[DjangoOptimizerExtension],
    config=StrawberryConfig(scalar_map=SCALAR_MAP),
    # Transitional: register per-app permission enums so they appear in the schema
    # while we migrate fields from the combined OrgPermission enum to these granular ones.
    # Remove once OrgPermission is fully deprecated and fields reference these directly.
    types=[UserOrganizationPermissions, ReportOrgPermissions],
)
