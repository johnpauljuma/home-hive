"use client";

import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { Card, Typography, Spin, Button, Avatar, Popover, Row, Col, Modal } from "antd";
import { MessageOutlined, ShareAltOutlined } from "@ant-design/icons";
import Comments from "@/app/components/Comments";
import LikeButton from "@/app/components/LikeButton";
import SaveButton from "@/app/components/SaveButton";
import ShareButton from "@/app/components/ShareButton";

export default function ListingDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState({});
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
        setLoading(true);
        const { data: listingData, error: listingError } = await supabase
            .from("listings")
            .select("*, comments(count)")
            .eq("id", id)
            .single();
        
        if (listingError) {
            console.error("Error fetching listing:", listingError);
            router.push("/");
            return;
        }
        
        // Fix: Extract comment count correctly
        const counts = { [listingData.id]: listingData.comments[0]?.count || 0 };
        
        setListing(listingData);
        setCommentCounts(counts);
        fetchUserDetails(listingData.user_id);
        setLoading(false);
    };      

    const fetchUserDetails = async (userId) => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!error) setUser(data);
    };

    if (id) fetchListing();
  }, [id, router]);

  // Open Comments Modal for a Post
  const openCommentModal = (listing) => {
    setSelectedPost(listing);
    setIsCommentModalOpen(true);
  };

  const renderMedia = (mediaUrl) => {
    if (!mediaUrl) return null;
    const isVideo = mediaUrl.endsWith(".mp4") || mediaUrl.includes("video");

    return isVideo ? (
      <video
        src={mediaUrl}
        controls
        style={{ width: "100%", height: "300px", objectFit: "cover", borderRadius: "8px" }}
      />
    ) : (
      <img
        src={mediaUrl}
        alt="Listing"
        style={{ width: "100%", height: "300px", objectFit: "cover", borderRadius: "8px" }}
      />
    );
  };

  if (loading) {
    return (
      <Row justify="center" align="middle" style={{ height: "100vh" }}>
        <Spin size="large" />
      </Row>
    );
  }

  if (!listing) {
    return <Typography.Text type="danger">Listing not found!</Typography.Text>;
  }

  return (
    <>
        <Row justify="center">
            <Col xs={24} sm={20} md={16} lg={12}>
                <Card>
                {/* User Info */}
                <Row align="middle" gutter={16} style={{ marginBottom: "5px" }}>
                    <Col>
                        <Avatar src={user?.avatar_url} size={50} />
                    </Col>
                    <Col flex="auto" style={{paddingTop: "20px"}}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                        <Typography.Text strong style={{ lineHeight: "30px" }}>
                            {user?.name}
                        </Typography.Text>
                        <Typography.Paragraph type="secondary" style={{ }}>
                            Posted on {new Date(listing.created_at).toLocaleDateString()}
                        </Typography.Paragraph>
                        </div>
                    </Col>
                </Row>


                {/* Description */}
                <Typography.Paragraph>{listing.description}</Typography.Paragraph>

                {/* Media (Image or Video) */}
                {renderMedia(listing.media[0])}

                {/* Listing Details */}
                <Typography.Title level={2} style={{ marginTop: "16px" }}>
                    {listing.name}
                </Typography.Title>
                <Typography.Text strong style={{ color: "#FF4D4F" }}>
                    Ksh {listing.rent} / month
                </Typography.Text>
                <Typography.Paragraph>📍 {listing.location}</Typography.Paragraph>

                {/* Engagement Actions */}
                <Row justify="space-between" style={{ marginTop: "16px" }}>
                    <Popover content="Like">
                    <LikeButton postId={listing.id} userId={listing.user_id} />
                    </Popover>

                    <Popover content="Comment">
                        <Button icon={<MessageOutlined />} type="text" onClick={() => openCommentModal(listing)} >
                            {commentCounts[listing.id] !== undefined ? commentCounts[listing.id] : 0}
                        </Button>
                    </Popover>

                    <Popover content="Save">
                    <SaveButton postId={listing.id} userId={listing.user_id} />
                    </Popover>

                    <Popover content="Share">
                    <ShareButton url={`${window.location.origin}/home-hive/${listing.id}`} />
                    </Popover>
                </Row>

                <Button type="primary" block style={{ marginTop: "16px" }} onClick={() => router.back()}>
                    Go Back
                </Button>
                </Card>
            </Col>
        </Row>

        {/* Comment Modal */}
        <Modal open={isCommentModalOpen} onCancel={() => setIsCommentModalOpen(false)} footer={null}>
        {selectedPost && <Comments postId={selectedPost.id} userId={selectedPost.user_id} />}
        {console.log("Selected Post:", selectedPost)} 
        </Modal>
    </>
  );
}
