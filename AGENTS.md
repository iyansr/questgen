use pnpm

NEVER DO MANUAL MIGRATIONS, ALWAYS USE DRIZZLE COMMAND

Always use `lexa` to find in codebase

### WEB API Services Pattern
- Use `ky` (project uses ky via `@/services/fetcher`)
- Export async functions with descriptive names
- Use TanStack Query (React Query) for server state
- Define query keys in `@/services/api/query-keys.ts`

Example:
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/fetcher';
import { QUERY_KEYS } from '../query-keys';

export async function getProducts() {
  const data = await api.get('/products').json<Product[]>();
  return data;
}

export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: getProducts,
  });
}
```
