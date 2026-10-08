# VNFundme on GitHub Codespaces or Docker

The Compose stack uses the external PostgreSQL database configured by
`backend/.env`; it does not start a local PostgreSQL container. MinIO runs with
the AIStor image. The backend reads database, JWT, and payment settings from
`backend/.env`.

Create the ignored environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp .env.docker.example .env
```

Set the real database URL, JWT secrets, and payment settings in
`backend/.env`. Keep `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in the root
`.env` synchronized with `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in
`backend/.env`.

## GitHub Codespaces

The dev container forwards ports 8080 (frontend), 3000 (backend), 9002 (MinIO
API), and 9003 (MinIO console). After creating the environment files, use the
forwarded URLs for these settings before building:

- Root `.env`: set `VITE_API_URL` to the forwarded backend URL and
  `MINIO_PUBLIC_URL` to the forwarded MinIO API URL.
- `backend/.env`: set `CORS_ORIGINS` and `FRONTEND_URL` to the forwarded
  frontend URL, and `VNPAY_RETURN_URL` to the appropriate forwarded return URL.

Codespaces URLs have the form
`https://<codespace-name>-<port>.app.github.dev`. For example, use port 3000
for the backend and port 9002 for MinIO. Rebuild after changing
`VITE_API_URL`, since it is embedded into the frontend during the image build.

Start or rebuild the stack with:

```bash
docker compose up --build
```

Local Docker URLs:

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Swagger: http://localhost:3000/api
- MinIO API/public files: http://localhost:9002
- MinIO console: http://localhost:9003

Useful commands:

```bash
docker compose up --build
docker compose down
docker compose down -v
docker compose logs -f backend
```

`docker compose down -v` deletes the MinIO volume. The backend runs
`prisma migrate deploy` against the configured external database on startup.
