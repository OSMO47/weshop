import React from "react";

const colorMap = {
  primary: "#0d6efd",
  success: "#198754",
  warning: "#ffc107",
  danger: "#dc3545",
  info: "#0dcaf0",
};

export default function StatCard({ title, value, icon, color = "primary" }) {
  const borderColor = colorMap[color] || "#0d6efd";

  return (
    <div
      style={{
        borderLeft: `0.25rem solid ${borderColor}`,
        borderRadius: "0.375rem",
        boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)",
        height: "100%",
        backgroundColor: "#fff",
      }}
    >
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: "bold",
                textTransform: "uppercase",
                color: borderColor,
                marginBottom: "0.25rem",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#5a5c69",
              }}
            >
              {value}
            </div>
          </div>
          <div>
            <i
              className={`fas ${icon}`}
              style={{ fontSize: "2rem", color: "#d1d3e2" }}
            ></i>
          </div>
        </div>
      </div>
    </div>
  );
}
