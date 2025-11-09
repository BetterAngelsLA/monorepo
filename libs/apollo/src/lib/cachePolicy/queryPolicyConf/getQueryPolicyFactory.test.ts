import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import {
  DEFAULT_QUERY_ID_KEY,
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
  MergeModeEnum,
  PaginationModeEnum,
} from '../constants';
import { getQueryPolicyFactory } from './getQueryPolicyFactory';

// 1) mock generateFieldPolicy so we can see what it was called with
vi.mock('../generateFieldPolicy', () => ({
  generateFieldPolicy: vi.fn(() => {
    return {
      // a shape Apollo would like
      merge: vi.fn(),
      keyArgs: undefined,
    };
  }),
}));

// 2) mock getMergeOptions so we can see what paths were passed
vi.mock('./utils/getMergeOptions', () => ({
  getMergeOptions: vi.fn((mergeOpts: any, paths: any) => {
    return {
      ...mergeOpts,
      __paths: paths,
    };
  }),
}));

// 3) mock generateQueryPolicyConfig — this is the new piece we actually use
vi.mock('./utils/generateQueryPolicyConfig', () => ({
  generateQueryPolicyConfig: vi.fn((input: any) => {
    // emulate the real function enough for tests
    const {
      itemsPath = [DEFAULT_QUERY_RESULTS_KEY],
      totalCountPath = [DEFAULT_QUERY_TOTAL_COUNT_KEY],
      paginationMode = PaginationModeEnum.Offset,
      paginationVariables,
    } = input || {};

    if (paginationMode === PaginationModeEnum.Offset) {
      return {
        paginationMode,
        itemsPath,
        totalCountPath,
        paginationOffsetPath: paginationVariables?.offsetPath ?? [
          'pagination',
          'offset',
        ],
        paginationLimitPath: paginationVariables?.limitPath ?? [
          'pagination',
          'limit',
        ],
      };
    }

    return {
      paginationMode,
      itemsPath,
      totalCountPath,
      paginationPagePath: paginationVariables?.pagePath ?? [
        'pagination',
        'page',
      ],
      paginationPerPagePath: paginationVariables?.perPagePath ?? [
        'pagination',
        'perPage',
      ],
    };
  }),
}));

// 4) mock itemIdPathToKeyFields
vi.mock('./utils/itemIdPathToKeyFields', () => ({
  itemIdPathToKeyFields: vi.fn((itemIdPath: any) => {
    return Array.isArray(itemIdPath) ? itemIdPath : [itemIdPath];
  }),
}));

