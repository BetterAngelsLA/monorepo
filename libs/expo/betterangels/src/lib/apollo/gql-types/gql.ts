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
    "\n  mutation GenerateMagicLink {\n    generateMagicLink(data: { email: \"paul+test@betterangels.la\" }) {\n      message\n    }\n  }\n": types.GenerateMagicLinkDocument,
    "\n  mutation CreateNote($data: CreateNoteInput!) {\n    createNote(data: $data) {\n      ... on NoteType {\n        id\n        title\n        publicDetails\n        client {\n          id\n          username\n          firstName\n          lastName\n          email\n        }\n        createdAt\n        createdBy {\n          id\n          username\n          email\n        }\n      }\n    }\n  }\n": types.CreateNoteDocument,
    "\n  mutation UpdateNote($data: UpdateNoteInput!) {\n    updateNote(data: $data) {\n      ... on NoteType {\n        id\n        title\n        publicDetails\n        client {\n          id\n          username\n          firstName\n          lastName\n          email\n        }\n        createdAt\n        createdBy {\n          id\n          username\n          email\n        }\n      }\n    }\n  }\n": types.UpdateNoteDocument,
    "\n  mutation DeleteNote($data: DeleteDjangoObjectInput!) {\n    deleteNote(data: $data) {\n      ... on NoteType {\n        id\n      }\n    }\n  }\n": types.DeleteNoteDocument,
    "\n  mutation CreateServiceRequest($data: CreateServiceRequestInput!) {\n    createServiceRequest(data: $data) {\n      ... on ServiceRequestType {\n        id\n        service\n      }\n    }\n  }\n": types.CreateServiceRequestDocument,
    "\n  mutation DeleteServiceRequest($data: DeleteDjangoObjectInput!) {\n    deleteServiceRequest(data: $data) {\n      ... on ServiceRequestType {\n        id\n      }\n    }\n  }\n": types.DeleteServiceRequestDocument,
    "\n  query currentUser {\n    currentUser {\n      id\n      username\n      email\n    }\n  }\n": types.CurrentUserDocument,
    "\n  query notes {\n    notes {\n      id\n      title\n      publicDetails\n      createdAt\n    }\n  }\n": types.NotesDocument,
    "\n  query ViewNote($id: ID!) {\n    note(pk: $id) {\n      id\n      title\n      publicDetails\n      client {\n        id\n      }\n    }\n  }\n": types.ViewNoteDocument,
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
export function graphql(source: "\n  mutation GenerateMagicLink {\n    generateMagicLink(data: { email: \"paul+test@betterangels.la\" }) {\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation GenerateMagicLink {\n    generateMagicLink(data: { email: \"paul+test@betterangels.la\" }) {\n      message\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateNote($data: CreateNoteInput!) {\n    createNote(data: $data) {\n      ... on NoteType {\n        id\n        title\n        publicDetails\n        client {\n          id\n          username\n          firstName\n          lastName\n          email\n        }\n        createdAt\n        createdBy {\n          id\n          username\n          email\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateNote($data: CreateNoteInput!) {\n    createNote(data: $data) {\n      ... on NoteType {\n        id\n        title\n        publicDetails\n        client {\n          id\n          username\n          firstName\n          lastName\n          email\n        }\n        createdAt\n        createdBy {\n          id\n          username\n          email\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateNote($data: UpdateNoteInput!) {\n    updateNote(data: $data) {\n      ... on NoteType {\n        id\n        title\n        publicDetails\n        client {\n          id\n          username\n          firstName\n          lastName\n          email\n        }\n        createdAt\n        createdBy {\n          id\n          username\n          email\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateNote($data: UpdateNoteInput!) {\n    updateNote(data: $data) {\n      ... on NoteType {\n        id\n        title\n        publicDetails\n        client {\n          id\n          username\n          firstName\n          lastName\n          email\n        }\n        createdAt\n        createdBy {\n          id\n          username\n          email\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNote($data: DeleteDjangoObjectInput!) {\n    deleteNote(data: $data) {\n      ... on NoteType {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteNote($data: DeleteDjangoObjectInput!) {\n    deleteNote(data: $data) {\n      ... on NoteType {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateServiceRequest($data: CreateServiceRequestInput!) {\n    createServiceRequest(data: $data) {\n      ... on ServiceRequestType {\n        id\n        service\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateServiceRequest($data: CreateServiceRequestInput!) {\n    createServiceRequest(data: $data) {\n      ... on ServiceRequestType {\n        id\n        service\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteServiceRequest($data: DeleteDjangoObjectInput!) {\n    deleteServiceRequest(data: $data) {\n      ... on ServiceRequestType {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteServiceRequest($data: DeleteDjangoObjectInput!) {\n    deleteServiceRequest(data: $data) {\n      ... on ServiceRequestType {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query currentUser {\n    currentUser {\n      id\n      username\n      email\n    }\n  }\n"): (typeof documents)["\n  query currentUser {\n    currentUser {\n      id\n      username\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query notes {\n    notes {\n      id\n      title\n      publicDetails\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query notes {\n    notes {\n      id\n      title\n      publicDetails\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ViewNote($id: ID!) {\n    note(pk: $id) {\n      id\n      title\n      publicDetails\n      client {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query ViewNote($id: ID!) {\n    note(pk: $id) {\n      id\n      title\n      publicDetails\n      client {\n        id\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;