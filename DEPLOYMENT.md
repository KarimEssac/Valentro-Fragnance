# Production deployment

The store is hosted at https://valentro-fragrance.com on a Hostinger KVM 1 VPS in Paris, running Ubuntu 24.04 LTS.

## Publishing changes

This workspace already uses `https://github.com/KarimEssac/Valentro-Fragnance.git` as its `origin`. Commit and push changes to `main` to publish them. Saving a local file alone does not publish it.

The VPS checks `main` about once a minute. A new commit triggers a Linux Docker build with Node.js 24, Prisma generation, and a Next.js standalone production build. Build time is additional to the polling interval. The existing application stays running while the replacement image builds. A failed build or health check does not become the deployed revision.

The VPS deployment scripts and production configuration live in `/opt/valentro`. Authentication secrets and provider keys are stored there separately from this public repository. Never commit `.env`, database exports, or credentials.

## Services and data

- Caddy serves HTTPS and redirects `www.valentro-fragrance.com` to the main domain.
- The Next.js container runs as a non-root user. Only its production output and required runtime dependencies are included in the running image.
- PostgreSQL 18 uses a persistent Docker volume and has no published public port.
- The initial production import contains the existing catalog and admin account. Customer accounts, orders, addresses, newsletter subscriptions, restock requests, and customer reviews were excluded. The local database was not changed.
- Product images remain in the existing Cloudinary account.
- Database backups run daily at 02:00 UTC and before subsequent deployments, under `/opt/valentro/backups`. Hostinger's weekly VPS backups are separate. Copy database backups off the VPS for independent recovery.

Production email uses the verified Resend domain `valentro-fragrance.com` and sends from `Valentro <admins@valentro-fragrance.com>`. `ORDER_NOTIFICATION_EMAIL` points to the store's notification inbox in the private production configuration. Namecheap forwards incoming mail for the `admins` alias to that inbox without a paid mailbox. Development email settings remain separate from production.

## Operations

Open Hostinger's VPS Web Console to inspect the deployment:

```bash
cd /opt/valentro
docker compose ps
docker compose logs --tail=50 app
journalctl -u valentro-deploy.service -n 50 --no-pager
systemctl list-timers valentro-deploy.timer valentro-backup.timer
```

To request a deployment immediately:

```bash
systemctl start valentro-deploy.service
```

The deployment service serializes builds, backs up the database, applies committed Prisma migrations, checks the new application's health, and records the successful Git revision. Keep schema changes compatible with the previous application version so rollback remains possible. Never run the development seed against production: it deletes existing records.
