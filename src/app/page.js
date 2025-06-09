"use client";

import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Card, Row, Col, Button, message } from "antd";
import Image from "next/image";
import Link from "next/link";

const { Meta } = Card;

export default function HomePage() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Track auth session
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
    });
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch listings
  useEffect(() => {
    async function fetchListings() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        console.error(error);
        message.error("Could not load listings.");
      } else {
        setListings(data);
      }
      setLoading(false);
    }

    fetchListings();
  }, []);

  function handleCardClick(id) {
    if (session) {
      router.push(`/home-hive/${id}`);
    } else {
      message.info("Please sign in to view full listing details.");
      router.push("/login");
    }
  }

  function renderListingCard(item) {
    const thumb = item.media?.[0] || "/placeholder.jpg";
    return (
      <Col
        key={item.id}
        xs={24}
        sm={12}
        md={8}
        lg={6}
        style={{ marginBottom: 24 }}
      >
        <Card
          hoverable
          style={{ width: "100%", maxWidth: 350, margin: "0 auto" }}
          cover={
            <Image
              src={thumb}
              alt={item.title}
              width={350}
              height={240}
              style={{ objectFit: "cover", width: "100%", height: "240px" }}
            />
          }
          onClick={() => handleCardClick(item.id)}
        >
          <Meta
            title={item.title}
            description={
              <>
                <span style={{ color: "#1890ff", fontWeight: 500 }}>
                  Ksh {item.rent}/mo
                </span>
                <br />
                <small>📍 {item.location}</small>
              </>
            }
          />
        </Card>
      </Col>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "0 16px" }}>
      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          height: "38vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage: "url('/hero1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.55)",
            padding: 24,
            borderRadius: 10,
            color: "#fff",
            maxWidth: 400,
          }}
        >
          <h1 style={{ marginBottom: 8 }}>Find Your Next Rental</h1>
          <p style={{ marginBottom: 16 }}>
            Browse and discover properties – no account needed.
          </p>
          <Link href="/signup">
            <Button type="primary" size="large">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Listings */}
      <section>
        <h2 style={{ marginBottom: 24 }}>Latest Listings</h2>
        {loading ? (
          <p>Loading…</p>
        ) : listings.length === 0 ? (
          <p>No listings available.</p>
        ) : (
          <Row gutter={[24, 24]} justify="center">
            {listings.map(renderListingCard)}
          </Row>
        )}
      </section>
    </div>
  );
}
