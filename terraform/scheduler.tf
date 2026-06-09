resource "aws_scheduler_schedule" "flight_alert_schedule" {
  name = "skytracker-flight-alert-schedule"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "rate(5 minutes)"
  schedule_expression_timezone = "Asia/Calcutta"
  state                        = "ENABLED"

  target {
    arn      = "arn:aws:lambda:ap-south-1:424322298959:function:skytracker-alert-processor"
    role_arn = "arn:aws:iam::424322298959:role/service-role/Amazon_EventBridge_Scheduler_LAMBDA_f932536190"

    input = "{}"

    retry_policy {
            maximum_event_age_in_seconds = 86400
            maximum_retry_attempts       = 0
        }
  }
}