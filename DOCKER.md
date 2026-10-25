# VNFundme on GitHub Codespaces or Docker

The Compose stack uses the external PostgreSQL database configured by
`backend/.env`; it does not start a local PostgreSQL container. RustFS provides
the S3-compatible image storage. The backend reads database, JWT, and payment
settings from `backend/.env`. The backend uses host networking so it can use
the Codespace's working DNS resolver; this setup requires a Linux Docker host.

Create the ignored environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp .env.docker.example .env
```

Set the real database URL, JWT secrets, and payment settings in
`backend/.env`. Keep `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in the root
`.env` synchronized with `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in
`backend/.env`; these credentials are used by RustFS and the backend's S3
client. The frontend uses the same-origin `/api` and `/storage` proxy paths by
default, so it does not need a Codespaces-specific API URL.

The first RustFS startup uses a new `rustfs_data` volume. The previous AIStor
volume (`vnfundme_minio_data`) is retained and left untouched for recovery.
Do not run `docker compose down -v` during this migration: it deletes both
storage volumes. Image records in PostgreSQL remain unchanged; re-upload any
images whose object files are not present in the new RustFS bucket.

## GitHub Codespaces

The dev container forwards ports 8080 (frontend), 3000 (backend), 9002 (RustFS
S3 API), and 9003 (RustFS console). The frontend proxies API and image requests
through its own origin, avoiding browser CORS and port-URL configuration.

Codespaces URLs have the form
`https://<codespace-name>-<port>.app.github.dev`. For example, use port 3000
for the backend and port 9002 for RustFS. For VNPay, set `FRONTEND_URL` in
`backend/.env` to the forwarded port 8080 URL and set
`VNPAY_RETURN_URL` to that same URL followed by
`/api/payment/vnpay/return`. Nginx routes this callback to the backend, which
then redirects the browser to `/payment-result` on the forwarded frontend
origin. Do not set the VNPay return URL to `localhost`, port 5173, or
`/payment-result` directly.

Rebuild after changing `VITE_API_URL`, since it is embedded into the frontend
during the image build. Recreate the backend container after changing
`backend/.env` so it picks up the updated payment URLs.

Start or rebuild the stack with:

```bash
docker compose up --build
```

Local Docker URLs:

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Swagger: http://localhost:3000/api
- RustFS S3 API/public files: http://localhost:9002
- RustFS console: http://localhost:9003

Useful commands:

```bash
docker compose up --build
docker compose down
docker compose down -v
docker compose logs -f backend
```

`docker compose down -v` deletes both RustFS data and the retained AIStor
volume. The backend runs `prisma migrate deploy` against the configured
external database on startup.
