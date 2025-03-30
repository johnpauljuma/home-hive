"use client";

import '@ant-design/v5-patch-for-react-19';
import { Form, Input, Button, Card, message } from "antd";
import Link from "next/link";
import Image from "next/image";
import { supabase } from '../../../lib/supabase';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SigninPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
  
    const onFinish = async (values) => {
      setLoading(true);
      const { email, password } = values;
  
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        message.error(error?.message || "Invalid credentials. Please try again.");
        setLoading(false);
      } else {
        message.success("Login successful! Redirecting...");
        setTimeout(() => {
          router.push("/home-hive"); // Change to your authenticated route
        }, 1500);
      }
    };

    return (
      <div style={styles.container}>
        <div style={styles.content}>
          {/* Left Side - Image */}
          <div style={styles.imageContainer}>
            <Image 
              src="/login-image.png" 
              alt="Welcome Back to Home Hive" 
              width={350} 
              height={400} 
              priority
              style={{ borderRadius: "10px" }}
            />
          </div>

          {/* Right Side - Login Form */}
          <div style={styles.formContainer}>
            <Card style={styles.card}>
              <h2 style={styles.title}>Welcome Back</h2>
              <p style={styles.subtitle}>Sign in to continue exploring Home Hive rentals.</p>

              <Form layout="vertical" onFinish={onFinish}>
                <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Enter a valid email" }]}>
                  <Input placeholder="example@email.com" />
                </Form.Item>

                <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password" }]}>
                  <Input.Password placeholder="••••••••" />
                </Form.Item>

                <Button type="primary" htmlType="submit" block style={styles.button} loading={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>

                <p style={{ marginTop: "10px", textAlign: "center" }}>
                  <Link href="/forgot-password" style={styles.link}>Forgot Password?</Link>
                </p>

                <p style={{ marginTop: "15px", textAlign: "center" }}>
                  Don't have an account? <Link href="/signup" style={styles.link}>Sign up here</Link>
                </p>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    );
}

// Styles
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    background: "linear-gradient(135deg, #007BFF, #0056b3)", // Blue gradient
    borderRadius: "10px"
  },
  content: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
    padding: "20px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  },
  imageContainer: {
    flex: "none",
  },
  formContainer: {
    flex: "none",
  },
  card: {
    width: 350,
    padding: "20px",
    textAlign: "center",
    background: "#f0f7ff", // Soft blue background
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#004085", // Dark blue
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "20px",
  },
  button: {
    background: "#007BFF",
    borderColor: "#007BFF",
  },
  link: {
    color: "#0056b3",
    fontWeight: "bold",
  },
};
