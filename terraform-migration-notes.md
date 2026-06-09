# Terraform Migration Notes -- Flight Alert System

## Project Goal

Migrate an existing AWS serverless Flight Alert System from manually
managed AWS resources to Infrastructure as Code (Terraform).

## Original Architecture

EventBridge Scheduler → skytracker-alert-processor Lambda → AlertRules
DynamoDB Table → AlertedAircraft DynamoDB Table → SNS Topic → Email
Notifications

------------------------------------------------------------------------

## Resources Migrated to Terraform

### SNS Topic

-   Resource: skytracker-flight-alerts
-   Imported using Terraform import
-   Verified with `terraform plan`

### DynamoDB Tables

#### AlertRules

-   Partition Key: ruleId
-   Billing Mode: PAY_PER_REQUEST

#### AlertedAircraft

-   Partition Key: registration
-   Billing Mode: PAY_PER_REQUEST

### IAM Role

-   Role: skytracker-alert-processor-role-w2mzdguz
-   Learned trust policy vs permissions policy
-   Fixed drift caused by IAM path mismatch (`/service-role/`)

### EventBridge Scheduler

-   Schedule: skytracker-flight-alert-schedule
-   Expression: `rate(5 minutes)`
-   Fixed drift caused by retry policy mismatch

### Remote State Backend

-   Backend: Amazon S3
-   Bucket: flight-alert-terraform-state-mtb
-   State migrated from local machine to S3

------------------------------------------------------------------------

## Key Terraform Concepts Learned

### Terraform State

Terraform state maps Terraform resources to real AWS resources and acts
as Terraform's memory.

### Resource Import

Used Terraform import to bring existing AWS resources under Terraform
management.

### Drift Detection

Used `terraform plan` to compare: - Terraform Configuration - Terraform
State - Actual AWS Infrastructure

### Remote State

Moved local state into S3 to support production-style workflows.

### IAM Concepts

Learned: - Trust Policies - Permission Policies - Least Privilege Access

------------------------------------------------------------------------

## Useful Commands

``` bash
terraform init
terraform validate
terraform plan
terraform import
terraform state list
terraform state show
```

------------------------------------------------------------------------

## Problems Encountered

### IAM Role Replacement

Terraform wanted to replace the imported IAM role.

Cause: - Path mismatch

Fix:

``` hcl
path = "/service-role/"
```

### Scheduler Drift

Terraform wanted to modify retry settings.

Fix:

``` hcl
retry_policy {
  maximum_event_age_in_seconds = 86400
  maximum_retry_attempts       = 0
}
```

------------------------------------------------------------------------

## Current Status

Managed by Terraform:

-   SNS Topic
-   AlertRules Table
-   AlertedAircraft Table
-   Lambda Execution IAM Role
-   EventBridge Scheduler
-   Remote Terraform State Backend

Remaining: - Terraform-managed Lambda deployment - Scheduler invocation
role (optional cleanup)

Approximate migration progress: 90%
