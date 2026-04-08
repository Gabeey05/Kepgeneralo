import { createClient } from "npm:@supabase/supabase-js@2";

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
  userId?: string;
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

const uploadToStorage = async (
  replicateUrl: string,
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string> => {
  const imgResponse = await fetch(replicateUrl);
  if (!imgResponse.ok) throw new Error(`Failed to fetch generated image: ${imgResponse.status}`);
  const imgBuffer = await imgResponse.arrayBuffer();
  const contentType = imgResponse.headers.get("content-type") || "image/png";
  const ext = contentType.includes("webp") ? "webp" : contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";

  const filePath = `${userId}/${Date.now()}.${ext}`;

  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/generated-images/${filePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: imgBuffer,
    }
  );

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`Storage upload failed: ${uploadResponse.status} ${errText}`);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/generated-images/${filePath}`;
  return publicUrl;
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
      userId,
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
    if (!token) throw new Error("REPLICATE_API_TOKEN not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let modelEndpoint: string;
    const input: Record<string, unknown> = {
      prompt,
      safety_tolerance: safetyTolerance || 2,
    };

    if (mode === 'create') {
      modelEndpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions";
      input.aspect_ratio = aspectRatio || '1:1';
      input.num_outputs = 1;
      if (seed !== undefined && seed !== null) input.seed = seed;
    } else {
      modelEndpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions";

      let imageData = imageUrl;
      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        try {
          const imgResponse = await fetch(imageUrl);
          if (!imgResponse.ok) throw new Error(`Failed to fetch image: ${imgResponse.status}`);
          const imgBuffer = await imgResponse.arrayBuffer();
          const imgArray = new Uint8Array(imgBuffer);
          let binary = '';
          for (let i = 0; i < imgArray.length; i++) {
            binary += String.fromCharCode(imgArray[i]);
          }
          const base64 = btoa(binary);
          const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
          imageData = `data:${contentType};base64,${base64}`;
        } catch (fetchErr) {
          throw new Error(`Could not load reference image: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
        }
      }

      input.input_image = imageData;
      input.prompt_strength = promptStrength || 0.8;
      input.guidance_scale = guidanceScale || 7.5;
      input.num_inference_steps = inferenceSteps || 50;
      if (negativePrompt) input.negative_prompt = negativePrompt;
      if (seed !== undefined && seed !== null) input.seed = seed;
    }

    const createResponse = await fetch(modelEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create prediction: ${createResponse.status} ${error}`);
    }

    const prediction = (await createResponse.json()) as ReplicateResponse;
    const replicateImageUrl = await pollReplicateStatus(prediction.id, token);

    if (!replicateImageUrl) throw new Error("No image URL returned from Replicate");

    let finalImageUrl = replicateImageUrl;
    let storagePath: string | null = null;

    if (userId && supabaseUrl && serviceRoleKey) {
      try {
        finalImageUrl = await uploadToStorage(replicateImageUrl, userId, supabaseUrl, serviceRoleKey);
        const parts = new URL(finalImageUrl).pathname.split('/object/public/generated-images/');
        storagePath = parts[1] || null;
      } catch (uploadErr) {
        console.error("Storage upload failed, falling back to Replicate URL:", uploadErr);
        finalImageUrl = replicateImageUrl;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: finalImageUrl,
        storagePath,
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
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
