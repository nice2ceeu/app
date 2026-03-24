import { useState } from "react";
import HireButton from "../HireComponent/HireButton";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export default function FeedCard({ post, profile, walletBalance }) {  
    const [toast, setToast] = useState(null);

    const authorName = [post.authorFirstName, post.authorLastName]
        .filter(Boolean).join(" ") || "Unknown";

    const initial = post.authorFirstName?.[0]?.toUpperCase() ?? "?";

    const formattedDate = post.createdAt
        ? new Date(post.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
          })
        : "";

    const isSelf = profile?.id === post.authorId;

    const worker = {
        userId: post.authorId,
        firstName: post.authorFirstName,
        lastName: post.authorLastName,
        jobTitle: post.jobTitle ?? "",
        visible: post.visible ?? true,  // ← include visible if your post DTO has it
    };

    return (
        <div className="bg-white border border-lightborder rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-mono tracking-wide ${
                    toast.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-gray-900 text-white"
                }`}>
                    <span>{toast.type === "error" ? "✕" : "✓"}</span>
                    {toast.message}
                </div>
            )}

            <div className="flex items-center gap-3 px-paddingX py-paddingY border-b border-lightborder">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm text-white font-medium font-montserrat">{initial}</span>
                </div>
                <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium text-primary font-poppins leading-tight">{authorName}</span>
                    <span className="text-vs text-lightgray font-poppins tracking-wide">{formattedDate}</span>
                </div>

                {!isSelf && profile?.userRole === "employer" && (
                    <HireButton
                        employerId={profile.id}
                        worker={worker}
                        walletBalance={walletBalance ?? 0}
                        onSuccess={(msg) => {
                            setToast({ type: "success", message: msg });
                            setTimeout(() => setToast(null), 3000);
                        }}
                        onError={(msg) => {
                            setToast({ type: "error", message: msg });
                            setTimeout(() => setToast(null), 4000);
                        }}
                    />
                )}
            </div>

            {post.imagePath && (
                <img
                    src={`${API_URL}${post.imagePath}`}
                    alt="post"
                    className="w-full object-cover max-h-[480px]"
                />
            )}

            <div className="px-paddingX py-paddingY">
                <p className="text-sm text-primary font-poppins leading-relaxed whitespace-pre-wrap">
                    {post.caption}
                </p>
            </div>

        </div>
    );
}