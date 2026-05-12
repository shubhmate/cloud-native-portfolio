/* =========================================================================
   CONTACT FORM SERVERLESS BACKEND
   =========================================================================
   This file provisions the AWS Lambda function and API Gateway required 
   to handle portfolio inquiries via the Brevo API securely.
   ========================================================================= */

# 1. Zip the Lambda Source Code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../src/lambda/contact-form/index.js"
  output_path = "${path.module}/contact_form_lambda.zip"
}

# 2. IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "portfolio_contact_form_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(var.tags, {
    Name = "portfolio-lambda-role"
  })
}

# 3. Basic CloudWatch Logging Permissions
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 3.5 DynamoDB Write Permissions (Least Privilege)
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "portfolio_lambda_dynamodb_write"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.portfolio_leads.arn
      }
    ]
  })
}

# 4. Lambda Function
# Log Group for Lambda (with retention to save costs)
resource "aws_cloudwatch_log_group" "contact_form" {
  name              = "/aws/lambda/${aws_lambda_function.contact_form.function_name}"
  retention_in_days = 14
  tags              = merge(var.tags, { Name = "/aws/lambda/portfolio-contact-handler" })
}

resource "aws_lambda_function" "contact_form" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "portfolio-contact-handler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      # We pull the API Key from a local variable or placeholder
      # In a real CI/CD, this would come from a secret manager
      BREVO_API_KEY = var.brevo_api_key
    }
  }

  tags = merge(var.tags, {
    Name = "portfolio-contact-handler"
  })
}

# 5. API Gateway (HTTP API - v2)
resource "aws_apigatewayv2_api" "lambda" {
  name          = "portfolio-contact-api"
  protocol_type = "HTTP"

  tags = merge(var.tags, {
    Name = "portfolio-contact-api"
  })

  cors_configuration {
    allow_origins = ["*"] # We can restrict this to your domain later
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "lambda" {
  api_id      = aws_apigatewayv2_api.lambda.id
  name        = "$default"
  auto_deploy = true

  # Throttling (Rate Limiting) to prevent abuse/spam
  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }

  tags = merge(var.tags, {
    Name = "portfolio-contact-stage"
  })
}

resource "aws_apigatewayv2_integration" "contact_form" {
  api_id             = aws_apigatewayv2_api.lambda.id
  integration_uri    = aws_lambda_function.contact_form.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "contact_form" {
  api_id    = aws_apigatewayv2_api.lambda.id
  route_key = "POST /contact"
  target    = "integrations/${aws_apigatewayv2_integration.contact_form.id}"
}

# 6. Allow API Gateway to invoke Lambda
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.contact_form.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

