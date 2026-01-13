const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateImageRequest {
  prompt: string;
  mode: 'create' | 'edit';
  aspectRatio?: string;
  safetyTolerance?: number;
  seed?: number;
  imageUrl?: string;
  promptStrength?: number;
  guidanceScale?: number;
  inferenceSteps?: number;
  negativePrompt?: string;
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
    const {
      prompt,
      mode,
      aspectRatio,
      safetyTolerance,
      seed,
      imageUrl,
      promptStrength,
      guidanceScale,
      inferenceSteps,
      negativePrompt,
    } = (await req.json()) as GenerateImageRequest;

    if (!prompt || !mode) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or mode" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (mode === 'edit' && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl for edit mode" }),
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

    let modelEndpoint: string;
    const input: Record<string, unknown> = {
      prompt,
      safety_tolerance: safetyTolerance || 2,
    };

    if (mode === 'create') {
      modelEndpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions";
      input.aspect_ratio = aspectRatio || '1:1';
      input.num_outputs = 1;

      if (seed !== undefined && seed !== null) {
        input.seed = seed;
      }
    } else {
      modelEndpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions";
      input.input_image = imageUrl;
      input.prompt_strength = promptStrength || 0.8;
      input.guidance_scale = guidanceScale || 7.5;
      input.num_inference_steps = inferenceSteps || 50;

      if (negativePrompt) {
        input.negative_prompt = negativePrompt;
      }

      if (seed !== undefined && seed !== null) {
        input.seed = seed;
      }
    }

    const createResponse = await fetch(modelEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
      }),
    });

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