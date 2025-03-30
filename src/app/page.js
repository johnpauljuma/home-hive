"use client";

import { Button, Carousel } from "antd";
import Image from "next/image";
import Link from "next/link";

const posts = [
  { id: 1, img: "/post1.png", title: "Modern Apartment in Nairobi" },
  { id: 2, img: "/post2.png", title: "Cozy Studio for Rent" },
  { id: 3, img: "/post3.png", title: "Spacious Family House" },
];

export default function HomePage() {
  return (
    <div style={{ textAlign: "center" }}>
      {/* Hero Section */}
      <div style={{ position: "relative", height: "35vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundImage: "url('/hero1.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", padding: "20px", borderRadius: "10px", color: "white", maxWidth: "33%" }}>
          <h1>Find Your Next Rental with Home Hive</h1>
          <p>Browse, post, and connect with renters seamlessly.</p>
          <Link href="/signup">
            <Button type="primary" size="large">Get Started</Button>
          </Link>
        </div>
      </div>

      {/* Posts Slider */}
      <div style={{ marginTop: "30px" }}>
        <h2>Explore Recent Listings</h2>
        <Carousel autoplay>
          {posts.map((post) => (
            <div key={post.id} style={{ padding: "10px" }}>
              <Image src={post.img} alt={post.title} width={1000} height={300} style={{ borderRadius: "10px", margin:"auto" }} />
              <h3>{post.title}</h3>
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
}
