# Database Connection Configuration

## Supabase Connection Types

This project uses Supabase as the database provider. Supabase provides two types of connection strings:

### 1. Pooler Connection (Connection Pooling)
- URL format: `postgresql://[user]:[password]@[project-ref].pooler.supabase.com:5432/postgres`
- Uses PgBouncer for connection pooling
- Better for serverless environments with many short-lived connections
- Can experience intermittent connectivity issues under load

### 2. Direct Connection
- URL format: `postgresql://[user]:[password]@[project-ref].supabase.co:5432/postgres`
- Direct connection to the database
- More stable for long-running connections
- Better for production environments with consistent load

## Current Issues

The application logs show intermittent P1001 errors:
```
Can't reach database server at `aws-0-ap-southeast-1.pooler.supabase.com:5432`
```

This is a known issue with Supabase pooler connections, especially when:
- Connections are idle for too long
- Under high load
- Network latency issues

## Recommendations

### For Development
- The pooler connection is fine for development
- The application handles these errors gracefully by falling back to default configurations

### For Production
1. Consider switching to the direct connection URL
2. Add connection parameters to improve stability:
   ```
   ?connection_limit=10&pool_timeout=30&pgbouncer=true
   ```
3. Monitor connection errors and adjust timeout settings as needed

## Error Handling

The application has comprehensive error handling for database connection issues:
- Agents fall back to default configurations when database is unreachable
- Connection errors are logged but don't crash the application
- The system continues to function with default settings

## Switching Connection Types

To switch from pooler to direct connection:
1. Go to your Supabase project settings
2. Navigate to Database settings
3. Copy the "Connection string" (not "Connection pooling")
4. Update your `.env` file with the new DATABASE_URL