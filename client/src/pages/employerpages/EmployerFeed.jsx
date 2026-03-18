import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import FeedCard from "../../components/BlogPostComponenets/FeedCard";

const API_URL  = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const PAGE_SIZE = 10;

export default function UserFeed() {
    const { profile, loading: profileLoading } = useProfile();
    const location = useLocation();
    const navigate = useNavigate(); // ✅

    const [posts, setPosts]     = useState([]);
    const [page, setPage]       = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");

    const sentinelRef = useRef(null);
    const loadingRef  = useRef(false); // ✅
    const hasMoreRef  = useRef(true);  // ✅

    useEffect(() => {
        if (!profileLoading && !profile) navigate("/login"); // ✅
    }, [profile, profileLoading]);

    const fetchPage = useCallback(async (pageNum) => {
        if (loadingRef.current || !hasMoreRef.current) return; // ✅
        loadingRef.current = true;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `${API_URL}/api/posts?page=${pageNum}&size=${PAGE_SIZE}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Failed to fetch posts.");
            const data = await res.json();
            setPosts((prev) => [...prev, ...data.content]);
            const more = !data.last;
            setHasMore(more);
            hasMoreRef.current = more; // ✅
            setPage(pageNum + 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            loadingRef.current = false; // ✅
        }
    }, []); // ✅ empty deps

    useEffect(() => {
        if (!profileLoading && profile) fetchPage(0);
    }, [profileLoading, profile]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setPage((prev) => { fetchPage(prev); return prev; }); // ✅
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [fetchPage]); // ✅ runs once

    if (profileLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-lightbackground">
            <span className="text-vs tracking-widest uppercase text-lightgray font-poppins animate-pulse">
                Loading…
            </span>
        </div>
    );

    if (!profile) return null;

    return (
        <>
            <Navbar userRole={profile?.userRole ?? null} />

            <div className="max-w-2xl mx-auto px-paddingX py-paddingY">

                {error && (
                    <p className="text-vs text-error font-poppins mb-4">{error}</p>
                )}

                {!loading && posts.length === 0 && (
                    <div className="py-16 text-center border border-dashed border-lightborder rounded-lg">
                        <p className="text-vs tracking-widest uppercase text-lightgray font-poppins">
                            No posts yet.
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-6">
                    {posts.map((post) => (
                        <FeedCard key={post.id} post={post} profile={profile} />
                    ))}
                </div>

                <div ref={sentinelRef} className="py-4 flex justify-center">
                    {loading && (
                        <span className="text-vs tracking-widest uppercase text-lightgray font-poppins animate-pulse">
                            Loading…
                        </span>
                    )}
                    {!hasMore && posts.length > 0 && (
                        <span className="text-vs tracking-widest uppercase text-lightgray/60 font-poppins">
                            You're all caught up
                        </span>
                    )}
                </div>

            </div>
        </>
    );
}