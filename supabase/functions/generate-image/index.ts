const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateImageRequest {
  prompt: string;
  aspectRatio: string;
  safetyTolerance?: number;
  seed?: number;
  imageUrl?: string;
}

interface ReplicateResponse {
  id: string;
  status: string;
  output?: string[] | null;
  error?: string;
}

const getAspectRatioSize = (
  aspectRatio: string
): { width: number; height: number } => {
  const ratios: { [key: string]: { width: number; height: number } } = {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1344, height: 768 },
    "9:16": { width: 768, height: 1344 },
    "3:2": { width: 1152, height: 768 },
  };
  return ratios[aspectRatio] || { width: 1024, height: 1024 };
};

const pollReplicateStatus = async (
  predictionId: string,
  token: string,
  maxAttempts: number = 300
): Promise<string | null> => {
  for (let i = 0; i < maxAttempts; i++) {
    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    const statusData = (await statusResponse.json()) as ReplicateResponse;

    if (statusData.status === "succeeded" && statusData.output) {
      return Array.isArray(statusData.output)
        ? statusData.output[0]
        : statusData.output;
    }

    if (statusData.status === "failed") {
      throw new Error(statusData.error || "Prediction failed");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Prediction timeout");
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt, aspectRatio, safetyTolerance, seed, imageUrl } =
      (await req.json()) as GenerateImageRequest;

    if (!prompt || !aspectRatio) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or aspectRatio" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = Deno.env.get("REPLICATE_API_TOKEN");
    if (!token) {
      throw new Error("REPLICATE_API_TOKEN not configured");
    }

    const { width, height } = getAspectRatioSize(aspectRatio);

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      num_outputs: 1,
      safety_tolerance: safetyTolerance || 2,
    };

    if (seed !== undefined && seed !== null) {
      input.seed = seed;
    }

    if (imageUrl) {
      input.image = imageUrl;
    }

    const createResponse = await fetch(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "c5c1a0619c8d8498bd66be5c062c0cc75b906e1f0e70f67acbd63c8c5c79c8c4",
          input,
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create prediction: ${createResponse.status} ${error}`);
    }

    const prediction = (await createResponse.json()) as ReplicateResponse;

    const generatedImageUrl = await pollReplicateStatus(prediction.id, token);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: generatedImageUrl,
        predictionId: prediction.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});