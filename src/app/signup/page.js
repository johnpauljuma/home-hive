"use client";
import "@ant-design/v5-patch-for-react-19";
import { useState, useMemo } from "react";
import { Form, Input, Button, Card, Alert, Progress } from "antd";
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function SignupPage() {
  const router                               = useRouter();
  const [loading , setLoading ]              = useState(false);
  const [flash   , setFlash   ]              = useState(null);  // {type,text}
  const [pwValue , setPwValue ]              = useState("");    // live password value

  /* ----------------------------------------------------------- */
  /*  password helpers                                           */
  /* ----------------------------------------------------------- */
  const rules = useMemo(() => ({
    length   : pwValue.length >= 8,
    upper    : /[A-Z]/.test(pwValue),
    lower    : /[a-z]/.test(pwValue),
    digit    : /[0-9]/.test(pwValue),
    special  : /[^A-Za-z0-9]/.test(pwValue),
  }), [pwValue]);

  const strength = useMemo(() => {
    const passed = Object.values(rules).filter(Boolean).length;
    return (passed / 5) * 100;               // 0 – 100%
  }, [rules]);

  /* ----------------------------------------------------------- */
  /*  form submit                                                */
  /* ----------------------------------------------------------- */
  const onFinish = async ({ name, email, phone, password, confirmPassword }) => {
    setFlash(null);
    if (password !== confirmPassword)
      return setFlash({ type: "error", text: "Passwords do not match" });

    // final guard – shouldn’t pass if indicators are red
    if (Object.values(rules).some(v => !v))
      return setFlash({ type: "error", text: "Please satisfy all password rules." });

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: name },
      },
    });

    if (error) {
      setFlash({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    // insert into public profile table
    if (data.user) {
      const { error: dbErr } = await supabase.from("users").insert({
        user_id: data.user.id,
        name,
        phone_number: phone,
      });
      if (dbErr) console.error("DB insert:", dbErr.message);
    }

    setFlash({ type: "success", text: "Check your inbox for a confirmation link!" });
    setLoading(false);
  };

  /* ----------------------------------------------------------- */
  /*  render                                                     */
  /* ----------------------------------------------------------- */
  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <div style={styles.content}>
          {/* Left – Illustration */}
          <div style={styles.imageWrap}>
            <Image src="/signup-image.png" alt="Join Home Hive" width={450} height={600} style={{ borderRadius: 8, marginTop: '10px' }} />
          </div>

          {/* Right – Form */}
          <div style={styles.formWrap}>
            <h2 style={styles.title}>Create an Account</h2>

            {flash && (
              <Alert
                style={{ marginBottom: 10 }}
                message={flash.text}
                type={flash.type}
                showIcon
              />
            )}

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="John Doe" prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
                <Input placeholder="user@example.com" prefix={<MailOutlined />} />
              </Form.Item>

              <Form.Item label="Phone Number" name="phone" rules={[{ required: true }]}>
                <Input placeholder="+254 700 123 456" prefix={<PhoneOutlined />} />
              </Form.Item>

              <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                <Input.Password
                  placeholder="Strong password"
                  prefix={<LockOutlined />}
                  value={pwValue}
                  onChange={e => setPwValue(e.target.value)}
                />
              </Form.Item>

              {/* strength meter & checklist */}
              {pwValue && (
                <>
                  <Progress percent={strength} size="small" showInfo={false}
                            strokeColor={ strength === 100 ? "#52c41a" : "#faad14" } />
                  <ul style={styles.checklist}>
                    <li style={rules.length  ? styles.ok : styles.bad}>8 chars min</li>
                    <li style={rules.upper   ? styles.ok : styles.bad}>1 uppercase</li>
                    <li style={rules.lower   ? styles.ok : styles.bad}>1 lowercase</li>
                    <li style={rules.digit   ? styles.ok : styles.bad}>1 number</li>
                    <li style={rules.special ? styles.ok : styles.bad}>1 symbol</li>
                  </ul>
                </>
              )}

              <Form.Item label="Confirm Password" name="confirmPassword" rules={[{ required: true }]}>
                <Input.Password placeholder="Repeat password" prefix={<LockOutlined />} />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={loading} block>
                {loading ? "Signing up…" : "Sign Up"}
              </Button>

              <p style={{ marginTop: 12, textAlign: "center" }}>
                Already have an account? <Link href="/login" style={styles.link}>Log in</Link>
              </p>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  inline styles                                                     */
/* ------------------------------------------------------------------ */
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #007BFF, #0056b3)",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 860,
    borderRadius: 10,
    background: "#f0f7ff",
    boxShadow: "0 4px 15px rgba(0,0,0,.25)",
  },
  content: {
    display: "flex",
    gap: 20,
  },
  imageWrap: { flex: "0 0 400px", textAlign: "center" },
  formWrap:  { flex: 1, paddingRight: 12 },
  title:     { textAlign: "center", marginBottom: 8 },
  link:      { color: "#0056b3" },
  checklist: {
    listStyle: "none", paddingLeft: 0, margin: "6px 0 12px",
    display: "grid", gridTemplateColumns: "repeat(3,auto)", gap: 4,
    fontSize: 12,
  },
  ok:  { color: "#52c41a" },
  bad: { color: "#ff4d4f" },
};
