/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  mutation GenerateMagicLink {\n    generateMagicLink(input: { email: \"paul+test@betterangels.la\" }) {\n      message\n    }\n  }\n": types.GenerateMagicLinkDocument,
    "\n  mutation CreateNote($input: CreateNoteInput!) {\n    createNote(input: $input) {\n      id\n      title\n      body\n      createdAt\n      createdBy {\n        id\n        username\n        email\n      }\n    }\n  }\n": types.CreateNoteDocument,
    "\n  mutation UpdateNote($input: UpdateNoteInput!) {\n    updateNote(input: $input) {\n      id\n      title\n      body\n      createdAt\n      createdBy {\n        id\n        username\n        email\n      }\n    }\n  }\n": types.UpdateNoteDocument,
    "\n  query currentUser {\n    currentUser {\n      id\n      username\n      email\n    }\n  }\n": types.CurrentUserDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GenerateMagicLink {\n    generateMagicLink(input: { email: \"paul+test@betterangels.la\" }) {\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation GenerateMagicLink {\n    generateMagicLink(input: { email: \"paul+test@betterangels.la\" }) {\n      message\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateNote($input: CreateNoteInput!) {\n    createNote(input: $input) {\n      id\n      title\n      body\n      createdAt\n      createdBy {\n        id\n        username\n        email\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateNote($input: CreateNoteInput!) {\n    createNote(input: $input) {\n      id\n      title\n      body\n      createdAt\n      createdBy {\n        id\n        username\n        email\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateNote($input: UpdateNoteInput!) {\n    updateNote(input: $input) {\n      id\n      title\n      body\n      createdAt\n      createdBy {\n        id\n        username\n        email\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateNote($input: UpdateNoteInput!) {\n    updateNote(input: $input) {\n      id\n      title\n      body\n      createdAt\n      createdBy {\n        id\n        username\n        email\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query currentUser {\n    currentUser {\n      id\n      username\n      email\n    }\n  }\n"): (typeof documents)["\n  query currentUser {\n    currentUser {\n      id\n      username\n      email\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;