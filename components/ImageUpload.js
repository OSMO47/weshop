// components/ImageUpload.js
'use client';
import React, { useState, useCallback } from 'react';
import Image from 'next/image';

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
    <div className="mb-3">
      <label className="form-label">รูปภาพสินค้า <span className="text-danger">*</span></label>
      <div
        className={`border rounded p-4 text-center ${dragging ? 'border-primary bg-light' : 'border-dashed'}`}
        style={{ cursor: 'pointer', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
        onClick={() => document.getElementById('imageInput')?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
                style={{ objectFit: 'contain', maxHeight: '150px', maxWidth: '100%' }}
            />
        ) : (
          <>
            <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-2"></i>
            <p className="text-muted mb-0 small">คลิก หรือ ลากไฟล์รูปภาพมาวางที่นี่</p>
            <small className="text-muted d-block">(สูงสุด 5MB, .jpg .png .gif)</small>
          </>
        )}
      </div>
    </div>
  );
}