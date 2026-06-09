terraform {
  backend "s3" {
    bucket = "flight-alert-terraform-state-mtb"
    key    = "flight-alert-system/terraform.tfstate"
    region = "ap-south-1"
  }
}