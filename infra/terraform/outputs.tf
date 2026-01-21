output "aws_s3_bucket_name" {
  value       = var.enable_aws ? aws_s3_bucket.documents[0].bucket : null
  description = "S3 bucket name for document storage"
}

output "aws_s3_bucket_arn" {
  value       = var.enable_aws ? aws_s3_bucket.documents[0].arn : null
  description = "S3 bucket ARN"
}

output "aws_sqs_queue_url" {
  value       = var.enable_aws ? aws_sqs_queue.processing[0].url : null
  description = "SQS queue URL"
}

output "cloudflare_r2_bucket_name" {
  value       = var.enable_cloudflare ? cloudflare_r2_bucket.documents[0].name : null
  description = "R2 bucket name"
}

output "cloudflare_queue_name" {
  value       = var.enable_cloudflare ? cloudflare_queue.processing[0].name : null
  description = "Cloudflare queue name"
}
