// Base URL of the AWS Lambda compute API (DeepSeek + Tavily backend) that powers
// the admin-only agentic actions (chatbot, force-scan, draft) on the Firebase
// Spark plan. The Lambda verifies the Firebase ID token and never touches
// Firestore — the admin browser writes results to Firestore directly.
//
// `lambda/deploy.sh` fills this in automatically after creating the Function URL,
// then rebuilds + redeploys hosting. You can also set it by hand and run
// `npm run build && firebase deploy --only hosting`. Leave blank until deployed;
// admin actions will show a clear "backend not configured" message.
export const LAMBDA_API_BASE = '';
