declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_ALLOW_LOCAL?: string;
    BUCKET?: R2Bucket;
  }
}
