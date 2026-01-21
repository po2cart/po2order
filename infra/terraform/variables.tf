variable "project_name" {
  type        = string
  description = "Project name used for resource naming"
  default     = "po2order"
}

variable "environment" {
  type        = string
  description = "Environment name (dev|staging|prod)"
  default     = "dev"
}

variable "enable_aws" {
  type        = bool
  description = "Whether to provision AWS resources"
  default     = true
}

variable "enable_cloudflare" {
  type        = bool
  description = "Whether to provision Cloudflare resources"
  default     = true
}

variable "aws_region" {
  type        = string
  description = "AWS region for S3/SQS"
  default     = "us-east-1"
}

variable "aws_s3_bucket_name" {
  type        = string
  description = "S3 bucket name for document storage"
  default     = ""
}

variable "aws_sqs_queue_name" {
  type        = string
  description = "SQS queue name for async processing"
  default     = ""
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
  default     = ""
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token"
  default     = ""
}

variable "r2_bucket_name" {
  type        = string
  description = "R2 bucket name for document storage"
  default     = ""
}

variable "cloudflare_queue_name" {
  type        = string
  description = "Cloudflare queue name for async processing"
  default     = ""
}
