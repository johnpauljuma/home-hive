"use client";
import { useState } from "react";
import { Card, Input, Button, Typography, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) return message.error("Please enter your email");

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, // Custom reset link
    });

    if (error) {
      message.error(error.message);
    } else {
      message.success("Password reset link sent! Check your email.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f5f5f5" }}>
      <Card style={{ width: 400, boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: 8 }}>
        <Title level={3} style={{ textAlign: "center" }}>Forgot Password?</Title>
        <Text style={{ display: "block", textAlign: "center", color: "#555" }}>
          Enter your email to receive a reset link.
        </Text>

        <Input
          type="email"
          size="large"
          placeholder="Enter your email"
          prefix={<MailOutlined />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginTop: 16 }}
        />

        <Button
          type="primary"
          loading={loading}
          onClick={handleForgotPassword}
          style={{ marginTop: 16, width: "100%" }}
        >
          Send Reset Link
        </Button>
      </Card>
    </div>
  );
};

export default ForgotPassword;
