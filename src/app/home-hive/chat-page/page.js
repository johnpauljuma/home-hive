"use client";

import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect, useRef } from "react";
import { Avatar, Input, Modal, Space, Typography, List, Button, Upload, } from "antd";
import { EditOutlined, SearchOutlined, SendOutlined, CameraOutlined, SmileOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { supabase } from "../../../../lib/supabase";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const ChatPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); // Store all users
  const [searchTerm, setSearchTerm] = useState(""); // Search input
  const [filteredUsers, setFilteredUsers] = useState([]); // Store filtered users
  const [selectedChat, setSelectedChat] = useState(null); // Currently selected chat
  const [messages, setMessages] = useState([]); // Messages for selected chat
  const [newMessage, setNewMessage] = useState(""); // New message input
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null); // File object
  const [selectedMediaUrl, setSelectedMediaUrl] = useState(""); // Preview URL

  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error);
        return;
      }

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
      const userId = data.user.id;

      // Fetch user profile from `users` table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile data:", profileError);
      } else {
        setProfileData(profile);
      }

      setLoading(false);
    };

    fetchUser();
  }, [router]);

  // Fetch all users for search functionality
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("user_id, name, avatar_url");

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data);
      }
    };

    fetchUsers();
  }, []);

  // Filter users as search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers([]);
    } else {
      const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Fetch messages from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          created_at,
          sender:users!messages_sender_id_fkey(user_id, name, avatar_url),
          receiver:users!messages_receiver_id_fkey(user_id, name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setChats(data);
      }
    };

    fetchMessages();

    // Subscribe to Supabase Realtime for new messages
    const subscription = supabase
      .channel("realtime:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchMessages)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Open a chat with a user
  const openChat = async (selectedUser) => {
    setSelectedChat(selectedUser);
    localStorage.setItem("selectedChat", JSON.stringify(selectedUser)); // Store in localStorage
  
    const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.user_id}),and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });
  
    if (error) {
      console.error("Error fetching chat messages:", error);
    } else {
      setMessages(data);
    }
  
    setSearchTerm("");
    setFilteredUsers([]);
  };  

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedMedia) return;
  
    let mediaUrl = null;
  
    if (selectedMedia) {
      // Upload the selected media to Supabase Storage
      setUploading(true);
      const fileName = `${Date.now()}-${selectedMedia.name}`;
      const { data, error } = await supabase.storage
        .from("chat-media")
        .upload(fileName, selectedMedia);
  
      if (error) {
        console.error("Error uploading file:", error);
        setUploading(false);
        return;
      }
  
      mediaUrl = supabase.storage.from("chat-media").getPublicUrl(fileName).data.publicUrl;
      setUploading(false);
    }
  
    // Create message object
    const newMsg = {
      sender_id: user.id,
      receiver_id: selectedChat.user_id,
      message: newMessage,
      media_url: mediaUrl,
      created_at: new Date().toISOString(),
    };
  
    // Optimistically update UI
    setMessages((prevMessages) => [...prevMessages, newMsg]);
  
    // Insert into database
    const { error } = await supabase.from("messages").insert([newMsg]);
  
    if (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => prevMessages.filter((msg) => msg !== newMsg)); // Rollback on error
    }
  
    // Reset input fields
    setNewMessage("");
    setSelectedMedia(null);
    setSelectedMediaUrl("");
  }; 
  
  const handleMediaSelection = ({ file }) => {
    const fileUrl = URL.createObjectURL(file);
    setSelectedMedia(file);
    setSelectedMediaUrl(fileUrl);
  };  

  const handleUpload = async ({ file }) => {
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("chat-media").upload(fileName, file);
  
    if (error) {
      console.error("Error uploading file:", error);
    } else {
      const mediaUrl = supabase.storage.from("chat-media").getPublicUrl(fileName).data.publicUrl;
  
      // Send message with media URL
      await sendMessage(mediaUrl);
    }
    setUploading(false);
  };  

  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
  };  

  return (
    <div className="chat-container">
      {/* Chat Sidebar (Hide when chat is selected) */}
      <div className={`chat-sidebar ${selectedChat ? "hidden" : ""}`}>
        <div className="chat-header">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search users..."
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="primary" shape="circle" icon={<EditOutlined />} onClick={() => setIsModalVisible(true)} style={{marginLeft:"10px"}}/>
        </div>

        {searchTerm ? (
          <List
            dataSource={filteredUsers}
            renderItem={(user) => (
              <List.Item key={user.user_id} className="search-item" onClick={() => openChat(user)}>
                <List.Item.Meta
                  avatar={<Avatar size={45} src={user.avatar_url || "/default-avatar.png"} />}
                  title={<Typography.Text strong>{user.name}</Typography.Text>}
                />
              </List.Item>
            )}
          />
        ) : (
          <List
            dataSource={users}
            renderItem={(chatUser) => (
              <List.Item key={chatUser.user_id} className="chat-item" onClick={() => openChat(chatUser)}>
                <Avatar size={45} src={chatUser.avatar_url || "/default-avatar.png"} />
                <Typography.Text strong>{chatUser.name}</Typography.Text>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Chat Window (Only Show When Chat is Open) */}
      {selectedChat && (
        <div className="chat-window">
          <div className="chat-header">
            <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedChat(null)} className="back-btn" />
           <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <Avatar size={45} src={selectedChat.avatar_url || "/default-avatar.png"} />
            <Typography.Title level={4} style={{margin:"auto"}}>{selectedChat.name}</Typography.Title>
           </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender_id === user.id ? "sent" : "received"}`}>
                {msg.message && <Typography.Text>{msg.message}</Typography.Text>}
                {msg.media_url && <img src={msg.media_url} alt="Sent media" className="chat-media" />}
              </div>
            ))}
          </div>

          <div className="chat-input">
            {selectedMediaUrl && (
              <div className="media-preview">
                <img src={selectedMediaUrl} alt="Preview" />
                <Button onClick={() => setSelectedMediaUrl("")}>❌</Button>
              </div>
            )}

            <Upload showUploadList={false} customRequest={handleMediaSelection}>
              <Button icon={<CameraOutlined />} />
            </Upload>
            <div className="emoji-container" ref={emojiPickerRef}>
              <Button icon={<SmileOutlined />} onClick={() => setShowEmojiPicker((prev) => !prev)} />
              {showEmojiPicker && (
                <div className="emoji-picker">
                  <Picker onEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji.emoji)} />
                </div>
              )}
            </div>
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
            <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} />
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .chat-container {
          display: flex;
          height: 90vh;
          border-radius: 8px;
          overflow: hidden;
        }

        .chat-sidebar {
          width: 100%;
          border: none;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease-in-out;
        }

        .chat-sidebar.hidden {
          display: none;
        }

        .chat-window {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }

        .back-btn {
          margin-right: 10px;
        }

        .chat-messages {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .sent { background: #d9fdd3; align-self: flex-end; width: 80%; margin-bottom: 5px; }
        .received { background: #f1f1f1; align-self: flex-start; width: 80%; margin-bottom: 5px; }

        .chat-input {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-top: 1px solid #ddd;
          position: sticky;
        }
        .chat-media {
          max-width: 100%;
          border-radius: 10px;
          margin-top: 10px;
          height: auto;
          max-height: 400px;
        }

        .chat-media img {
          max-width: 100%;
          height: 400px;
          border-radius: 10px;
        }

        .chat-media video {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .media-preview {
          position: relative;
          display: inline-block;
          max-width: 200px;
          max-height: 200px;
          margin-right: 10px;
        }

        .media-preview img {
          width: 100%;
          height: auto;
          border-radius: 10px;
        }

        .media-preview video {
          width: 100%;
          height: auto;
          border-radius: 10px;
        }

        .media-preview button {
          position: absolute;
          top: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          border-radius: 50%;
          padding: 5px;
          cursor: pointer;
        }

        .media-preview button:hover {
          background: rgba(0, 0, 0, 0.7);
        }
      `}</style>
    </div>

        
  );
};

export default ChatPage;