describe('getQueryPolicyFactory', () => {
  let warnSpy: MockInstance;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('builds a config and forwards cacheKeyVariables to generateFieldPolicy', async () => {
    type TasksQuery = {
      tasks: {
        results: Array<{ __typename: 'TaskType'; id: string }>;
      };
    };
    type TasksVars = {
      filters?: { q?: string } | null;
      pagination?: { offset?: number; limit?: number } | null;
    };

    const conf = getQueryPolicyFactory<TasksQuery, TasksVars>({
      key: 'tasks',
      entityTypename: 'TaskType',
      cacheKeyVariables: ['filters'] as const,
    });

    expect(conf.key).toBe('tasks');

    const built = conf.buildFn();
    expect(built.entityTypename).toBe('TaskType');
    // default keyFields from itemIdPath
    expect(built.keyFields).toEqual([DEFAULT_QUERY_ID_KEY]);

    const { generateFieldPolicy } = await import('../generateFieldPolicy');

    expect(generateFieldPolicy).toHaveBeenCalledTimes(1);
    expect(generateFieldPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        keyArgs: ['filters'],
      })
    );
  });

  it('resolves merge options and passes queryPolicyConfig to generateFieldPolicy', async () => {
    type ClientsQuery = {
      clients: {
        results: Array<{ __typename: 'ClientType'; id: string }>;
        totalCount: number;
      };
    };
    type ClientsVars = {
      filters?: { q?: string } | null;
      pagination?: { page?: number; pageSize?: number } | null;
    };

    const conf = getQueryPolicyFactory<ClientsQuery, ClientsVars>({
      key: 'clients',
      entityTypename: 'ClientType',
      cacheKeyVariables: ['filters'] as const,
      itemsPath: ['data', 'items'],
      totalCountPath: ['data', 'total'],
      itemIdPath: ['data', 'items', 'clientId'],
      mergeOpts: { mode: MergeModeEnum.Object },
      paginationMode: PaginationModeEnum.PerPage,
      paginationVariables: {
        mode: PaginationModeEnum.PerPage,
        pagePath: ['pagination', 'page'],
        perPagePath: ['pagination', 'pageSize'],
      },
    });

    conf.buildFn();

    const { getMergeOptions } = await import('./utils/getMergeOptions');
    const { generateQueryPolicyConfig } = await import(
      './utils/generateQueryPolicyConfig'
    );
    const { generateFieldPolicy } = await import('../generateFieldPolicy');

    // merge options got paths
    expect(getMergeOptions).toHaveBeenCalledWith(
      { mode: MergeModeEnum.Object },
      {
        itemsPath: ['data', 'items'],
        totalCountPath: ['data', 'total'],
        itemIdPath: ['data', 'items', 'clientId'],
      }
    );

    // we built the policy config with the provided pagination
    expect(generateQueryPolicyConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        itemsPath: ['data', 'items'],
        totalCountPath: ['data', 'total'],
        paginationMode: PaginationModeEnum.PerPage,
        paginationVariables: {
          mode: PaginationModeEnum.PerPage,
          pagePath: ['pagination', 'page'],
          perPagePath: ['pagination', 'pageSize'],
        },
      })
    );

    // generateFieldPolicy should receive THAT config
    expect(generateFieldPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryPolicyConfig: expect.objectContaining({
          paginationMode: PaginationModeEnum.PerPage,
          itemsPath: ['data', 'items'],
          totalCountPath: ['data', 'total'],
          paginationPagePath: ['pagination', 'page'],
          paginationPerPagePath: ['pagination', 'pageSize'],
        }),
        mergeOpts: expect.objectContaining({
          mode: MergeModeEnum.Object,
          __paths: expect.any(Object),
        }),
      })
    );
  });

  it('derives keyFields from itemIdPath when entityIdFields is not provided', async () => {
    type NotesQuery = {
      notes: {
        results: Array<{ __typename: 'ProgramNote'; noteId: string }>;
      };
    };
    type NotesVars = {
      filters?: { q?: string } | null;
    };

    const conf = getQueryPolicyFactory<NotesQuery, NotesVars>({
      key: 'notes',
      entityTypename: 'ProgramNote',
      cacheKeyVariables: [] as const,
      itemIdPath: ['noteId'],
    });

    const built = conf.buildFn();

    const { itemIdPathToKeyFields } = await import(
      './utils/itemIdPathToKeyFields'
    );
    expect(itemIdPathToKeyFields).toHaveBeenCalledWith(['noteId']);
    expect(built.keyFields).toEqual(['noteId']);
  });

  it('warns when merge mode is Array (not fully supported)', () => {
    type SomethingQuery = {
      something: {
        results: Array<{ __typename: 'Something'; id: string }>;
      };
    };
    type SomethingVars = {
      filters?: unknown;
    };

    const conf = getQueryPolicyFactory<SomethingQuery, SomethingVars>({
      key: 'something',
      entityTypename: 'Something',
      cacheKeyVariables: [] as const,
      mergeOpts: { mode: MergeModeEnum.Array },
    });

    conf.buildFn();

    expect(warnSpy).toHaveBeenCalledWith(
      '[getQueryPolicyFactory]: array mode is not yet fully supported.'
    );
  });

  it('uses defaults for itemIdPath, itemsPath, totalCountPath when not provided', async () => {
    type TasksQuery = {
      tasks: {
        results: Array<{ __typename: 'TaskType'; id: string }>;
        totalCount: number;
      };
    };
    type TasksVars = {
      filters?: unknown;
    };

    const conf = getQueryPolicyFactory<TasksQuery, TasksVars>({
      key: 'tasks',
      entityTypename: 'TaskType',
      cacheKeyVariables: ['filters'] as const,
    });

    conf.buildFn();

    const { getMergeOptions } = await import('./utils/getMergeOptions');

    expect(getMergeOptions).toHaveBeenCalledWith(
      { mode: MergeModeEnum.Object },
      {
        itemsPath: [DEFAULT_QUERY_RESULTS_KEY],
        totalCountPath: [DEFAULT_QUERY_TOTAL_COUNT_KEY],
        itemIdPath: [DEFAULT_QUERY_ID_KEY],
      }
    );
  });

  it('prefers explicit entityIdFields over itemIdPath', () => {
    type TasksQuery = {
      tasks: {
        results: Array<{
          __typename: 'TaskType';
          id: string;
          projectId: string;
        }>;
      };
    };
    type TasksVars = {
      filters?: unknown;
    };

    const conf = getQueryPolicyFactory<TasksQuery, TasksVars>({
      key: 'tasks',
      entityTypename: 'TaskType',
      cacheKeyVariables: [] as const,
      entityIdFields: ['id', 'projectId'],
      itemIdPath: ['ignored'],
    });

    const built = conf.buildFn();

    expect(built.keyFields).toEqual(['id', 'projectId']);
  });
});
