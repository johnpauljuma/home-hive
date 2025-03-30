import { supabase } from "../../../../lib/supabase";

// Toggle Like: Adds or removes a like
export const toggleLike = async (postId, userId) => {
  // Check if user already liked the post
  const { data: existingLike, error } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching like:", error);
    return;
  }

  if (existingLike) {
    // Unlike (Remove from DB)
    await supabase.from("likes").delete().eq("id", existingLike.id);
    return { liked: false };
  } else {
    // Like (Insert into DB)
    await supabase.from("likes").insert([{ post_id: postId, user_id: userId }]);
    return { liked: true };
  }
};

// Get total likes for a post
export const getLikesCount = async (postId) => {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    console.error("Error fetching like count:", error);
    return 0;
  }

  return count;
};
