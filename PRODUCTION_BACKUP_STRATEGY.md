# Production Backup Strategy

This document defines the backup, recovery, and rollback strategy for the production environment.

## Scope

- MongoDB data used by the backend application.
- Production environment secrets and configuration values.
- Recovery steps after accidental data loss, corruption, or failed deployment.
- Deployment rollback procedure for the current Render-based setup.

## Security Principles

- Never store raw secrets in the repository.
- Never paste secret values into tickets, chat, logs, or documentation.
- Backup metadata may be documented, but secret contents must remain encrypted and access-controlled.
- Use least-privilege access for backup operators.

## 1) MongoDB Backup Strategy

### Backup method

Primary data store is MongoDB, accessed through `MONGO_URI`. In production, use an automated MongoDB backup mechanism appropriate to the hosting plan:

- Preferred: MongoDB Atlas automated backups / snapshots.
- Additional safeguard: scheduled logical exports for critical collections when required for operational recovery.

### Backup frequency

- Automated snapshot backups: daily minimum.
- Retention: at least 7 days for short-term recovery; longer retention if compliance requires it.
- Before high-risk changes:
  - database migrations
  - bulk imports/updates
  - major application releases

### Backup content

Back up the full production database, including application collections and their indexes. Ensure the backup process preserves:

- users
- tools
- categories
- content and settings collections
- logs or audit-related collections if they are part of the production database

### Backup validation

At least once per week:

- Restore the latest backup into a non-production environment.
- Validate collection counts and sample records.
- Confirm the application can connect to the restored database.

### Access control

- Limit backup access to administrators and deployment maintainers.
- Store backup credentials separately from application secrets.
- Restrict restore permissions to authorized operators only.

## 2) Environment Secrets Backup Strategy

### What must be backed up

Production secrets and environment configuration should be backed up as encrypted configuration, not in plaintext source control.

Examples of protected values in this project include:

- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `RESEND_API_KEY`
- `SMTP_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Storage approach

- Keep the authoritative production environment variables in the hosting platform’s secret manager.
- Maintain an encrypted offline record for disaster recovery, stored in a restricted location.
- Keep `.env.example` as the non-sensitive template only.

### Recommended handling

- Export environment variables only into encrypted backups.
- Do not commit `.env` files.
- Rotate secrets if a backup store is suspected to be compromised.
- Keep a secure inventory of which secrets are required for startup and deployment.

### Validation

The backend already validates required variables on startup, so after a restore or redeploy, confirm:

- `MONGO_URI` is present and valid
- `JWT_SECRET` meets the required length
- admin credentials are set
- Cloudinary credentials are configured
- production `CORS_ORIGIN` is present

## 3) Recovery Procedure

Use this procedure for accidental deletion, corruption, failed migration, or partial data loss.

### Recovery steps

1. Declare the incident and stop any write-heavy jobs or deployments.
2. Identify the latest known-good MongoDB backup.
3. Restore the backup into a staging or temporary database first.
4. Validate:
   - application start-up
   - data counts for key collections
   - critical user flows
   - admin authentication
5. If validation passes, restore into production during an approved maintenance window.
6. Re-run health checks after restore.
7. Record the incident, backup point used, and any data gaps.

### Recovery checklist

- Confirm the correct backup date/time.
- Confirm the target database name.
- Confirm the correct production `MONGO_URI` is pointed to the restored instance.
- Confirm all required environment secrets are available.
- Verify the frontend still points to the correct backend URL.

### Post-recovery verification

- `GET /api/health` returns healthy status.
- Database connection is active.
- Core pages and admin flows load normally.
- No unexpected errors appear in logs.

## 4) Deployment Rollback Procedure

### Rollback triggers

Rollback immediately if a new deployment causes:

- API failures
- startup failures
- broken authentication
- corrupted or missing data presentation
- repeated 5xx responses
- database incompatibility after deployment

### Application rollback on Render

For the current deployment setup:

1. Open the Render service for the backend or frontend.
2. Select the last known-good deployment.
3. Redeploy the previous release.
4. Verify the health check endpoint and browser smoke tests.

### Rollback dependencies

- If the deployment changed environment variables, restore the previous secret values first.
- If the deployment changed database schema or data shape, check whether a database restore is also required.
- If the frontend release is broken but the backend is healthy, roll back only the frontend.
- If the backend release is broken, roll back the backend service and re-test the frontend.

### Rollback verification

- `GET /api/health` passes.
- Authentication works.
- Main public pages render successfully.
- Admin actions load and save as expected.
- No new errors are introduced in logs.

## 5) Operational Runbook

### Daily

- Confirm backup jobs completed successfully.
- Review error logs for database or secret-related issues.

### Weekly

- Test restore into a non-production environment.
- Confirm backup retention and access permissions.

### Before each release

- Take a fresh backup if the release includes data or schema changes.
- Confirm secrets are present in the deployment platform.
- Document the rollback target.

## 6) Minimum RPO / RTO Targets

- RPO: no more than 24 hours for standard operations, less if backups are taken more frequently.
- RTO: restore service as quickly as possible after validation, ideally within the same maintenance window.

## 7) Ownership

- Database backups: infrastructure or backend maintainer.
- Secret backup and rotation: platform administrator.
- Restore approval: service owner or incident lead.
- Rollback execution: deployment maintainer.

## 8) Notes for This Repository

- Backend environment variables are validated at startup in `backend/server/utils/envValidation.js`.
- Production deployment is defined in `render.yaml`.
- `.env` values are not committed; use `.env.example` only as a template.
- MongoDB access is configured through `MONGO_URI`.

## 9) Do Not

- Do not commit real secrets.
- Do not store unencrypted backups of secrets.
- Do not restore directly to production without first validating a restore in a safe environment when possible.
- Do not roll back blindly without checking whether the database also needs to be restored.
