# Infrastructure Setup

This project supports **AWS** and **Cloudflare** infrastructure. Use one or both depending on customer requirements.

## Provisioning

Terraform templates live in `infra/terraform` and create:
- AWS: S3 bucket + SQS queue
- Cloudflare: R2 bucket + Queues queue

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

## Environment Variables

### Storage

**AWS (S3)**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`

**Cloudflare (R2)**
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_ENDPOINT` (e.g. `https://<account-id>.r2.cloudflarestorage.com`)

### Queues

**AWS (SQS)**
- `AWS_SQS_QUEUE_URL`
- `AWS_SQS_QUEUE_NAME`

**Cloudflare Queues**
- `CLOUDFLARE_QUEUE_NAME`

## Notes

- Cloudflare R2 credentials are generated in the Cloudflare dashboard under R2 → Manage R2 API Tokens.
- AWS credentials should be scoped to S3 + SQS only for least privilege.
