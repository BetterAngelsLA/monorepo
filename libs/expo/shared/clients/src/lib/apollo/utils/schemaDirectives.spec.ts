import {
  getOperationsByDirective,
  operationHasDirective,
} from '../utils/schemaDirectives';
import { parse, type OperationDefinitionNode } from 'graphql';

describe('Schema directive utilities', () => {
  describe('getOperationsByDirective', () => {
    it('returns all HMIS operations from the schema', () => {
      const ops = getOperationsByDirective('hmisDirective');

      // Should find all 14 HMIS operations
      expect(ops.size).toBe(14);

      // Spot-check a few key operations
      expect(ops.has('hmisLogin')).toBe(true);
      expect(ops.has('hmisClientProfiles')).toBe(true);
      expect(ops.has('createHmisNote')).toBe(true);
    });
  });

  describe('operationHasDirective', () => {
    it('detects HMIS mutations from operation AST', () => {
      // mutation HMISLogin { hmisLogin(...) { ... } }
      const hmisLoginOp = parse(`
        mutation HMISLogin {
          hmisLogin(email: "", password: "") {
            __typename
          }
        }
      `).definitions[0];
      expect(
        operationHasDirective(
          hmisLoginOp as OperationDefinitionNode,
          'hmisDirective'
        )
      ).toBe(true);

      const createHmisOp = parse(`
        mutation CreateHmis {
          createHmisClientProfile(data: {}) {
            __typename
          }
        }
      `).definitions[0];
      expect(
        operationHasDirective(
          createHmisOp as OperationDefinitionNode,
          'hmisDirective'
        )
      ).toBe(true);
    });

    it('detects HMIS queries from operation AST', () => {
      const hmisClientProfilesOp = parse(`
        query GetHmisClients {
          hmisClientProfiles {
            id
          }
        }
      `).definitions[0];
      expect(
        operationHasDirective(
          hmisClientProfilesOp as OperationDefinitionNode,
          'hmisDirective'
        )
      ).toBe(true);

      const hmisNoteOp = parse(`
        query GetHmisNote {
          hmisNote(id: "") {
            id
          }
        }
      `).definitions[0];
      expect(
        operationHasDirective(
          hmisNoteOp as OperationDefinitionNode,
          'hmisDirective'
        )
      ).toBe(true);
    });

    it('excludes non-HMIS operations', () => {
      const nonHmisOp = parse(`
        mutation CreateClient {
          createClientProfile(data: {}) {
            __typename
          }
        }
      `).definitions[0];
      expect(
        operationHasDirective(
          nonHmisOp as OperationDefinitionNode,
          'hmisDirective'
        )
      ).toBe(false);

      const notesOp = parse(`
        query GetNotes {
          notes {
            id
          }
        }
      `).definitions[0];
      expect(
        operationHasDirective(
          notesOp as OperationDefinitionNode,
          'hmisDirective'
        )
      ).toBe(false);
    });
  });
});
