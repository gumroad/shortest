import { getAiModels } from "@/lib/ai-models";

export async function GET(request: Request) {
  try {
    const aiModels = getAiModels();
    return new Response(JSON.stringify(aiModels), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching AI models:", error);
    return new Response("Error fetching AI models", { status: 500 });
  }
}