locals {
  aws_s3_bucket_name  = var.aws_s3_bucket_name != "" ? var.aws_s3_bucket_name : "${var.project_name}-${var.environment}-documents"
  aws_sqs_queue_name  = var.aws_sqs_queue_name != "" ? var.aws_sqs_queue_name : "${var.project_name}-${var.environment}-processing"
  r2_bucket_name      = var.r2_bucket_name != "" ? var.r2_bucket_name : "${var.project_name}-${var.environment}-documents"
  cloudflare_queue    = var.cloudflare_queue_name != "" ? var.cloudflare_queue_name : "${var.project_name}-${var.environment}-processing"
}

resource "aws_s3_bucket" "documents" {
  count  = var.enable_aws ? 1 : 0
  bucket = local.aws_s3_bucket_name

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  count  = var.enable_aws ? 1 : 0
  bucket = aws_s3_bucket.documents[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  count  = var.enable_aws ? 1 : 0
  bucket = aws_s3_bucket.documents[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  count  = var.enable_aws ? 1 : 0
  bucket = aws_s3_bucket.documents[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_sqs_queue" "processing" {
  count = var.enable_aws ? 1 : 0
  name  = local.aws_sqs_queue_name

  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "cloudflare_r2_bucket" "documents" {
  count      = var.enable_cloudflare ? 1 : 0
  account_id = var.cloudflare_account_id
  name       = local.r2_bucket_name
}

resource "cloudflare_queue" "processing" {
  count      = var.enable_cloudflare ? 1 : 0
  account_id = var.cloudflare_account_id
  name       = local.cloudflare_queue
}
