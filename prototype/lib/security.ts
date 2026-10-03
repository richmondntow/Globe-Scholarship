export function validWrite(request: Request) {
 const origin = request.headers.get('origin');
 if (origin && origin !== new URL(request.url).origin) return false;
 return request.headers.get('content-type')?.includes('application/json') ?? false;
}
export const noStore = {'Cache-Control':'private, no-store'};
export function json(value: unknown, status=200) { return Response.json(value,{status,headers:noStore}); }
