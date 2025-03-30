import { useState, useEffect } from "react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { supabase } from "../../../lib/supabase";

const LikeButton = ({ postId }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [userId, setUserId] = useState(null);

  // Fetch the logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error);
        return;
      }

      if (user) {
        setUserId(user.id);
      }
    };

    fetchUser();
  }, []);

  // Fetch likes and check if the user has liked the post
  useEffect(() => {
    if (!userId) return; // Ensure user is available

    const fetchLikes = async () => {
      // Get total like count
      const { count, error: countError } = await supabase
        .from("likes")
        .select("*", { count: "exact" })
        .eq("post_id", postId);

      if (countError) {
        console.error("Error fetching likes count:", countError);
        return;
      }
      setLikesCount(count || 0);

      // Check if the user has liked the post
      const { data: userLike, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (likeError && likeError.code !== "PGRST116") {
        console.error("Error checking user like:", likeError);
        return;
      }

      setLiked(!!userLike);
    };

    fetchLikes();
  }, [postId, userId]);

  // Toggle Like
  const handleLike = async () => {
    if (!userId) return; // Ensure user is logged in before liking

    if (liked) {
      // Unlike: Delete the like from the DB
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (!error) {
        setLikesCount((prev) => prev - 1);
        setLiked(false);
      } else {
        console.error("Error unliking post:", error);
      }
    } else {
      // Like: Insert into DB
      const { error } = await supabase.from("likes").insert([{ post_id: postId, user_id: userId }]);

      if (!error) {
        setLikesCount((prev) => prev + 1);
        setLiked(true);
      } else {
        console.error("Error liking post:", error);
      }
    }
  };

  return (
    <Button type="text" onClick={handleLike} disabled={!userId}>
      {liked ? (
        <HeartFilled style={{ color: "red", fontSize: 20 }} />
      ) : (
        <HeartOutlined style={{ color: "gray", fontSize: 20 }} />
      )}
      <span style={{ marginLeft: 8 }}>{likesCount}</span>
    </Button>
  );
};

export default LikeButton;
