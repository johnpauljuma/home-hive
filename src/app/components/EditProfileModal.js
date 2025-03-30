import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { supabase } from "../../../lib/supabase";

const EditProfileModal = ({ isEditing, setIsEditing, user, profileData, setProfileData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && user?.id) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          message.error("Failed to load profile data");
        } else {
          console.log("Fetched Profile Data:", data); // Debugging line
          setProfileData(data);
          form.setFieldsValue(data); // Prefill form with fetched data
        }
      };

      fetchProfile();
    }
  }, [isEditing, user?.id]); // Depend on isEditing and user.id

  const handleUpdate = async (values) => {
    setLoading(true);
    const { error } = await supabase.from("users").update(values).eq("user_id", user.id);

    if (error) {
      message.error("Failed to update profile");
    } else {
      message.success("Profile updated successfully!");
      setProfileData({ ...profileData, ...values });
      setIsEditing(false);
    }
    setLoading(false);
  };

  return (
    <Modal title="Edit Profile Information" open={isEditing} onCancel={() => setIsEditing(false)} footer={null}>
      <Form form={form} layout="vertical" onFinish={handleUpdate} initialValues={profileData}>
        <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Please enter your name" }]}>
          <Input placeholder="Enter full name" />
        </Form.Item>

        <Form.Item label="Bio" name="bio">
          <Input.TextArea rows={3} placeholder="Tell us about yourself" />
        </Form.Item>

        <Form.Item label="Phone Number" name="phone_number">
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item label="Location" name="location">
          <Input placeholder="Enter location" />
        </Form.Item>

        <Button type="primary" htmlType="submit" style={{ width: "100%" }} loading={loading}>
          Save Changes
        </Button>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
