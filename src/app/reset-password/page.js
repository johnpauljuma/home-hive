"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Button, Typography, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user session on component mount
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        message.error("Session expired. Request a new reset link.");
        router.push("/forgot-password");
      } else {
        setUser(data.user);
      }
    };

    fetchUser();
  }, [router]);

  const handleResetPassword = async () => {
    if (password.length < 6) return message.error("Password must be at least 6 characters");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      message.error(error.message);
    } else {
      message.success("Password updated successfully!");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f5f5f5" }}>
      <Card style={{ width: 400, boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: 8 }}>
        <Title level={3} style={{ textAlign: "center" }}>Reset Your Password</Title>
        <Text style={{ display: "block", textAlign: "center", color: "#555" }}>
          Enter your new password below.
        </Text>

        <Input.Password
          size="large"
          placeholder="Enter new password"
          prefix={<LockOutlined />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginTop: 16 }}
        />

        <Button
          type="primary"
          loading={loading}
          onClick={handleResetPassword}
          style={{ marginTop: 16, width: "100%" }}
          disabled={!user}
        >
          Update Password
        </Button>
      </Card>
    </div>
  );
};

export default ResetPassword;
