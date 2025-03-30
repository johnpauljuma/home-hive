"use client";
import { Layout, Button } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Header, Content } = Layout;

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Show navbar only on global pages (not in /home)
  const isGlobalPage = pathname === "/" || pathname.startsWith("/about") || pathname.startsWith("/contact");

  return (
    <html>
      <body>
        <Layout>
          {/* Show Navbar only for global pages */}
          {isGlobalPage && (
            <Header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                padding: "0 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {/* App Name */}
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1890ff" }}>
                Home Hive
              </div>

              {/* Login & Signup Buttons */}
              <div>
                <Link href="/login">
                  <Button type="link">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button type="primary">Signup</Button>
                </Link>
              </div>
            </Header>
          )}

          {/* Page Content */}
          <Content style={{ padding: "20px", minHeight: "80vh" }}>
            <main>{children}</main>
          </Content>
        </Layout>
      </body>
    </html>
  );
}
