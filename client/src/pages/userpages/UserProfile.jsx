import { useState, useEffect, useRef, useCallback } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import BlogPostCard from "../../components/BlogPostComponenets/BlogPostCard";

const API_URL   = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const PAGE_SIZE = 10;

export default function UserProfile() {
  const { profile, loading: profileLoading } = useProfile();

  const [posts, setPosts]           = useState([]);
  const [page, setPage]             = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError]     = useState("");

  // Create modal
  const [showCreate, setShowCreate]   = useState(false);
  const [newCaption, setNewCaption]   = useState("");
  const [newImage, setNewImage]       = useState(null);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit modal
  const [editPost, setEditPost]       = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [editImage, setEditImage]     = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState("");

  // Sentinel for infinite scroll
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!profileLoading && !profile) window.location.href = "/login";
  }, [profile, profileLoading]);

  // ── Paginated fetch ───────────────────────────────────────────
  const fetchPage = useCallback(async (pageNum) => {
    if (!profile?.id || postsLoading || !hasMore) return;
    setPostsLoading(true);
    setPostsError("");
    try {
      const res = await fetch(
        `${API_URL}/api/posts?authorId=${profile.id}&page=${pageNum}&size=${PAGE_SIZE}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch posts.");
      const data = await res.json();

      // FIX: data is now Page<BlogPostDTO> — extract .content array
      setPosts((prev) => pageNum === 0 ? data.content : [...prev, ...data.content]);
      setHasMore(!data.last);
      setPage(pageNum + 1);
    } catch (err) {
      setPostsError(err.message);
    } finally {
      setPostsLoading(false);
    }
  }, [profile?.id, postsLoading, hasMore]);

  // Initial load
  useEffect(() => {
    if (profile?.id) fetchPage(0);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll — load next page when sentinel is visible
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !postsLoading) {
          fetchPage(page);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, postsLoading, page, fetchPage]);

  // ── Create ────────────────────────────────────────────────────
  const openCreate = () => {
    setNewCaption(""); setNewImage(null); setCreateError("");
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false); setNewCaption(""); setNewImage(null); setCreateError("");
  };

  const handleCreate = async () => {
    if (!newCaption.trim()) { setCreateError("Caption is required."); return; }
    setCreating(true); setCreateError("");
    try {
      const form = new FormData();
      form.append("caption", newCaption.trim());
      form.append("authorId", profile.id);
      if (newImage) form.append("image", newImage);

      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error("Failed to create post.");
      const created = await res.json();
      // Prepend new post to the top without re-fetching
      setPosts((prev) => [created, ...prev]);
      closeCreate();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    const res = await fetch(`${API_URL}/api/posts/${id}`, {
      method: "DELETE", credentials: "include",
    });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Edit ──────────────────────────────────────────────────────
  const handleEdit = (post) => {
    setEditPost(post); setEditCaption(post.caption);
    setEditImage(null); setSaveError("");
  };

  const closeEdit = () => {
    setEditPost(null); setEditCaption(""); setEditImage(null); setSaveError("");
  };

  const handleSave = async () => {
    if (!editCaption.trim()) { setSaveError("Caption is required."); return; }
    setSaving(true); setSaveError("");
    try {
      const form = new FormData();
      form.append("caption", editCaption.trim());
      if (editImage) form.append("image", editImage);

      const res = await fetch(`${API_URL}/api/posts/${editPost.id}`, {
        method: "PUT", credentials: "include", body: form,
      });
      if (!res.ok) throw new Error("Failed to save post.");
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      closeEdit();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="font-mono text-xs tracking-widest uppercase text-gray-400 animate-pulse">
        Loading…
      </span>
    </div>
  );

  if (!profile) return null;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "User";
  const initial  = profile.firstName?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <Navbar userRole={profile?.userRole ?? null} />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Profile header */}
        <div className="flex items-center justify-between gap-5 mb-10 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
              <span className="font-mono text-lg text-white font-medium">{initial}</span>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-medium text-gray-900 tracking-tight">{fullName}</h1>
              <p className="font-mono text-[10.5px] tracking-widest uppercase text-gray-400">
                {profile.username ?? ""}
              </p>
            </div>
          </div>

          {/* New post button */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white font-mono text-[10.5px] tracking-wider uppercase rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            New post
          </button>
        </div>

        {/* Posts section */}
        <div>
          <p className="font-mono text-[10.5px] tracking-widest uppercase text-gray-400 mb-5">
            My posts
            {posts.length > 0 && (
              <span className="ml-2 text-gray-300">({posts.length})</span>
            )}
          </p>

          {postsError && (
            <p className="font-mono text-xs text-red-400">{postsError}</p>
          )}

          {!postsLoading && !postsError && posts.length === 0 && (
            <div
              onClick={openCreate}
              className="py-16 text-center border border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all group"
            >
              <p className="font-mono text-[10.5px] tracking-widest uppercase text-gray-300 group-hover:text-gray-500 transition-colors">
                No posts yet — click to create your first
              </p>
            </div>
          )}

          {posts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {posts.map((post) => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}

          {/* Sentinel — triggers next page load on scroll */}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {postsLoading && (
              <span className="font-mono text-xs tracking-widest uppercase text-gray-400 animate-pulse">
                Loading…
              </span>
            )}
            {!hasMore && posts.length > 0 && (
              <span className="font-mono text-[10px] tracking-widest uppercase text-gray-300">
                All posts loaded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Modal ───────────────────────────────────────── */}
      {showCreate && (
        <Modal
          title="New post"
          onClose={closeCreate}
          onConfirm={handleCreate}
          confirmLabel={creating ? "Posting…" : "Post"}
          disabled={creating}
          error={createError}
        >
          <PostForm
            caption={newCaption}
            setCaption={setNewCaption}
            image={newImage}
            setImage={setNewImage}
            currentImagePath={null}
          />
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────── */}
      {editPost && (
        <Modal
          title="Edit post"
          onClose={closeEdit}
          onConfirm={handleSave}
          confirmLabel={saving ? "Saving…" : "Save changes"}
          disabled={saving}
          error={saveError}
        >
          <PostForm
            caption={editCaption}
            setCaption={setEditCaption}
            image={editImage}
            setImage={setEditImage}
            currentImagePath={editPost.imagePath}
          />
        </Modal>
      )}
    </>
  );
}

// ── Shared modal shell ────────────────────────────────────────
function Modal({ title, onClose, onConfirm, confirmLabel, disabled, error, children }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <p className="font-mono text-[10.5px] tracking-widest uppercase text-gray-500">{title}</p>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="px-5 py-5 flex flex-col gap-4">
            {children}
            {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 font-mono text-[10.5px] tracking-wider uppercase text-gray-500 border border-gray-200 rounded hover:border-gray-400 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={disabled}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white font-mono text-[10.5px] tracking-wider uppercase rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Shared form fields ────────────────────────────────────────
function PostForm({ caption, setCaption, image, setImage, currentImagePath }) {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] tracking-widest uppercase text-gray-400">
          Caption
        </label>
        <textarea
          rows={5}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-400 resize-none transition-colors"
          placeholder="Write your caption…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] tracking-widest uppercase text-gray-400">
          Image <span className="text-gray-300 normal-case tracking-normal">(optional)</span>
        </label>
        {currentImagePath && !image && (
          <img
            src={`${API_URL}${currentImagePath}`}
            alt="current"
            className="w-full h-32 object-cover rounded-lg border border-gray-200 mb-1"
          />
        )}
        {image && (
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            className="w-full h-32 object-cover rounded-lg border border-gray-200 mb-1"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0] ?? null)}
          className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-200 file:text-xs file:font-mono file:text-gray-500 file:bg-white hover:file:bg-gray-50 file:cursor-pointer"
        />
      </div>
    </>
  );
}