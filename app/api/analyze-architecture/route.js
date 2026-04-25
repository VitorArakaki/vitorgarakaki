import { NextResponse } from "next/server";

const TERRAFORM_PROMPT = `You are an expert AWS Solutions Architect and Terraform engineer. Your task is to analyze an architecture diagram (provided as raw file content) and generate complete, production-ready Terraform HCL code for AWS.

DIAGRAM FORMAT:
- If the content starts with "{" it is an Excalidraw JSON file. Elements are in the "elements" array. Each element has a "type" (rectangle, ellipse, diamond, arrow, text, etc.), a "label" or "text" field, and connections via "boundElements" / arrow endpoints.
- If the content starts with "<" it is a draw.io XML file. Resources are <mxCell> elements with "value" (label) and "style" attributes. The style may contain shape names like "shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2". Arrows/edges connect resources.

ANALYSIS STEPS:
1. Identify every distinct AWS resource from shape labels, style names, and text annotations.
2. Map all connections (arrows/edges) between resources — these represent dependencies, data flow, or network paths.
3. Infer sensible default configurations for each resource based on AWS best practices.
4. Determine the required IAM roles, policies, and instance profiles.

TERRAFORM OUTPUT RULES:
- Start with a terraform {} block specifying required_providers (aws provider, version ~> 5.0).
- Add a provider "aws" block with region defaulting to a variable var.aws_region.
- Declare all variables at the top (aws_region, environment, project_name, and any resource-specific variables).
- For each identified AWS service generate the appropriate resource block(s):
  * EC2 → aws_instance, aws_security_group, aws_key_pair (if needed)
  * S3 → aws_s3_bucket, aws_s3_bucket_versioning, aws_s3_bucket_server_side_encryption_configuration
  * RDS → aws_db_instance, aws_db_subnet_group, aws_security_group
  * Lambda → aws_lambda_function, aws_iam_role, aws_iam_role_policy_attachment, aws_cloudwatch_log_group
  * VPC → aws_vpc, aws_subnet (public/private), aws_internet_gateway, aws_route_table, aws_route_table_association
  * API Gateway → aws_api_gateway_rest_api, aws_api_gateway_resource, aws_api_gateway_method, aws_api_gateway_integration, aws_api_gateway_deployment
  * ECS → aws_ecs_cluster, aws_ecs_task_definition, aws_ecs_service, aws_iam_role
  * SQS → aws_sqs_queue
  * SNS → aws_sns_topic, aws_sns_topic_subscription
  * CloudFront → aws_cloudfront_distribution
  * Route53 → aws_route53_zone, aws_route53_record
  * ALB/NLB → aws_lb, aws_lb_listener, aws_lb_target_group
  * ElastiCache → aws_elasticache_cluster, aws_elasticache_subnet_group
  * EKS → aws_eks_cluster, aws_eks_node_group, aws_iam_role
- Use references between resources (e.g., aws_vpc.main.id) instead of hardcoded IDs to express dependencies.
- Add depends_on only where implicit references are insufficient.
- Create appropriate IAM roles with least-privilege policies for every compute resource (Lambda, EC2, ECS, EKS).
- Add an outputs block at the end exposing key resource ARNs, IDs, and endpoints.
- Use descriptive resource names based on labels from the diagram.
- Add inline comments (# ...) explaining non-obvious configurations.

If the diagram is unclear or contains no recognizable AWS resources, generate a minimal but complete example with a VPC, public subnet, security group, and EC2 instance, adding a comment at the top explaining that no specific resources were identified.

Output ONLY the raw Terraform HCL. No markdown, no code fences, no explanations outside of HCL comments.`;

function extractTerraform(text) {
    const trimmed = text.trim();
    // Strip markdown code fences if Gemini adds them despite instructions
    const stripped = trimmed
        .replace(/^```(?:hcl|terraform|tf)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
    return stripped;
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

        const terraform = extractTerraform(rawText);

        return NextResponse.json({ terraform });
    } catch (err) {
        console.error("analyze-architecture error:", err);
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}
