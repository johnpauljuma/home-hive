import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Modal, Slider, Button, Input } from "antd";
import { RotateLeftOutlined, RotateRightOutlined, SwapOutlined, FontSizeOutlined } from "@ant-design/icons";

export default function ImageEditor({ imageSrc, visible, onClose, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [text, setText] = useState("");

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    console.log(croppedArea, croppedAreaPixels);
  }, []);

  return (
    <Modal open={visible} onCancel={onClose} footer={null} width={600} centered>
      <div style={{ position: "relative", width: "100%", height: 400, background: "#000" }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={4 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          style={{ transform: flip ? "scaleX(-1)" : "scaleX(1)" }}
        />
        {text && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            {text}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 20 }}>
        <Slider min={1} max={3} step={0.1} value={zoom} onChange={setZoom} />
        <Button icon={<RotateLeftOutlined />} onClick={() => setRotation((prev) => prev - 90)} />
        <Button icon={<RotateRightOutlined />} onClick={() => setRotation((prev) => prev + 90)} />
        <Button icon={<SwapOutlined />} onClick={() => setFlip((prev) => !prev)} />
        <Input
          placeholder="Enter text overlay"
          prefix={<FontSizeOutlined />}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%", marginTop: 10 }}
        />
      </div>

      <div style={{ marginTop: 20, textAlign: "right" }}>
        <Button onClick={onClose} style={{ marginRight: 10 }}>
          Cancel
        </Button>
        <Button type="primary" onClick={() => onSave({ imageSrc, crop, zoom, rotation, flip, text })}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
