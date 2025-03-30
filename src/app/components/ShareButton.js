"use client";

import { useState } from "react";
import { Button, Popover, message } from "antd";
import {
  ShareAltOutlined,
  CopyOutlined,
  WhatsAppOutlined,
  TwitterOutlined,
  FacebookOutlined,
  SendOutlined,
} from "@ant-design/icons";

export default function ShareButton({ url }) {
  const [open, setOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      message.success("Link copied to clipboard!");
    } catch (err) {
      message.error("Failed to copy link");
    }
  };

  const shareOptions = (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Button type="text" icon={<CopyOutlined />} onClick={handleCopyLink}>
        Copy Link
      </Button>
      <Button
        type="text"
        icon={<WhatsAppOutlined style={{ color: "#25D366" }} />}
        href={`https://wa.me/?text=${encodeURIComponent(url)}`}
        target="_blank"
      >
        WhatsApp
      </Button>
      <Button
        type="text"
        icon={<TwitterOutlined style={{ color: "#1DA1F2" }} />}
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}
        target="_blank"
      >
        Twitter (X)
      </Button>
      <Button
        type="text"
        icon={<FacebookOutlined style={{ color: "#1877F2" }} />}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
      >
        Facebook
      </Button>
      <Button
        type="text"
        icon={<SendOutlined style={{ color: "#0088CC" }} />}
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}`}
        target="_blank"
      >
        Telegram
      </Button>
    </div>
  );

  return (
    <Popover content={shareOptions} trigger="click" open={open} onOpenChange={setOpen}>
      <Button icon={<ShareAltOutlined />} type="text" />
    </Popover>
  );
}
