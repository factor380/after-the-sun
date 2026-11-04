/**
 * The slice of the Supabase server client this app calls.
 * The test harness returns the same shape and never opens a network connection.
 */
export type ServerSupabaseUser = {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string; name?: string };
};

export type ServerSupabase = {
  auth: {
    getUser: () => Promise<{
      data: { user: ServerSupabaseUser | null };
      error: { message: string } | null;
    }>;
    exchangeCodeForSession: (code: string) => Promise<{
      data: { user: ServerSupabaseUser | null };
      error: { message: string } | null;
    }>;
  };
  storage: {
    from: (bucket: string) => {
      upload: (
        objectPath: string,
        body: Uint8Array,
        options: {
          contentType?: string;
          upsert?: boolean;
          cacheControl?: string;
        },
      ) => Promise<{ error: { message: string } | null }>;
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
      getPublicUrl: (objectPath: string) => { data: { publicUrl: string } };
    };
  };
};
