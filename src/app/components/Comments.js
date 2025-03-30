import { useState, useEffect } from "react";
import { Avatar, Button, Input, List } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase"; // Adjust path if needed
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const Comments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState(null); // Store the logged-in user's ID

  useEffect(() => {
    // Fetch the logged-in user
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

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, users!comments_user_id_fkey(name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
      } else {
        setComments(data);
      }
    };

    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !userId) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([{ post_id: postId, user_id: userId, comment_text: newComment }])
      .select("*, users!comments_user_id_fkey(name, avatar_url)");

    if (error) {
      console.error("Error adding comment:", error);
      return;
    }

    setComments([...comments, ...data]);
    setNewComment("");
  };

  return (
    <div>
      {/* Comment Input */}
      {userId ? (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleAddComment} />
        </div>
      ) : (
        <p style={{ color: "gray", textAlign: "center" }}>Log in to comment</p>
      )}

      {/* Comment List */}
      <List
        itemLayout="horizontal"
        dataSource={comments}
        renderItem={(comment) => (
          <List.Item key={comment.id}>
            <List.Item.Meta
              avatar={<Avatar src={comment.users?.avatar_url || "/default-avatar.png"} />}
              title={<b>{comment.users?.name || "Unknown"}</b>}
              description={
                <>
                  <p>{comment.comment_text}</p>
                  <small style={{ color: "gray" }}>{dayjs(comment.created_at).fromNow()}</small>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default Comments;
