import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
export default function BlogPostCard({ post, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 hover:shadow-sm transition-all duration-200">

      {/* Image */}
      {post.imagePath && !imgError && (
        <div className="relative overflow-hidden bg-gray-100 aspect-[16/7]">
          <img
            src={`${API_URL}${post.imagePath}`}
            alt={post.caption?.slice(0, 60)}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-3">

        {/* Meta row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-widest uppercase text-gray-400">
          {(post.authorFirstName || post.authorLastName) && (
            <>
                <span>{[post.authorFirstName, post.authorLastName].filter(Boolean).join(" ")}</span>
                <span>·</span>
            </>
            )}
            {formattedDate && <span>{formattedDate}</span>}
          </div>

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={() => onEdit(post)}
                  className="px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase text-gray-500 border border-gray-200 rounded hover:border-gray-400 hover:text-gray-900 transition-all cursor-pointer bg-white"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase text-red-400 border border-red-100 rounded hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer bg-white disabled:opacity-50"
                >
                  {deleting ? "…" : "Delete"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Caption */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
          {post.caption}
        </p>

       
      </div>
    </article>
  );
}