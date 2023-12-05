from accounts.schema import Mutation as AccountMutation
from accounts.schema import Query as AccountQuery
from strawberry import Schema
from strawberry.tools import merge_types

# Schema Stiching
# https://github.com/strawberry-graphql/strawberry/issues/566#issuecomment-1346660629
queries = (AccountQuery,)
Query = merge_types("Query", queries)

mutations = (AccountMutation,)
Mutation = merge_types("Mutation", mutations)

schema = Schema(query=Query, mutation=Mutation)
