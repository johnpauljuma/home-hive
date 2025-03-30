"use client";
import { useState } from "react";
import { Form, Input, Button, Card, Alert } from "antd";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../../lib/supabase"; // Import Supabase client

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setMessage(null);

    if (values.password !== values.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `http://localhost:3000/login`, // Redirect after confirmation
        data: { full_name: values.name }, // Save additional user data
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (user) {
      const { error: insertError } = await supabase.from("users").insert([
        {
          user_id: user.id,
          name: values.name,
          phone_number: values.phone,
        },
      ]);

      if (insertError) {
        console.error("Error inserting user data:", insertError.message);
      }
    }

    setMessage({
      type: "success",
      text: "Check your email for a confirmation link!",
    });

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <div style={styles.content}>
          {/* Left Side - Image */}
          <div style={styles.imageContainer}>
            <Image src="/signup-image.png" alt="Signup" width={350} height={500} style={styles.image} />
          </div>

          {/* Right Side - Signup Form */}
          <div style={styles.formContainer}>
            <h2 style={styles.title}>Create an Account</h2>

            {message && <Alert message={message.text} type={message.type} showIcon style={{ marginBottom: "10px" }} />}

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item label="Full Name" name="name" rules={[{ required: true, message: "Please enter your name" }]}>
                <Input placeholder="John Doe" />
              </Form.Item>

              <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Enter a valid email" }]}>
                <Input placeholder="example@email.com" />
              </Form.Item>

              <Form.Item label="Phone Number" name="phone" rules={[{ required: true, message: "Enter your phone number" }]}>
                <Input placeholder="+1234567890" />
              </Form.Item>

              <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter a strong password" }]}>
                <Input.Password placeholder="••••••••" />
              </Form.Item>

              <Form.Item label="Confirm Password" name="confirmPassword" rules={[{ required: true, message: "Please confirm your password" }]}>
                <Input.Password placeholder="••••••••" />
              </Form.Item>

              <Button type="primary" htmlType="submit" block loading={loading} style={styles.button}>
                {loading ? "Signing Up..." : "Sign Up"}
              </Button>

              <p style={{ marginTop: "10px", textAlign: "center" }}>
                Already have an account? <Link href="/login" style={styles.link}>Login here</Link>
              </p>
            </Form>
          </div>
        </div>
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
    height: "100vh",
    background: "linear-gradient(135deg, #007BFF, #0056b3)",
    padding: "10px",
    borderRadius:"10px"
  },
  card: {
    width: "800px",
    padding: "20px",
    borderRadius: "10px",
    background: "#f0f7ff",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
    
  },
  content: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageContainer: {
    flex: "1",
    textAlign: "center",
  },
  image: {
    borderRadius: "8px",
  },
  formContainer: {
    flex: "1",
    padding: "10px 20px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "10px",
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

