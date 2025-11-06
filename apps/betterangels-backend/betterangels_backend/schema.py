from accounts.schema import Mutation as AccountsMutation
from accounts.schema import Query as AccountsQuery
from clients.schema import Mutation as ClientsMutation
from clients.schema import Query as ClientsQuery
from common.graphql.schema import Query as CommonQuery
from hmis.schema import Mutation as HmisMutation
from hmis.schema import Query as HmisQuery
from hmis.schema_gql import Mutation as HmisGqlMutation
from hmis.schema_gql import Query as HmisGqlQuery
from notes.schema import Mutation as NotesMutation
from notes.schema import Query as NotesQuery
from shelters.schema import Query as SheltersQuery
from strawberry import Schema
from strawberry.tools import merge_types
from strawberry_django.optimizer import DjangoOptimizerExtension
from tasks.schema import Mutation as TasksMutation
from tasks.schema import Query as TasksQuery

# Schema Stiching
# https://github.com/strawberry-graphql/strawberry/issues/566#issuecomment-1346660629
queries = (AccountsQuery, ClientsQuery, CommonQuery, HmisGqlQuery, HmisQuery, NotesQuery, TasksQuery, SheltersQuery)
Query = merge_types("Query", queries)

mutations = (AccountsMutation, ClientsMutation, HmisGqlMutation, HmisMutation, NotesMutation, TasksMutation)
Mutation = merge_types("Mutation", mutations)

schema = Schema(
    query=Query,
    mutation=Mutation,
    extensions=[
        DjangoOptimizerExtension,
    ],
)
