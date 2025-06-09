"use client";

import { Layout, Menu, Avatar, Dropdown, Button, Modal } from "antd";
import { HomeOutlined, PlusOutlined, UserOutlined, LogoutOutlined, StarOutlined, } from "@ant-design/icons";
import { FaFacebookMessenger } from "react-icons/fa";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import CreateListingModal from "../components/CreateListingModal";
import { Footer } from "antd/es/layout/layout";
//import  from ""

const { Header, Content } = Layout;

export default function HomeLayout({ children }) {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }

      // Fetch user details
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
        if (error) {
        console.error("Error fetching user details:", error);
        }

      if (data) {
        setUserDetails(data);
      }


    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Profile dropdown menu
  const profileMenu = (
    <Menu>
      <Menu.Item key="user" disabled>
        <strong>{user?.user_metadata?.full_name || "User"}</strong>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link href="/home/profile">My Profile</Link>
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

   // Define profile dropdown menu items
   const profileMenuItems = [
    {
      key: "user",
      label: <strong>{user?.user_metadata?.full_name || "User"}</strong>,
      disabled: true,
    },
    { type: "divider" },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link href="/home-hive/profile">My Profile</Link>,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  // Define menu items
  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined  style={{color:"#fff"}}/>,
      label: <Link href="/home-hive" style={{color:"#fff"}}>Home</Link>,
    },
    {
      key: "explore",
      label: (
        <Button 
          type="default" 
          icon={<StarOutlined />} 
          onClick={() => router.push("/home-hive/favorites")}
        >
          Favorites
        </Button>
      ),
    },
    {
      key: "add",
      label: (
        <>
          <Button type="default" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Add Listing
          </Button>
          <Modal
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            centered
            width={700}
          >
            <CreateListingModal onClose={() => setIsModalOpen(false)} />
          </Modal>
        </>
      ),
    },
    {
      key: "messages",
      label: (
        <Button 
          type="default" 
          icon={<FaFacebookMessenger />} 
          onClick={() => router.push("/home-hive/chat-page")}
        >
          Messages
        </Button>
      ),
    },
    {
      key: "profile",
      label: (
        <Dropdown menu={{ items: profileMenuItems }} trigger={["click"]}>
          <Avatar
            src={userDetails?.avatar_url || undefined}
            icon={!user?.user_metadata?.avatar_url && <UserOutlined />}
            style={{ cursor: "pointer" }}
          />
        </Dropdown>
      ),
    },
  ];  

  return user ? (
    <Layout style={styles.layout}>
      {/* Navbar */}
      <Header style={styles.header}>
        <div style={styles.brand}>
          <Link href="/home-hive">
            <span style={styles.logo}>Home Hive</span>
          </Link>
        </div>
        {/* Navigation Menu */}
        <Menu theme="light" mode="horizontal" style={styles.menu} items={menuItems} />
      </Header>

      {/* Page Content with responsive class */}
      <Content className="responsiveContent" style={styles.content}>
        {children}
      </Content>

    </Layout>
  ) : null;
}

// Inline Styles
const styles = {
  layout: {
    minHeight: "100vh",
    background: "#f4f4f4",
  },
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #007BFF, #0056b3)",
    padding: "0 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    zIndex: 1000,
    color:"#fff"
  },
  brand: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
  },
  logo: {
    color: "#fff",
    cursor: "pointer",
  },
  menu: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    display: "flex",
    background:"linear-gradient(135deg, #007BFF, #0056b3)",
    color:"#fff"
  },
  content: {
    marginTop: "40px", // To ensure content is not hidden behind the navbar
    padding: "0px",
    
  },
};

// Append a mobile media query to remove content padding on mobile screens
if (typeof window !== "undefined") {
  const mobileStyle = document.createElement("style");
  mobileStyle.innerHTML = `
    @media (max-width: 768px) {
      .responsiveContent {
        padding: 0 !important;
      }
    }
  `;
  document.head.appendChild(mobileStyle);
}
