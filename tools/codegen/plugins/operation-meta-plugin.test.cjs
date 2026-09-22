const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  parse,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
} = require('graphql');
const { plugin } = require('./operation-meta-plugin.cjs');

describe('operation-meta-plugin', () => {
  let tmpDir;
  let idx = 0;

  function invokePlugin(doc, schema = null) {
    const filename = `op_${idx++}`;
    const result = plugin(
      schema,
      [{ document: doc }],
      {},
      {
        outputFile: path.join(tmpDir, `${filename}.generated.ts`),
      },
    );
    assert.strictEqual(result, '');
    const metaPath = path.join(tmpDir, `${filename}_meta.generated.ts`);
    return fs.existsSync(metaPath) ? fs.readFileSync(metaPath, 'utf-8') : null;
  }

  const shelterSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        shelter: {
          type: new GraphQLObjectType({
            name: 'ShelterType',
            fields: { id: { type: GraphQLID }, name: { type: GraphQLString } },
          }),
        },
      },
    }),
  });

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opmeta-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  // ── Mutations ──────────────────────────────────────────────

  describe('mutations', () => {
    it('single — writes operationKey, successTypename, Meta', () => {
      const content = invokePlugin(
        parse(`
        mutation UpdateShelterProfile($data: UpdateShelterInput!) {
          updateShelter(data: $data) {
            ... on ShelterType { id }
            ... on OperationInfo { messages { message } }
          }
        }
      `),
      );

      assert.ok(
        content.includes('export const updateShelterProfileOperationKey'),
      );
      assert.ok(content.includes("'updateShelter'"));
      assert.ok(
        content.includes('export const updateShelterProfileSuccessTypename'),
      );
      assert.ok(content.includes("'ShelterType'"));
      assert.ok(content.includes('export const updateShelterProfileMeta'));
      assert.ok(content.includes('UpdateShelterProfileMutation'));
    });

    it('multiple — writes both with prefixed exports', () => {
      const content = invokePlugin(
        parse(`
        mutation GenerateUploads($data: GenerateInput!) {
          generateShelterPhotoUploads(data: $data) {
            ... on AuthorizedPresignedS3UploadsType { uploads { refId } }
            ... on OperationInfo { messages { message } }
          }
        }
        mutation ResolveUploads($data: ResolveInput!) {
          resolveShelterPhotoUploads(data: $data) {
            ... on ShelterPhotoUploadsType { photos { id } }
            ... on OperationInfo { messages { message } }
          }
        }
      `),
      );

      assert.ok(content.includes('generateUploadsOperationKey'));
      assert.ok(content.includes('generateUploadsSuccessTypename'));
      assert.ok(content.includes('generateUploadsMeta'));
      assert.ok(content.includes('resolveUploadsOperationKey'));
      assert.ok(content.includes('resolveUploadsSuccessTypename'));
      assert.ok(content.includes('resolveUploadsMeta'));
    });
  });

  // ── Queries ────────────────────────────────────────────────

  describe('queries', () => {
    it('with schema — writes operationKey, successTypename, Meta', () => {
      const content = invokePlugin(
        parse(`
        query GetShelter($id: ID!) {
          shelter(pk: $id) { id name }
        }
      `),
        shelterSchema,
      );

      assert.ok(content.includes('export const getShelterOperationKey'));
      assert.ok(content.includes("'shelter'"));
      assert.ok(content.includes('export const getShelterSuccessTypename'));
      assert.ok(content.includes("'ShelterType'"));
      assert.ok(content.includes('export const getShelterMeta'));
      assert.ok(content.includes('GetShelterQuery'));
    });

    it('list return type — extracts successTypename from the element', () => {
      const listSchema = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: 'Query',
          fields: {
            hmisClientPrograms: {
              type: new GraphQLList(
                new GraphQLObjectType({
                  name: 'HmisClientProgramType',
                  fields: { id: { type: GraphQLID } },
                }),
              ),
            },
          },
        }),
      });
      const content = invokePlugin(
        parse(`
        query clientProgramsHmis {
          hmisClientPrograms { id }
        }
      `),
        listSchema,
      );

      assert.ok(
        content.includes('export const clientProgramsHmisOperationKey'),
      );
      assert.ok(content.includes("'hmisClientPrograms'"));
      assert.ok(
        content.includes('export const clientProgramsHmisSuccessTypename'),
      );
      assert.ok(content.includes("'HmisClientProgramType'"));
      assert.ok(content.includes('extends readonly (infer _T)[]'));
    });

    it('aliased root field — uses the response key (alias), not the schema field', () => {
      const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: 'Query',
          fields: {
            currentUser: {
              type: new GraphQLObjectType({
                name: 'CurrentUserType',
                fields: { id: { type: GraphQLID } },
              }),
            },
          },
        }),
      });
      const content = invokePlugin(
        parse(`
        query currentOrgUser {
          profile: currentUser { id }
        }
      `),
        schema,
      );

      assert.ok(content.includes('export const currentOrgUserOperationKey'));
      // operationKey is the response key (the alias), not the schema field.
      assert.ok(content.includes("= 'profile';"));
      // Schema lookup still resolves the success typename from the schema field.
      assert.ok(content.includes("'CurrentUserType'"));
      // SuccessTypename indexes the generated type by the response key.
      assert.ok(content.includes("CurrentOrgUserQuery['profile']"));
      assert.ok(!content.includes("CurrentOrgUserQuery['currentUser']"));
    });
  });

  // ── Edge cases ─────────────────────────────────────────────

  describe('edge cases', () => {
    it('no schema — writes only operationKey, no successTypename', () => {
      const content = invokePlugin(
        parse(`
        query GetShelter($id: ID!) {
          shelter(pk: $id) { id name }
        }
      `),
      );

      assert.ok(content.includes('export const getShelterOperationKey'));
      assert.ok(content.includes("'shelter'"));
      assert.ok(!content.includes('SuccessTypename'));
      assert.ok(!content.includes('Meta'));
      assert.ok(content.includes('GetShelterQuery'));
    });

    it('unnamed operation — returns empty', () => {
      const content = invokePlugin(
        parse(`
        mutation { updateShelter(data: {}) { ... on ShelterType { id } } }
      `),
      );

      assert.strictEqual(content, null);
    });

    it('only OperationInfo fragment — writes operationKey, no successTypename', () => {
      const content = invokePlugin(
        parse(`
        mutation Foo($data: Bar!) {
          foo(data: $data) {
            ... on OperationInfo { messages { message } }
          }
        }
      `),
      );

      assert.ok(content.includes('export const fooOperationKey'));
      assert.ok(content.includes("'foo'"));
      assert.ok(!content.includes('SuccessTypename'));
      assert.ok(!content.includes('Meta'));
    });

    it('scalar return type — writes operationKey, no successTypename', () => {
      const schema = new GraphQLSchema({
        mutation: new GraphQLObjectType({
          name: 'Mutation',
          fields: {
            logout: { type: GraphQLBoolean },
          },
        }),
      });
      const content = invokePlugin(
        parse(`
        mutation Logout {
          logout
        }
      `),
        schema,
      );

      assert.ok(content.includes('export const logoutOperationKey'));
      assert.ok(content.includes("'logout'"));
      assert.ok(!content.includes('SuccessTypename'));
      assert.ok(!content.includes('Meta'));
    });

    it('lowercase operation name — PascalCases the generated type name', () => {
      const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: 'Query',
          fields: {
            currentUser: {
              type: new GraphQLObjectType({
                name: 'CurrentUserType',
                fields: { id: { type: GraphQLID } },
              }),
            },
          },
        }),
      });
      const content = invokePlugin(
        parse(`
        query currentOrgUser {
          currentUser { id }
        }
      `),
        schema,
      );

      assert.ok(content.includes('export const currentOrgUserOperationKey'));
      assert.ok(content.includes("'currentUser'"));
      assert.ok(content.includes('CurrentOrgUserQuery'));
      assert.ok(!content.includes('currentOrgUserQuery'));
      assert.ok(content.includes('currentOrgUserSuccessTypename'));
    });
  });
});
