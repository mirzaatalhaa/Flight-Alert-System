terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }

    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.5"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

resource "aws_sns_topic" "flight_alerts" {
  name = "skytracker-flight-alerts"
}

resource "aws_dynamodb_table" "alert_rules" {
    name = "AlertRules"
    billing_mode = "PAY_PER_REQUEST"

    hash_key = "ruleId"

    attribute {
        name = "ruleId"
        type = "S"
    }
}

resource "aws_dynamodb_table" "alerted_aircraft" {
  name         = "AlertedAircraft"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "registration"

  attribute {
    name = "registration"
    type = "S"
  }
}