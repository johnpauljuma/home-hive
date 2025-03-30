"use client";

import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect } from "react";
import {Input, Select, Button, Card, Row, Col, Spin, Empty, message, Avatar, Typography, Space, Modal} from "antd";
import {SearchOutlined, MessageOutlined, SaveOutlined, ShareAltOutlined, UserOutlined,} from "@ant-design/icons";
import { FaFacebookMessenger } from "react-icons/fa";
import { supabase } from "../../../lib/supabase";
import LikeButton from "../components/LikeButton";
import Comments from "../components/Comments";
import SaveButton from "../components/SaveButton";
import ShareButton from "../components/ShareButton";
import styles from "./home.module.css";

export default function ExploreListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState({});
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    fetchListings();
  }, []);

  // Helper: Format created_at date using locale string
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      // Fetch listings from the "listings" table
      let { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (listingsError) throw listingsError;

      // Filter out listings with null user_id
      listingsData = listingsData.filter((listing) => listing.user_id);

      // Extract unique user_ids
      const userIds = [...new Set(listingsData.map((listing) => listing.user_id))];

      // Fetch user details from the "users" table using user_id column
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .in("user_id", userIds);

      if (usersError) throw usersError;

      // Create a mapping of user_id to user data
      const usersMap = usersData.reduce((acc, user) => {
        acc[user.user_id] = user;
        return acc;
      }, {});

      // Attach user details to listings
      const enrichedListings = listingsData.map((listing) => ({
        ...listing,
        user: usersMap[listing.user_id] || {
          name: "Unknown User",
          phone_number: "N/A",
          avatar_url: "/default-avatar.png",
        },
      }));

      setListings(enrichedListings);
      fetchCommentCounts(enrichedListings);
    } catch (error) {
      console.error("Error fetching listings:", error.message);
      message.error("Failed to fetch listings.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Comment Counts
  const fetchCommentCounts = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('id, comments(count)')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching posts with comment counts:', error);
      return;
    }
  
    console.log('Fetched posts with comment counts:', data);
  
    // Correctly extract the comment count
    const counts = data.reduce((acc, row) => {
      acc[row.id] = row.comments[0]?.count || 0; // Ensure we handle undefined cases
      return acc;
    }, {});
  
    setCommentCounts(counts);
  };
  

  // Open Comments Modal for a Post
  const openCommentModal = (listing) => {
    setSelectedPost(listing);
    setIsCommentModalOpen(true);
  };
  
  return (
    <div className={styles.container}>
      {/* Search & Filters */}
      <div className={styles.filterContainer}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search listings..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Type of Rental"
              onChange={(value) => setFilters({ ...filters, type: value })}
              allowClear
              style={{ width: "100%" }}
            >
              <Select.Option value="apartment">Apartment</Select.Option>
              <Select.Option value="house">House</Select.Option>
              <Select.Option value="studio">Studio</Select.Option>
              <Select.Option value="shared">Shared</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Input
              placeholder="Min Price"
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Input
              placeholder="Max Price"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={4}>
            <Button type="primary" onClick={fetchListings} block>
              Apply Filters
            </Button>
          </Col>
        </Row>
      </div>

      {/* Listings */}
      <div style={{ margin: "auto", width: "100%", padding: "20px", alignItems: "center" }}>
        {loading ? (
          <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
        ) : listings.length > 0 ? (
          <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
            {listings.map((listing) => (
              <Col key={listing.id} xs={24} sm={24} md={24} lg={24}>
                <Card hoverable className={styles.card}>
                <Row justify="space-between" align="middle" className={styles.profileContainer}>
                    {/* Profile Info */}
                    <Col>
                      <Space>
                        <Avatar src={listing.user.avatar_url || "/default-avatar.png"} icon={<UserOutlined />} />
                        <div>
                          <Typography.Text strong>{listing.user.name}</Typography.Text>
                          <Typography.Text type="secondary" style={{ display: "block", fontSize: "12px" }}>
                            {formatDate(listing.created_at)}
                          </Typography.Text>
                        </div>
                      </Space>
                    </Col>

                    {/* Messenger Icon (Chat Button) */}
                    <Col>
                      <Button
                        type="text"
                        icon={<FaFacebookMessenger size={24} color="#0084FF" />}
                        onClick={() => startChat(listing.user.id)}
                      />
                    </Col>
                 </Row>

                  {/* Description */}
                  {listing.description && (
                    <Typography.Paragraph className={styles.description}>
                      {listing.description}
                    </Typography.Paragraph>
                  )}

                  {/* Listing Media */}
                  <div className={styles.mediaContainer}>
                    {listing.media?.length > 0 ? (
                      listing.media[0].endsWith(".mp4") ? (
                        <video src={listing.media[0]} controls className={styles.media} />
                      ) : (
                        <img src={listing.media[0]} alt={listing.name} className={styles.media} />
                      )
                    ) : (
                      <img src="/placeholder.jpg" alt="Placeholder" className={styles.media} />
                    )}
                  </div>

                  {/* Listing Details */}
                  <Typography.Title level={5} style={{ marginTop: 10 }}>
                    {listing.name}
                  </Typography.Title>
                  <Typography.Text strong style={{ color: "#1890ff" }}>
                    Ksh {listing.price} / month
                  </Typography.Text>
                  <Typography.Paragraph>
                    📍 {listing.location} <br />
                    📞 {listing.user.phone_number}
                  </Typography.Paragraph>

                  {/* Action Buttons - Icons Only */}
                  <Space className={styles.buttonContainer}>
                    <LikeButton postId={listing.id} />

                    <Button icon={<MessageOutlined />} type="text" onClick={() => openCommentModal(listing)}>
                      {commentCounts[listing.id] !== undefined ? commentCounts[listing.id] : 0}
                    </Button>

                    <SaveButton postId={listing.id} userId={listing.user_id} />

                    <ShareButton url={`${window.location.origin}/home-hive/${listing.id}`} />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="No listings found" style={{ marginTop: "20px" }} />
        )}
      </div>

      {/* Comment Modal */}
      <Modal open={isCommentModalOpen} onCancel={() => setIsCommentModalOpen(false)} footer={null}>
        {selectedPost && <Comments postId={selectedPost.id} />}
        {console.log("Selected Post:", selectedPost)} 
      </Modal>
    </div>
  );
}
