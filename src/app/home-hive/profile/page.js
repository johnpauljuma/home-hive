"use client";

import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { Avatar, Button, Card, Modal, Upload, message, Popover, Spin, Typography, Row, Col, Space, Empty, Form, Input } from "antd";
import { EditOutlined, CameraOutlined, MessageOutlined, } from "@ant-design/icons";
import LikeButton from "../../components/LikeButton";
import Comments from "@/app/components/Comments";
import ShareButton from "@/app/components/ShareButton";
import SaveButton from "@/app/components/SaveButton";
import EditProfileModal from "@/app/components/EditProfileModal";
import styles from "../home.module.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [previewCoverPhoto, setPreviewCoverPhoto] = useState(null);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [selectedCoverPhoto, setSelectedCoverPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState({});
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
  
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
  
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
  
      // ✅ Fetch user profile from `users` table
      setUser(user);

      // ✅ Fetch user profile from `users` table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile data:", profileError);
      } else {
        setProfileData(profile);
      }
      
      // Fetch user's listings
      fetchListings(user.id);

      // Fetch session after getting the user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
      if (sessionError) {
        console.error("Error fetching session:", sessionError);
      } else {
        console.log("User session:", sessionData);
      }
    };
  
    fetchUser();
  }, [router]);

  
  // Handle Image Selection
  const handleImageSelect = (file, setPreview, setSelected) => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setSelected(file);
    return false; // Prevent auto upload
  };

  // Upload Image to Supabase Storage
  const uploadImage = async (file, folder, column) => {
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`; // Ensure unique file name

    // Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(folder).upload(filePath, file, {
      cacheControl: "3600",
    });
    
    if (uploadError) {
      message.error(`Failed to upload ${column}: ${uploadError.message || "Unknown error"}`);
      setUploading(false);
      return;
    }

    // Get the public URL of the uploaded image
    const { data: publicUrlData, error: publicUrlError } = supabase.storage.from(folder).getPublicUrl(filePath);
    if (publicUrlError) {
      console.error("Error getting public URL:", publicUrlError);
      return;
    }
    const fileUrl = publicUrlData.publicUrl;
    console.log("File URL:", fileUrl);
    
    // Update user profile in the database
    const updates = { [column]: fileUrl };
    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("user_id", user.id); // Ensure updating the correct user

    if (updateError) {
      message.error(`Failed to update profile: ${updateError.message || "Unknown error"}`);
    } else {
      setUser((prev) => ({
        ...prev,
        user_metadata: { ...prev.user_metadata, ...updates },
      }));
      message.success(`${column === "avatar_url" ? "Profile picture" : "Cover photo"} updated successfully!`);
    }

    setUploading(false);
  };

  const fetchListings = async (userId) => {
    setLoading(true);
    try {
      // Fetch listings with comment count
      const { data: userListings, error } = await supabase
        .from("listings")
        .select("*, comments(count)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
  
      if (error) throw error;
  
      // Extract comment counts
      const counts = userListings.reduce((acc, listing) => {
        acc[listing.id] = listing.comments[0]?.count || 0; // Handle undefined comments
        return acc;
      }, {});
  
      setListings(userListings);
      setCommentCounts(counts);
    } catch (error) {
      console.error("Error fetching listings:", error.message);
      message.error("Failed to fetch listings.");
    } finally {
      setLoading(false);
    }
  };  

   // Open Comments Modal for a Post
   const openCommentModal = (listing) => {
    setSelectedPost(listing);
    setIsCommentModalOpen(true);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: 0, }}>
      {/* Cover Photo Section */}
      <Card
        cover={
          <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
            <img
              src={previewCoverPhoto || profileData?.cover_photo_url || "/default-cover.png"}
              alt="Cover"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <Popover content="Change Cover Photo">
              <Upload showUploadList={false} beforeUpload={(file) => handleImageSelect(file, setPreviewCoverPhoto, setSelectedCoverPhoto)}>
                <Button
                  icon={<CameraOutlined />}
                  shape="circle"
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                  }}
                />
              </Upload>
            </Popover>
          </div>
        }
        style={{ borderRadius: "10px", overflow: "hidden" }}
      />

      {previewCoverPhoto && (
        <Button
          type="primary"
          onClick={() => uploadImage(selectedCoverPhoto, "cover-photos", "cover_photo_url")}
          loading={uploading}
          style={{ display: "flex", margin: "10px auto", zIndex: 1 }}
        >
          Upload Cover Photo
        </Button>
      )}

      {/* Profile Info Section */}
      <Card style={{ marginTop: "-50px", textAlign: "center", padding: "20px" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Avatar
            size={120}
            src={previewProfileImage || profileData?.avatar_url || "/default-avatar.png"}
            style={{
              border: "4px solid white",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
            }}
          />
          <Popover content="Change Profile Photo">
            <Upload showUploadList={false} beforeUpload={(file) => handleImageSelect(file, setPreviewProfileImage, setSelectedProfileImage)}>
              <Button
                icon={<CameraOutlined />}
                shape="circle"
                style={{
                  position: "absolute",
                  bottom: "5px",
                  right: "5px",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                }}
              />
            </Upload>
          </Popover>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginTop: "12px" }}>
          {previewProfileImage && (
            <Button
              type="primary"
              onClick={() => uploadImage(selectedProfileImage, "profile-images", "avatar_url")}
              loading={uploading}
              style={{ display: "block", margin: "10px auto" }}
            >
              Upload Profile Picture
            </Button>
          )}
          {user?.user_metadata?.full_name || "User"}
          
        </h2>
        <p style={{ color: "gray", fontSize: "14px" }}>{user?.email}</p>
        <div>
          <h2>{profileData?.full_name}</h2>
          <p>{profileData?.bio}</p>
          <Button type="primary" onClick={() => setIsEditing(true)}>Edit Profile</Button>

          <EditProfileModal 
            isEditing={isEditing} 
            setIsEditing={setIsEditing} 
            user={user} 
            profileData={profileData} 
            setProfileData={setProfileData} 
          />
        </div>
      </Card>

       {/* User Listings Section */}
       <div style={{ margin: "auto", width: "100%", padding: "0", }}>
        <Typography.Title level={4} style={{ textAlign: "center", marginTop: "20px" }}>
          My Listings
        </Typography.Title>

        {loading ? (
          <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
        ) : listings.length > 0 ? (
          <Row gutter={[16, 16]} style={{ marginTop: "20px",  }}>
            {listings.map((listing) => (
              <Col key={listing.id} xs={24} sm={24} md={24} lg={24}>
                <Card hoverable>
                  {/* Listing Media */}
                  <div className={styles.mediaContainer}>
                    {listing.media?.length > 0 ? (
                      listing.media[0].endsWith(".mp4") ? (
                        <video src={listing.media[0]} controls className={styles.media} />
                      ) : (
                        <img src={listing.media[0]} alt={listing.name} style={{ width: "100%", height: "auto" }} />
                      )
                    ) : (
                      <img src="/placeholder.jpg" alt="Placeholder" style={{ width: "100%", height: "auto" }} />
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
                    📍 {listing.location}
                  </Typography.Paragraph>

                  {/* Action Buttons */}
                  <Space>
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
        {selectedPost && <Comments postId={selectedPost.id} userId={selectedPost.user_id} />}
        {console.log("Selected Post:", selectedPost)} 
      </Modal>
    </div>
  );
}
