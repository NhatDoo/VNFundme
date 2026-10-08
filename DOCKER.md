# VNFundme Docker

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Swagger: http://localhost:3000/api
- MinIO API/public files: http://localhost:9002
- MinIO console: http://localhost:9003
- PostgreSQL: localhost:5432

The backend runs `prisma migrate deploy` on startup before starting NestJS.

To customize ports, passwords, JWT secrets, VNPAY keys, or public URLs, create a root `.env` file using `.env.docker.example` as the template. If the app is opened from another computer on the network, set `VITE_API_URL`, `CORS_ORIGINS`, `FRONTEND_URL`, `VNPAY_RETURN_URL`, and `MINIO_PUBLIC_URL` to that machine's reachable host/IP before rebuilding.

Useful commands:

```bash
docker compose up --build
docker compose down
docker compose down -v
docker compose logs -f backend
```

`docker compose down -v` deletes the PostgreSQL and MinIO volumes.
