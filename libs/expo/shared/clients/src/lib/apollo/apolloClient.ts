
import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
    uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || "https://dev.api.example.com/graphql",
    cache: new InMemoryCache(),
});

export default client;
