"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Upload, message, Card, Row, Col, Select, Modal, Avatar, Typography, } from "antd";
import { UploadOutlined, EditOutlined, UserOutlined } from "@ant-design/icons";
import ImageEditor from "./ImageEditor";
import { supabase } from "../../../lib/supabase"; // Import Supabase client

export default function NewListing({ onClose }) {
  const [form] = Form.useForm();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [media, setMedia] = useState([]);
  const [editingMedia, setEditingMedia] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
      
    };
  
    fetchUser();
  }, [router]);
  
  console.log("User:", user);

  // Handle media upload (using the Upload component's fileList)
  const handleMediaUpload = ({ fileList }) => {
    setMedia(fileList);
  };

  // Open the image editor
  const openEditor = (file) => {
    setEditingMedia(file.thumbUrl || URL.createObjectURL(file.originFileObj));
    setIsEditorOpen(true);
  };

  // Save the edited image and update the corresponding file object in state
  const saveEditedMedia = (editedImage) => {
    if (editingMedia) {
      const updatedMedia = media.map((file) =>
        file.uid === editingMedia.uid ? { ...file, thumbUrl: editedImage } : file
      );
      setMedia(updatedMedia);
    }
    message.success("Media edited successfully!");
    setIsEditorOpen(false);
  };

  // Open the preview modal
  const handlePreview = (file) => {
    setPreviewImage(file.thumbUrl || URL.createObjectURL(file.originFileObj));
    setIsPreviewOpen(true);
  };

  // Upload media files to Supabase Storage (use media state instead of values.media)
  const uploadMedia = async () => {
    let mediaUrls = [];
    let videoUrl = null;

    if (media && media.length > 0) {
      for (const fileObj of media) {
        const file = fileObj.originFileObj;
        const fileExt = file.name.split(".").pop();
        const isVideo = file.type.startsWith("video");

        // Ensure only one video is uploaded
        if (isVideo && videoUrl) {
          message.error("You can only upload one video.");
          return null;
        }

        const filePath = `listings/${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
          .from("media")
          .upload(filePath, file);

        if (error) {
          message.error("Failed to upload media.");
          console.error(error.message);
          return null;
        }

        const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${filePath}`;

        if (isVideo) {
          videoUrl = fileUrl;
        } else {
          mediaUrls.push(fileUrl);
        }
      }
    }

    return { mediaUrls, videoUrl };
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);

    // Upload media and get URLs from media state
    const uploadedMedia = await uploadMedia();
    if (!uploadedMedia) {
      setLoading(false);
      return;
    }

    const { mediaUrls, videoUrl } = uploadedMedia;

    // Prepare listing data
    const newListing = {
      user_id: user.id,
      description: values.description,
      location: values.location,
      type: values.type,
      rent: values.rent,
      media: [...mediaUrls, videoUrl].filter(Boolean),
      created_at: new Date(),
    };

    // Insert into Supabase
    const { error } = await supabase.from("listings").insert([newListing]);

    if (error) {
      message.error("Failed to post listing.");
      console.error(error.message);
    } else {
      message.success("Listing posted successfully!");
      form.resetFields();
      setMedia([]);
      onClose(); // Close modal after submission
    }

    setLoading(false);
  };

  console.log("User:", user);

  return (
    <Card title="Create Listing">
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        {/* Profile Image & Name */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <Avatar src={profileData?.avatar_url || "/default-avatar.png"} icon={<UserOutlined />} />
          <div>
            <Typography.Text strong>{profileData?.name}</Typography.Text>
          </div>
        </div>

        {/* Description Field */}
        <Form.Item name="description" rules={[{ required: true, message: "Please enter a description" }]}>
          <Input.TextArea placeholder="Describe your rental..." autoSize={{ minRows: 2, maxRows: 4 }} variant="" style={{ fontSize: 16 }} />
        </Form.Item>

        {/* Media Upload */}
        <Upload
          beforeUpload={() => false}
          listType="picture-card"
          multiple
          accept="image/*,video/*"
          fileList={media}
          onChange={handleMediaUpload}
          onPreview={handlePreview}
          showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
          itemRender={(originNode, file) => (
            <div style={{ position: "relative", display: "inline-block" }}>
              {originNode}
              <EditOutlined
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  cursor: "pointer",
                  color: "white",
                  background: "rgba(0,0,0,0.6)",
                  borderRadius: "50%",
                  padding: 5,
                }}
                onClick={() => openEditor(file)}
              />
            </div>
          )}
        >
          {media.length < 5 && <div><UploadOutlined /> Upload</div>}
        </Upload>

        {/* Fields for Location, Type, and Rent */}
        <Row gutter={16} style={{ marginTop: "5px" }}>
          <Col span={12}>
            <Form.Item name="location" rules={[{ required: true, message: "Please enter location" }]}>
              <Input placeholder="Location" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" rules={[{ required: true, message: "Please select type" }]}>
              <Select placeholder="Type">
                <Select.Option value="Single Room">Single Room</Select.Option>
                <Select.Option value="Bedsitter">Bedsitter</Select.Option>
                <Select.Option value="One Bedroom">One Bedroom</Select.Option>
                <Select.Option value="Two Bedroom">Two Bedroom</Select.Option>
                <Select.Option value="Three Bedroom">Three Bedroom</Select.Option>
                <Select.Option value="Four Bedroom">Four Bedroom</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="rent" rules={[{ required: true, message: "Please enter rent amount" }]}>
          <Input type="number" placeholder="Rent per month (Ksh)" />
        </Form.Item>

        {/* Post Button */}
        <Button type="primary" htmlType="submit" block loading={loading}>
          {loading ? "Posting..." : "Post Listing"}
        </Button>
      </Form>

      {/* Image Editor Modal */}
      {editingMedia && (
        <ImageEditor
          imageSrc={editingMedia}
          visible={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={saveEditedMedia}
        />
      )}

      {/* Preview Modal */}
      <Modal open={isPreviewOpen} footer={null} onCancel={() => setIsPreviewOpen(false)} centered>
        <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </Card>
  );
}
