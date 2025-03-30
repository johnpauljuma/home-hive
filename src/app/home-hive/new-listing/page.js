"use client";

import '@ant-design/v5-patch-for-react-19';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { Form, Input, Button, Select, Upload, message, Card, Row, Col, Checkbox } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Image from "next/image";

export default function NewListing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
    };
    fetchUser();
  }, [router]);

  // Handle Form Submission
  const onFinish = async (values) => {
    setLoading(true);
  
    try {
      let mediaUrls = [];
      let videoUrl = null;
  
      if (values.media && values.media.length > 0) {
        for (const fileObj of values.media) {
          const file = fileObj.originFileObj;
          const fileExt = file.name.split(".").pop();
          const isVideo = file.type.startsWith("video");
  
          // Ensure only one video is uploaded
          if (isVideo && videoUrl) {
            message.error("You can only upload one video.");
            setLoading(false);
            return;
          }
  
          const filePath = `listings/${Date.now()}_${file.name}`;
  
          const { data, error } = await supabase.storage
            .from("media")
            .upload(filePath, file);
  
          if (error) throw error;
  
          const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${filePath}`;
  
          if (isVideo) {
            videoUrl = fileUrl;
          } else {
            mediaUrls.push(fileUrl);
          }
        }
      }
  
      const { error } = await supabase.from("listings").insert([
        {
          user_id: user.id,
          name: values.name,
          location: values.location,
          contact: values.contact,
          type: values.type,
          price: values.price,
          deposit: values.deposit || null,
          features: values.features || [],
          media: [...mediaUrls, videoUrl].filter(Boolean), // Store all images & video
        },
      ]);
  
      if (error) throw error;
  
      message.success("Listing added successfully!");
      router.push("/home-hive");
    } catch (err) {
      console.error("Error:", err.message);
      message.error("Failed to add listing.");
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div style={styles.container}>
      {/* Image (Visible only on mobile) */}
      <div style={styles.imageContainer}>
        <Image src="/images/rentals.jpg" alt="New Listing" layout="fill" objectFit="cover" />
      </div>

      <Card title="Create New Listing" style={styles.card}>
        <Form layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Listing Name" rules={[{ required: true, message: "Please enter the name" }]}>
                <Input placeholder="Enter listing name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Location" rules={[{ required: true, message: "Please enter location" }]}>
                <Input placeholder="Enter location" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact" label="Contact Information" rules={[{ required: true, message: "Please enter contact info" }]}>
                <Input placeholder="Enter phone or email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Type of Rental" rules={[{ required: true, message: "Select rental type" }]}>
                <Select placeholder="Select type">
                  <Select.Option value="apartment">Apartment</Select.Option>
                  <Select.Option value="house">House</Select.Option>
                  <Select.Option value="studio">Studio</Select.Option>
                  <Select.Option value="bed-sitter">Bed-Sitter</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="Price (Ksh)" rules={[{ required: true, message: "Please enter the price" }]}>
                <Input type="number" placeholder="Enter price" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deposit" label="Deposit (Optional)">
                <Input type="number" placeholder="Enter deposit amount" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="features" label="Amenities">
            <Checkbox.Group>
              <Row>
                <Col span={12}><Checkbox value="Parking">Parking</Checkbox></Col>
                <Col span={12}><Checkbox value="Swimming Pool">Swimming Pool</Checkbox></Col>
                <Col span={12}><Checkbox value="Gym">Gym</Checkbox></Col>
                <Col span={12}><Checkbox value="WiFi">WiFi</Checkbox></Col>
                <Col span={12}><Checkbox value="Air Conditioning">Air Conditioning</Checkbox></Col>
                <Col span={12}><Checkbox value="Security">Security</Checkbox></Col>
                <Col span={12}><Checkbox value="Laundry">Laundry</Checkbox></Col>
                <Col span={12}><Checkbox value="Playground">Playground</Checkbox></Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="media" label="Upload Images/Videos" valuePropName="fileList" getValueFromEvent={(e) => e.fileList}>
            <Upload
                beforeUpload={() => false} // Prevent auto-upload
                listType="picture"
                multiple
                accept="image/*,video/*"
                onChange={({ fileList }) => {
                const videoFiles = fileList.filter(file => file.type.startsWith("video"));
                if (videoFiles.length > 1) {
                    message.error("Only one video is allowed.");
                    return;
                }
                }}
            >
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
            </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Post Listing
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "90vh",
    background: "linear-gradient(135deg, #007BFF, #0056b3)",
    position: "relative",
    padding: "20px",
    borderRadius: "10px",
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "40%",
    height: "100%",
    display: "none", // Hidden by default
  },
  card: {
    width: "50%",
    padding: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    zIndex: 2,
  },
};

// Media Query for Mobile View
if (typeof window !== "undefined") {
  const mobileStyle = document.createElement("style");
  mobileStyle.innerHTML = `
    @media (max-width: 768px) {
      .imageContainer {
        display: block !important; /* Show image on mobile */
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 30vh;
      }
      .card {
        width: 100% !important;
        margin-top: 30vh;
      }
    }
  `;
  document.head.appendChild(mobileStyle);
}
