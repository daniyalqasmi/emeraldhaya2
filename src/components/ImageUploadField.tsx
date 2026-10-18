import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, X, Check, Cloud, RefreshCw, AlertCircle } from 'lucide-react';
import { processImageFile } from '../services/imageUploadHelper';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  presets?: { label: string; img: string }[];
  helperText?: string;
  placeholder?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 'portrait',
  presets,
  helperText,
  placeholder = 'https://i.ibb.co/... or paste image URL'
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setIsUploading(true);
    setUploadStatus('Uploading to ImgBB CDN...');
    setUploadedFileName(file.name);

    try {
      // Direct high-speed upload to ImgBB Cloud CDN (no limits)
      const uploadedUrl = await processImageFile(file);
      onChange(uploadedUrl);
      setUploadStatus('Uploaded successfully!');
      setTimeout(() => setUploadStatus(null), 3500);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setErrorMsg(err?.message || 'Failed to upload image. Please try again.');
      setUploadStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setUploadedFileName(null);
    setUploadStatus(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImgbbHosted = value?.includes('i.ibb.co') || value?.includes('imgbb.com');
  const isDataUrl = value?.startsWith('data:image/');

  return (
    <div className="space-y-2">
      {/* Label and mode switch */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#002814]" />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              mode === 'upload' 
                ? 'bg-[#002814] text-[#F3E5AB] shadow-xs font-semibold' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Upload from PC
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              mode === 'url' 
                ? 'bg-[#002814] text-[#F3E5AB] shadow-xs font-semibold' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {/* Cloud Provider Notice */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500">
        <span className="flex items-center gap-1 text-emerald-800 font-medium">
          <Cloud className="w-3 h-3 text-emerald-700" />
          ImgBB Cloud CDN (Unlimited High-Res)
        </span>
        {isImgbbHosted && (
          <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-medium">
            Hosted on ImgBB CDN
          </span>
        )}
        {isDataUrl && (
          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-medium">
            Local High-Res
          </span>
        )}
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          {/* Hidden native input with accept all image types */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload trigger dropzone / preview */}
          {value ? (
            <div className="relative group border border-neutral-200 rounded-lg overflow-hidden bg-neutral-900/5 p-2">
              <div className="flex items-center gap-3">
                <div className={`relative overflow-hidden rounded bg-neutral-100 border border-neutral-200 shrink-0 ${
                  aspectRatio === 'landscape' ? 'w-24 h-16' : aspectRatio === 'square' ? 'w-16 h-16' : 'w-14 h-20'
                }`}>
                  <img
                    src={value}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800 truncate">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{uploadedFileName || 'Image Ready'}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">
                    {value.startsWith('http') ? value : 'Base64 image stream'}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-[11px] font-semibold text-[#002814] hover:text-[#004D26] underline"
                    >
                      Replace photo
                    </button>
                    <span className="text-neutral-300">·</span>
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={isUploading}
                      className="text-[11px] font-medium text-red-600 hover:text-red-700 flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center gap-2 z-10">
                  <RefreshCw className="w-4 h-4 text-[#002814] animate-spin" />
                  <span className="text-xs font-semibold text-[#002814]">{uploadStatus}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-[#002814] bg-emerald-50/50 scale-[0.99]' 
                  : 'border-neutral-300 hover:border-[#002814] bg-neutral-50/60 hover:bg-neutral-50'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-2 gap-2">
                  <RefreshCw className="w-6 h-6 text-[#002814] animate-spin" />
                  <p className="text-xs font-semibold text-[#002814]">{uploadStatus || 'Uploading to ImgBB CDN...'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-100/70 text-[#002814] flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-neutral-800">
                    Click to upload from PC or drag & drop
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    No size limit · PNG, JPG, WebP, GIF automatically hosted on ImgBB CDN
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-[#002814] focus:ring-1 focus:ring-[#002814]"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {value && (
            <div className="flex items-center gap-2 p-1.5 bg-neutral-50 border border-neutral-200 rounded">
              <img
                src={value}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded object-cover border border-neutral-200"
                onError={() => setErrorMsg('Failed to load image from URL')}
              />
              <span className="text-[11px] text-neutral-600 truncate flex-1">{value}</span>
            </div>
          )}
        </div>
      )}

      {/* Preset quick picks */}
      {presets && presets.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Or pick from collection presets:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(p.img)}
                className={`group relative rounded overflow-hidden border transition-all text-left ${
                  value === p.img 
                    ? 'border-[#002814] ring-2 ring-[#002814]/30' 
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <img
                  src={p.img}
                  alt={p.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-12 object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[9px] px-1 py-0.5 truncate block">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-neutral-500 leading-tight">{helperText}</p>
      )}
    </div>
  );
};
