import { ImageResponse } from "next/og"

// Image metadata
export const alt = "Niman Snacks Bar - Crispy Delights Made with Love"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

// Image generation
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "linear-gradient(to bottom right, #fef3c7, #ffedd5)",
        padding: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "linear-gradient(to right, #f97316, #ea580c)",
          color: "white",
          fontSize: 72,
          fontWeight: "bold",
          marginBottom: 40,
        }}
      >
        N
      </div>
      <h1
        style={{
          fontSize: 72,
          fontWeight: "bold",
          color: "#c2410c",
          textAlign: "center",
          margin: 0,
          marginBottom: 20,
        }}
      >
        Niman Snacks Bar
      </h1>
      <p
        style={{
          fontSize: 36,
          color: "#78350f",
          textAlign: "center",
          margin: 0,
          marginBottom: 40,
        }}
      >
        Crispy Delights Made with Love
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 32px",
          background: "#65a30d",
          color: "white",
          fontSize: 32,
          fontWeight: "bold",
          borderRadius: 12,
        }}
      >
        Order Samosas Now
      </div>
    </div>,
    { ...size },
  )
}

