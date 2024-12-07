from accounts.schema import Mutation as AccountsMutation
from accounts.schema import Query as AccountsQuery
from clients.schema import Mutation as ClientsMutation
from clients.schema import Query as ClientsQuery
from common.graphql.schema import Query as CommonQuery
from notes.schema import Mutation as NotesMutation
from notes.schema import Query as NotesQuery
from shelters.schema import Query as SheltersQuery
from strawberry import Schema
from strawberry.tools import merge_types
from strawberry_django.optimizer import DjangoOptimizerExtension

# Schema Stiching
# https://github.com/strawberry-graphql/strawberry/issues/566#issuecomment-1346660629
queries = (AccountsQuery, ClientsQuery, CommonQuery, NotesQuery, SheltersQuery)
Query = merge_types("Query", queries)

mutations = (AccountsMutation, ClientsMutation, NotesMutation)
Mutation = merge_types("Mutation", mutations)

schema = Schema(
    query=Query,
    mutation=Mutation,
    extensions=[
        DjangoOptimizerExtension,
    ],
)
