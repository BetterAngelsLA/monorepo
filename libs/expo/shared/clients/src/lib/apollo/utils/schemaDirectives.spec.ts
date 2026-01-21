import { parse, type OperationDefinitionNode } from 'graphql';
import {
  getOperationsByDirective,
  operationHasDirective,
} from '../utils/schemaDirectives';

describe('Schema directive utilities', () => {
  describe('getOperationsByDirective', () => {
    it('returns all HMIS operations from the schema', () => {
      const ops = getOperationsByDirective('hmisDirective');
      expect(ops.has('hmisClientProfiles')).toBe(true);
      expect(ops.has('createHmisNote')).toBe(true);
    });
  });

  describe('operationHasDirective', () => {
    it('detects HMIS mutations from operation AST', () => {
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
