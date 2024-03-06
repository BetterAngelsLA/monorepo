from accounts.schema import Mutation as AccountMutation
from accounts.schema import Query as AccountQuery
from notes.schema import Mutation as NoteMutation
from notes.schema import Query as NoteQuery
from strawberry import Schema
from strawberry.tools import merge_types
from strawberry_django.optimizer import DjangoOptimizerExtension

# Schema Stiching
# https://github.com/strawberry-graphql/strawberry/issues/566#issuecomment-1346660629
queries = (AccountQuery, NoteQuery)
Query = merge_types("Query", queries)

mutations = (AccountMutation, NoteMutation)
Mutation = merge_types("Mutation", mutations)

schema = Schema(
    query=Query,
    mutation=Mutation,
    extensions=[
        DjangoOptimizerExtension,
    ],
)
