# POtoOrder Infrastructure (Terraform)

This folder provisions the minimum AWS + Cloudflare resources needed for POtoOrder:
- **AWS S3** bucket for document storage (optional)
- **AWS SQS** queue for async processing (optional)
- **Cloudflare R2** bucket for document storage (optional)
- **Cloudflare Queues** queue for async processing (optional)

## Prerequisites

- Terraform >= 1.6
- AWS credentials configured via `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
- Cloudflare API token with access to R2 + Queues

## Quick Start

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

## Configuration

`terraform.tfvars` controls naming and which providers are enabled.

- Set `enable_aws = false` if you only want Cloudflare resources.
- Set `enable_cloudflare = false` if you only want AWS resources.

## Outputs

After apply, Terraform prints bucket and queue identifiers that map to `.env` values.
