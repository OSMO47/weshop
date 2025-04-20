"use client";
import React, { useState } from "react";
import Image from "next/image";

export default function ImageUpload({ onImageChange, previewUrl }) {
  const [dragging, setDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageChange(e.target.files[0]);
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
      >
        รูปภาพสินค้า <span style={{ color: "red" }}>*</span>
      </label>
      <div
        onClick={() => document.getElementById("imageInput")?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: "2px dashed #ccc",
          borderColor: dragging ? "#0d6efd" : "#ccc",
          borderRadius: "0.375rem",
          padding: "2rem",
          textAlign: "center",
          cursor: "pointer",
          minHeight: "150px",
          backgroundColor: dragging ? "#f8f9fa" : "transparent",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <input
          type="file"
          id="imageInput"
          hidden
          accept="image/png, image/jpeg, image/gif"
          onChange={handleFileChange}
        />

        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Preview"
            width={150}
            height={150}
            style={{
              objectFit: "contain",
              maxHeight: "150px",
              maxWidth: "100%",
            }}
          />
        ) : (
          <>
            <i
              className="fas fa-cloud-upload-alt"
              style={{
                fontSize: "2.5rem",
                color: "#6c757d",
                marginBottom: "0.5rem",
              }}
            ></i>
            <p style={{ color: "#6c757d", fontSize: "0.875rem", margin: 0 }}>
              คลิก หรือ ลากไฟล์รูปภาพมาวางที่นี่
            </p>
            <small
              style={{
                color: "#6c757d",
                display: "block",
                marginTop: "0.25rem",
              }}
            >
              (สูงสุด 5MB, .jpg .png .gif)
            </small>
          </>
        )}
      </div>
    </div>
  );
}
