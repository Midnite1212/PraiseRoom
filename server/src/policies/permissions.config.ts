export const ACCESS_TYPES = ['member', 'editor', 'admin'] as const;
export type AccessType = (typeof ACCESS_TYPES)[number];
export const DEFAULT_ACCESS_TYPE: AccessType = 'member';

export type PermissionConfig =
  | {
      requiresAuth: true;
      allowedAccessTypes?: AccessType[];
      description?: string;
    }
  | {
      requiresAuth: false;
      optionalAuth?: boolean;
      description?: string;
    };

// Only the access types listed can use a route; there is no hierarchy.
const SONG_WRITERS: AccessType[] = ['editor', 'admin'];

export const ROUTE_PERMISSIONS: Record<string, PermissionConfig> = {
  // Ownership routes
  'POST /api/ownerships/create': {
    requiresAuth: true,
    description: 'Create ownership record',
  },
  'GET /api/ownerships/get': {
    requiresAuth: true,
    description: 'View ownership records',
  },
  'PUT /api/ownerships/update': {
    requiresAuth: true,
    description: 'Update ownership record',
  },
  'PUT /api/ownerships/delete': {
    requiresAuth: true,
    description: 'Delete ownership record',
  },

  // Group routes
  'POST /api/groups/create': {
    requiresAuth: true,
    description: 'Create new group',
  },
  'GET /api/groups/get': {
    requiresAuth: true,
    description: 'View groups',
  },
  'PUT /api/groups/update': {
    requiresAuth: true,
    description: 'Update group',
  },
  'PUT /api/groups/members': {
    requiresAuth: true,
    description: 'Add or remove group members',
  },
  'PUT /api/groups/invite': {
    requiresAuth: true,
    description: 'Get or reset a group invite link token',
  },
  'PUT /api/groups/join': {
    requiresAuth: true,
    description: 'Join a group with an invite token',
  },
  'PUT /api/groups/delete': {
    requiresAuth: true,
    description: 'Delete group',
  },

  // Setlist routes
  'POST /api/setlists/create': {
    requiresAuth: true,
    description: 'Create new setlist',
  },
  'GET /api/setlists/get': {
    requiresAuth: false,
    optionalAuth: true,
    description: 'View setlists',
  },
  'PUT /api/setlists/update': {
    requiresAuth: true,
    description: 'Update setlist',
  },
  'PUT /api/setlists/delete': {
    requiresAuth: true,
    description: 'Delete setlist',
  },

  // Song routes
  'POST /api/songs/create': {
    requiresAuth: true,
    allowedAccessTypes: SONG_WRITERS,
    description: 'Create new song',
  },
  'GET /api/songs/get': {
    requiresAuth: false,
    description: 'View songs (admin view)',
  },
  'GET /api/songs/get-view': {
    requiresAuth: false, // Public view
    description: 'Public song view',
  },
  'PUT /api/songs/update': {
    requiresAuth: true,
    allowedAccessTypes: SONG_WRITERS,
    description: 'Update song',
  },
  'PUT /api/songs/delete': {
    requiresAuth: true,
    allowedAccessTypes: SONG_WRITERS,
    description: 'Delete song',
  },
  'GET /api/songs/search': {
    requiresAuth: false,
    description: 'Search songs',
  },
  'GET /api/songs/import/search': {
    requiresAuth: true,
    allowedAccessTypes: SONG_WRITERS,
    description: 'Search chord sites for a song to import',
  },
  'POST /api/songs/import/fetch': {
    requiresAuth: true,
    allowedAccessTypes: SONG_WRITERS,
    description: 'Fetch and convert a chord chart from an allowlisted chord site',
  },
  'POST /api/songs/import/convert': {
    requiresAuth: true,
    allowedAccessTypes: SONG_WRITERS,
    description: 'Convert pasted chart text to chord-lyrics',
  },
  'GET /api/songs/import/metadata': {
    requiresAuth: true,
    allowedAccessTypes: SONG_WRITERS,
    description: 'Look up key, tempo, time signature, and year for a song to import',
  },
};
