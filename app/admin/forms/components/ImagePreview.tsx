import React from "react";

export default function ImagePreview({ images }: { images?: string[] }) {
    if (!images || images.length === 0) return null;
    return (
        <div className="flex flex-col gap-2 mb-4">
            {images.map((url, idx) => (
                <img key={idx} src={url} alt="문항 이미지" className="max-h-40 rounded border object-contain" />
            ))}
        </div>
    );
} 