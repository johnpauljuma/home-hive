"use client";

import "@ant-design/v5-patch-for-react-19"; 
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { Card, Button, Typography, Row, Col, Empty, Spin, message } from "antd";
import { HeartFilled } from "@ant-design/icons";
import Image from "next/image";

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Fetch authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
    };

    fetchUser();
  }, [router]);

  // ✅ Fetch favorites only when user is available
  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("post_id, listings(*)")
        .eq("user_id", user?.id);

      if (error) throw error;
      setFavorites(data.map((fav) => fav.listings));
    } catch (error) {
      console.error("Error fetching favorites:", error);
      message.error("Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const removeFromFavorites = async (postId) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user?.id)
        .eq("post_id", postId);

      if (error) throw error;

      message.success("Removed from favorites.");
      setFavorites(favorites.filter((fav) => fav.id !== postId));
    } catch (error) {
      message.error("Error removing from favorites.");
      console.error(error);
    }
  };

  // ✅ Function to render media (image or video)
  const renderMedia = (mediaUrls) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const mediaUrl = mediaUrls[0]; // Ensure there's always a fallback

    const isVideo = mediaUrl.endsWith(".mp4") || mediaUrl.includes("video");

    return isVideo ? (
      <video
        src={mediaUrl}
        controls
        style={{ height: "200px", objectFit: "cover", width: "100%" }}
      />
    ) : (
      <Image
        src={mediaUrl}
        alt="Listing"
        width={300}
        height={200}
        style={{ objectFit: "cover", width: "100%", height: "200px" }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Typography.Title level={2} style={{ textAlign: "center", color: "#FF4D4F" }}>
        ❤️ My Favorites
      </Typography.Title>

      {favorites.length > 0 ? (
        <Row gutter={[16, 16]} justify="center">
          {favorites.map((listing) => (
            <Col key={listing.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                cover={renderMedia(listing.media)} // Dynamically render media
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<HeartFilled />}
                    onClick={() => removeFromFavorites(listing.id)}
                  >
                    Remove
                  </Button>,
                ]}
                className="shadow-lg rounded-lg overflow-hidden"
              >
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {listing.name}
                </Typography.Title>
                <Typography.Text strong style={{ color: "#FF4D4F" }}>
                  Ksh {listing.rent} / month
                </Typography.Text>
                <Typography.Paragraph>📍 {listing.location}</Typography.Paragraph>
                <Button type="primary" block onClick={() => router.push(`/home-hive/${listing.id}`)}>
                  View Details
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          image="https://cdn-icons-png.flaticon.com/512/4076/4076406.png"
          style={{ height: 150 }} // 🔥 Fixed from `styles` to `style`
          description={<span>No saved listings yet</span>}
        />
      )}
    </div>
  );
}
