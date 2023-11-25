export interface Env {
	ACCESS_KEY_ID: string,
	SECRET_ACCESS_KEY: string,
	ALLOWED_BUCKETS: string,
	DOWNLOAD: R2Bucket
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		switch (request.method) {
			case 'GET':
				const allowedBuckets = env.ALLOWED_BUCKETS.split(',').map(bucketName => bucketName.trim());
				const url = new URL(request.url);
				const pathParts = url.pathname.slice(1).split('/')
				const bucketName = pathParts[0];
				if (!isBucketAccessAllowed(allowedBuckets, bucketName)) {
					return new Response(
						'Bucket doesn\'t exists',
						{
							status: 404
						}
					);
				}

				const objectName = pathParts[1];

				const r2ListOptions: R2ListOptions = {
					prefix: url.searchParams.get('prefix') ?? undefined,
					delimiter: url.searchParams.get('delimiter') ?? undefined,
					cursor: url.searchParams.get('cursor') ?? undefined,
				}

				const listing = await env.DOWNLOAD.list(r2ListOptions);
				return new Response(
					JSON.stringify(listing), 
					{
						headers: {
							'content-type': 'application/json; charset=UTF-8',
						}
					}
				);
			default:
				return new Response('Method not allowed', {
					status: 405
				});
		}
	}
};

function isBucketAccessAllowed(allowedBuckets: string[], bucketAccessing: string): boolean {
	return allowedBuckets.includes(bucketAccessing) || allowedBuckets.includes(`${bucketAccessing}-preview`);
}
