import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function uploadToStorage(externalUrl: string, userId: string): Promise<string> {
  const imgResponse = await fetch(externalUrl);
  if (!imgResponse.ok) throw new Error(`Fetch failed: ${imgResponse.status}`);
  const imgBuffer = await imgResponse.arrayBuffer();
  const contentType = imgResponse.headers.get("content-type") || "image/png";
  const ext = contentType.includes("webp")
    ? "webp"
    : contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : "png";

  const filePath = `${userId}/${Date.now()}.${ext}`;

  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/generated-images/${filePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: imgBuffer,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload failed: ${uploadRes.status} ${errText}`);
  }

  return filePath;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Find all images with external (non-storage) URLs
    const { data: rows, error } = await supabase
      .from("generated_images")
      .select("id, user_id, image_path")
      .like("image_path", "http%");

    if (error) throw error;

    const results: { id: string; status: string; newPath?: string; error?: string }[] = [];

    for (const row of rows ?? []) {
      // Skip images already in our own Supabase Storage
      if (row.image_path.includes(SUPABASE_URL)) {
        results.push({ id: row.id, status: "skipped_own_storage" });
        continue;
      }

      try {
        const newPath = await uploadToStorage(row.image_path, row.user_id);

        const { error: updateError } = await supabase
          .from("generated_images")
          .update({ image_path: newPath })
          .eq("id", row.id);

        if (updateError) throw updateError;

        results.push({ id: row.id, status: "migrated", newPath });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ id: row.id, status: "failed", error: msg });
      }
    }

    const migrated = results.filter((r) => r.status === "migrated").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped_own_storage").length;

    return new Response(
      JSON.stringify({ success: true, total: rows?.length ?? 0, migrated, failed, skipped, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
