import { useState, useEffect, useRef, useCallback } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";

const API_URL  = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const PAGE_SIZE = 10;

export default function UserFeed() {
    const { profile, loading: profileLoading } = useProfile();

    const [posts, setPosts]         = useState([]);
    const [page, setPage]           = useState(0);
    const [hasMore, setHasMore]     = useState(true);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");

    // Sentinel div at bottom — IntersectionObserver triggers next page load
    const sentinelRef = useRef(null);

    useEffect(() => {
        if (!profileLoading && !profile) window.location.href = "/login";
    }, [profile, profileLoading]);

    const fetchPage = useCallback(async (pageNum) => {
        if (loading || !hasMore) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `${API_URL}/api/posts?page=${pageNum}&size=${PAGE_SIZE}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Failed to fetch posts.");
            const data = await res.json();

            // Spring Page response shape:
            // { content: [...], last: bool, totalElements: n, ... }
            setPosts((prev) => [...prev, ...data.content]);
            setHasMore(!data.last);
            setPage(pageNum + 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore]);

    // Initial load
    useEffect(() => {
        if (!profileLoading && profile) fetchPage(0);
    }, [profileLoading, profile]); // eslint-disable-line react-hooks/exhaustive-deps

    // IntersectionObserver — load next page when sentinel comes into view
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    fetchPage(page);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading, page, fetchPage]);

    if (profileLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <span className="font-mono text-xs tracking-widest uppercase text-gray-400 animate-pulse">
                Loading…
            </span>
        </div>
    );

    if (!profile) return null;

    return (
        <>
            <Navbar userRole={profile?.userRole ?? null} />

            <div className="max-w-2xl mx-auto px-4 py-8">

                

                {error && (
                    <p className="font-mono text-xs text-red-400 mb-4">{error}</p>
                )}

                {!loading && posts.length === 0 && (
                    <div className="py-16 text-center border border-dashed border-gray-200 rounded-lg">
                        <p className="font-mono text-[10.5px] tracking-widest uppercase text-gray-300">
                            No posts yet.
                        </p>
                    </div>
                )}

                {/* Social media feed — single centered column */}
                <div className="flex flex-col gap-6">
                    {posts.map((post) => (
                        <FeedCard key={post.id} post={post} />
                    ))}
                </div>

                {/* Sentinel — IntersectionObserver watches this */}
                <div ref={sentinelRef} className="py-4 flex justify-center">
                    {loading && (
                        <span className="font-mono text-xs tracking-widest uppercase text-gray-400 animate-pulse">
                            Loading…
                        </span>
                    )}
                    {!hasMore && posts.length > 0 && (
                        <span className="font-mono text-[10px] tracking-widest uppercase text-gray-300">
                            You're all caught up
                        </span>
                    )}
                </div>

            </div>
        </>
    );
}

// ── Feed Card ─────────────────────────────────────────────────
function FeedCard({ post }) {
    const authorName = [post.authorFirstName, post.authorLastName]
        .filter(Boolean).join(" ") || "Unknown";

    const initial = post.authorFirstName?.[0]?.toUpperCase() ?? "?";

    const formattedDate = post.createdAt
        ? new Date(post.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
          })
        : "";

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

            {/* Header: avatar + author + date */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                    <span className="font-mono text-sm text-white font-medium">{initial}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 leading-tight">{authorName}</span>
                    <span className="font-mono text-[10px] text-gray-400 tracking-wide">{formattedDate}</span>
                </div>
            </div>

            {/* Image — full width, only rendered when present */}
            {post.imagePath && (
                <img
                    src={`${API_URL}${post.imagePath}`}
                    alt="post"
                    className="w-full object-cover max-h-[480px]"
                />
            )}

            {/* Caption */}
            <div className="px-4 py-3">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {post.caption}
                </p>
            </div>

        </div>
    );
}