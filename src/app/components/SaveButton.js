"use client";

import { useState, useEffect } from "react";
import { Button, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";

export default function SaveButton({ postId }) {
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        console.error("Error fetching user:", error);
        return;
      }
      setUser(data.user);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      checkIfSaved();
    }
  }, [user]);

  const checkIfSaved = async () => {
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking favorites:", error);
    }

    setIsSaved(!!data);
  };

  const toggleSave = async () => {
    if (!user) {
      message.error("You must be logged in to save posts.");
      return;
    }

    setLoading(true);
    try {
      if (isSaved) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);

        if (error) throw error;

        message.success("Removed from favorites.");
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert([{ user_id: user.id, post_id: postId }]);

        if (error) throw error;

        message.success("Added to favorites.");
      }

      setIsSaved(!isSaved);
    } catch (error) {
      message.error("Error updating favorites.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={<SaveOutlined />}
      type={isSaved ? "primary" : "default"}
      onClick={toggleSave}
      loading={loading}
      disabled={!user}
    >
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}
