import React, { useEffect } from "react";

export default function ImageUrlModal({
    open,
    urls,
    onChange,
    onCancel,
    onSave
}: {
    open: boolean;
    urls: string[];
    onChange: (urls: string[]) => void;
    onCancel: () => void;
    onSave: (urls: string[]) => void;
}) {
    // 모달이 열릴 때 urls가 비어있으면 빈 값 하나 추가
    useEffect(() => {
        if (open && (!urls || urls.length === 0)) {
            onChange([""]);
        }
        // eslint-disable-next-line
    }, [open]);

    const handleSave = () => {
        const filtered = (urls || []).map(s => s.trim()).filter(Boolean);
        onSave(filtered);
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-gray-500/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">이미지 URL 입력</h2>
                <div className="space-y-2 mb-4">
                    {urls.map((url, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input
                                type="text"
                                className="flex-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="이미지 URL 입력"
                                value={url}
                                onChange={e => {
                                    const newUrls = [...urls];
                                    newUrls[idx] = e.target.value;
                                    onChange(newUrls);
                                }}
                            />
                            <button
                                onClick={() => {
                                    const newUrls = urls.filter((_, i) => i !== idx);
                                    onChange(newUrls.length === 0 ? [""] : newUrls);
                                }}
                                className="px-2 py-1 text-red-500 hover:text-white hover:bg-red-500 rounded"
                                title="삭제"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => onChange([...urls, ""])}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                        URL 추가
                    </button>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 border rounded">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
                </div>
            </div>
        </div>
    );
} 