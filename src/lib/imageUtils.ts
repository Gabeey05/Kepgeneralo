const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const fetchImageBlobViaProxy = async (imageUrl: string): Promise<Blob> => {
  const proxyUrl = `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  const response = await fetch(proxyUrl, {
    headers: { Authorization: `Bearer ${supabaseAnonKey}` },
  });
  if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status}`);
  return response.blob();
};
