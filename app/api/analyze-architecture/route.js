import { NextResponse } from "next/server";

const TERRAFORM_PROMPT = `You are an expert AWS Solutions Architect and Terraform engineer. Your task is to analyze an architecture diagram and generate focused Terraform HCL code for AWS — only for the services that are EXPLICITLY present in the diagram.

DIAGRAM FORMAT:
- If the content starts with "{" it is an Excalidraw JSON file. Elements are in the "elements" array. Each element has a "type" (rectangle, ellipse, diamond, arrow, text, etc.), a "label" or "text" field, and connections via "boundElements" / arrow endpoints.
- If the content starts with "<" it is a draw.io XML file. Resources are <mxCell> elements with "value" (label) and "style" attributes. The style may contain shape names like "shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2". Arrows/edges connect resources.

STEP 1 — IDENTIFY SERVICES (STRICT):
List only the AWS services that are visually present as shapes or icons in the diagram. Do NOT infer, assume, or add supporting infrastructure (like VPC, subnets, internet gateways, route tables, security groups, NAT gateways) unless they are explicitly drawn as their own labeled shapes.

STEP 2 — MAP CONNECTIONS:
For each arrow or edge in the diagram, note which two resources it connects. These become depends_on or resource references in Terraform.

STEP 3 — GENERATE FILES (one .tf file per AWS service type identified):
- Always generate a "main.tf" with ONLY the terraform {} block, required_providers, provider "aws", and shared variables (aws_region, environment, project_name).
- For every distinct AWS service found in the diagram, generate one separate file named after the service in snake_case, e.g. "dynamodb.tf", "kinesis.tf", "glue.tf", "lambda.tf", "s3.tf", etc.
- Each service file contains ONLY the resource blocks for that service plus its IAM role/policy if required for the service to function (e.g. Lambda needs an execution role, ECS needs a task role). Do NOT add other service files.
- Reference cross-resource dependencies using Terraform references (e.g. aws_dynamodb_table.main.arn).
- CRITICAL: Do NOT generate a file for any service that is NOT present in the diagram. Do NOT output placeholder files, comment-only files, or files saying "No X resources drawn". If a service is absent, simply do not include its file at all.

PER-SERVICE RESOURCE RULES (generate ONLY the minimum needed resources):
- DynamoDB → aws_dynamodb_table only. Do NOT add DAX, backup policies, or streams unless explicitly drawn.
- Kinesis Data Streams → aws_kinesis_stream only.
- Glue / Data Catalog → aws_glue_catalog_database, aws_glue_catalog_table (or aws_glue_crawler if drawn). Do NOT add crawlers, jobs, or connections unless drawn.
- S3 → aws_s3_bucket only. Add aws_s3_bucket_versioning only if versioning is annotated in the diagram.
- Lambda → aws_lambda_function + aws_iam_role (execution role) + aws_iam_role_policy_attachment. Do NOT add VPC config unless a VPC is drawn.
- RDS → aws_db_instance only. Do NOT add aws_db_subnet_group or security groups unless a VPC or subnet is drawn.
- SQS → aws_sqs_queue only.
- SNS → aws_sns_topic only. Add aws_sns_topic_subscription only if a subscriber is connected by an arrow.
- EC2 → aws_instance + aws_security_group (with minimal ingress/egress). Do NOT add VPC, subnets, or route tables unless they are drawn.
- VPC (only if explicitly drawn) → aws_vpc + aws_subnet for each subnet drawn + aws_internet_gateway if an IGW shape is present.
- API Gateway → aws_api_gateway_rest_api + aws_api_gateway_deployment only.
- ECS → aws_ecs_cluster + aws_ecs_task_definition + aws_ecs_service + aws_iam_role.
- CloudFront → aws_cloudfront_distribution only.
- ElastiCache → aws_elasticache_cluster only.

Add an outputs block in each file exposing the key ARN, ID, or URL for each resource in that file.
Use descriptive Terraform resource names derived from the diagram labels (lowercase, underscored).
Add inline comments (# ...) only for non-obvious configurations.

OUTPUT FORMAT — use this exact delimiter between files:
=== FILE: <filename.tf> ===
<HCL content>

Example:
=== FILE: main.tf ===
terraform {
  ...
}
=== FILE: dynamodb.tf ===
resource "aws_dynamodb_table" "events" {
  ...
}

If the diagram contains no recognizable AWS resources, output only:
=== FILE: main.tf ===
# No AWS resources were identified in the diagram.
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}
variable "aws_region" { default = "us-east-1" }
provider "aws" { region = var.aws_region }

Output ONLY the delimited files. No markdown, no code fences, no explanations outside of HCL comments.`;

function parseFiles(text) {
    // Strip any markdown code fences the model may have added
    const cleaned = text
        .replace(/^```(?:hcl|terraform|tf)?\s*/gim, "")
        .replace(/^```\s*$/gim, "")
        .trim();

    const delimiter = /^=== FILE: (.+?) ===/m;
    const parts = cleaned.split(/^=== FILE: .+? ===/m);
    const headers = [...cleaned.matchAll(/^=== FILE: (.+?) ===/gm)];

    if (headers.length === 0) {
        // Fallback: model returned plain HCL without delimiters — treat as main.tf
        return [{ filename: "main.tf", content: cleaned }];
    }

    return headers.map((match, i) => ({
        filename: match[1].trim(),
        content: (parts[i + 1] ?? "").trim(),
    })).filter((f) => {
        if (!f.content) return false;
        // Drop files that contain no actual HCL blocks — only comments / whitespace
        const withoutComments = f.content.replace(/#[^\n]*/g, "").trim();
        return withoutComments.length > 0;
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { content, format } = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                { error: "Conteúdo do diagrama não fornecido." },
                { status: 400 }
            );
        }

        if (!["excalidraw", "drawio"].includes(format)) {
            return NextResponse.json(
                { error: "Formato inválido. Envie 'excalidraw' ou 'drawio'." },
                { status: 400 }
            );
        }

        // Limit diagram size to avoid excessive token usage
        if (content.length > 500_000) {
            return NextResponse.json(
                { error: "Diagrama muito grande. Limite de 500 KB." },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    error:
                        "GEMINI_API_KEY não configurada. Adicione GEMINI_API_KEY ao .env.local para usar esta funcionalidade.",
                },
                { status: 503 }
            );
        }

        const userMessage = `DIAGRAM FORMAT: ${format.toUpperCase()}\n\nDIAGRAM CONTENT:\n${content}`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: TERRAFORM_PROMPT },
                                { text: userMessage },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 8192,
                    },
                }),
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error("Gemini API error:", geminiRes.status, errText);
            return NextResponse.json(
                { error: "Erro ao chamar a API do Gemini. Verifique sua chave e tente novamente." },
                { status: 502 }
            );
        }

        const geminiData = await geminiRes.json();
        const rawText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (!rawText) {
            return NextResponse.json(
                { error: "A IA não retornou conteúdo. Tente novamente." },
                { status: 502 }
            );
        }

        const files = parseFiles(rawText);

        return NextResponse.json({ files });
    } catch (err) {
        console.error("analyze-architecture error:", err);
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}
