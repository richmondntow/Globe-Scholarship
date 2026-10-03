import { validOrigin } from './server-origin';
export function validWrite(request: Request) {
 if (!validOrigin(request)) return false;
 return request.headers.get('content-type')?.includes('application/json') ?? false;
}
export const noStore = {'Cache-Control':'private, no-store'};
export function json(value: unknown, status=200) { return Response.json(value,{status,headers:noStore}); }
