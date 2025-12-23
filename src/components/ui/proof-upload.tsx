/**
 * Proof Upload Component
 * Komponen untuk upload bukti transfer
 */

import { useState } from 'react';

interface ProofUploadProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  error?: string | null;
  className?: string;
}

export function ProofUpload({ onUpload, uploading, error, className = '' }: ProofUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className={`bg-amber-500/20 border border-amber-500 rounded-lg p-4 ${className}`}>
      <h4 className="text-lg font-semibold text-white mb-2">Upload Bukti Transfer</h4>
      <p className="text-amber-300 text-sm mb-4">
        Setelah melakukan pembayaran, upload bukti transfer untuk verifikasi
      </p>
      
      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-amber-400 hover:border-amber-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-amber-300 mb-2">
              Drag & drop gambar di sini atau
            </p>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block">
              {uploading ? 'Mengupload...' : 'Pilih File'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          
          <p className="text-slate-400 text-xs">
            Format: JPG, PNG, GIF (Maksimal 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}