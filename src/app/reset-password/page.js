"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Input,
  Button,
  Typography,
  message,
  Space,
  Divider,
} from "antd";
import {
  LockOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import { supabase } from "../../../lib/supabase";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
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

  const checkLength = password.length >= 6;
  const checkUpper = /[A-Z]/.test(password);
  const checkNumber = /\d/.test(password);
  const checkSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordValid =
    checkLength && checkUpper && checkNumber && checkSpecial;
  const passwordsMatch = password === confirmPassword;

  const handleResetPassword = async () => {
    if (!passwordValid) {
      message.error("Password does not meet all requirements.");
      return;
    }

    if (!passwordsMatch) {
      message.error("Passwords do not match.");
      return;
    }

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

  const renderCheck = (condition, label) =>
    condition ? (
      <CheckCircleTwoTone twoToneColor="#52c41a" />
    ) : (
      <CloseCircleTwoTone twoToneColor="#ff4d4f" />
    );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background:
          "linear-gradient(to right top, #f7e8ff, #e0f3ff, #ffeaea, #f1ffe7)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: "0px 8px 24px rgba(0,0,0,0.1)",
          borderRadius: 12,
        }}
      >
        <Title
          level={2}
          style={{
            fontFamily: "'Pacifico', cursive",
            textAlign: "center",
            color: "#722ed1",
          }}
        >
          Hove Hive 🐝
        </Title>

        <Text style={{ display: "block", textAlign: "center", color: "#555" }}>
          Create a new secure password below.
        </Text>

        <Input.Password
          size="large"
          placeholder="New password"
          prefix={<LockOutlined />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginTop: 24 }}
        />

        <Input.Password
          size="large"
          placeholder="Confirm new password"
          prefix={<LockOutlined />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ marginTop: 16 }}
        />

        <Divider style={{ margin: "20px 0 10px" }}>Password Requirements</Divider>
        <Space direction="vertical" size="small">
          <Text>
            {renderCheck(checkLength)} At least 6 characters
          </Text>
          <Text>
            {renderCheck(checkUpper)} At least one uppercase letter
          </Text>
          <Text>
            {renderCheck(checkNumber)} At least one number
          </Text>
          <Text>
            {renderCheck(checkSpecial)} At least one special character
          </Text>
          <Text>
            {renderCheck(passwordsMatch)} Passwords match
          </Text>
        </Space>

        <Button
          type="primary"
          block
          loading={loading}
          onClick={handleResetPassword}
          style={{
            marginTop: 24,
            backgroundColor: "#722ed1",
            borderColor: "#722ed1",
          }}
          disabled={!user}
        >
          Update Password
        </Button>
      </Card>
    </div>
  );
};

export default ResetPassword;
