"use server";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "bisnisku-assets";
const MAX_SIZE_BYTES = 200 * 1024; // 200KB — images are compressed client-side

/**
 * Upload a compressed image to Supabase Storage.
 * Expects base64 data URI from the client-side compressor.
 * Returns the public URL.
 */
export async function uploadImage(
  base64Data: string,
  folder: string,
  fileName: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Strip data URI prefix → raw base64
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Clean, "base64");

  if (buffer.byteLength > MAX_SIZE_BYTES * 2) {
    // Allow a bit of server-side slack, but reject obviously oversized
    return { error: "Gambar terlalu besar. Maksimal 400KB." };
  }

  // Detect content type from data URI
  const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
  const contentType = mimeMatch?.[1] || "image/jpeg";
  const ext = contentType.split("/")[1] || "jpg";

  const path = `${folder}/${user.id}/${fileName}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { error: "Gagal upload gambar. Coba lagi." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl };
}
