import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export default function FeedCard({ post, profile }) {
    const navigate = useNavigate();

    const authorName = [post.authorFirstName, post.authorLastName]
        .filter(Boolean).join(" ") || "Unknown";

    const initial = post.authorFirstName?.[0]?.toUpperCase() ?? "?";

    const formattedDate = post.createdAt
        ? new Date(post.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
          })
        : "";

    const isSelf = profile?.id === post.authorId;

    const handleMessage = () => {
        const receiver = post.authorUsername || 
                         [post.authorFirstName, post.authorLastName].filter(Boolean).join("").toLowerCase();
      
        if (profile.userRole === "employer") {
          navigate("/employer/message", { state: { receiver } });
        } else if (profile.userRole === "user") {
          navigate("/user/message", { state: { receiver } });
        } else {
          console.warn("Unknown user role, defaulting to /user/message");
          navigate("/user/message", { state: { receiver } });
        }
      };

    return (
        <div className="bg-white border border-lightborder rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

            {/* Header: avatar + author + date + message button */}
            <div className="flex items-center gap-3 px-paddingX py-paddingY border-b border-lightborder">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-sm text-white font-medium font-montserrat">{initial}</span>
                </div>
                <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium text-primary font-poppins leading-tight">{authorName}</span>
                    <span className="text-vs text-lightgray font-poppins tracking-wide">{formattedDate}</span>
                </div>

                {/* Message button — hidden if viewing own post */}
                {!isSelf && (
                    <button
                        onClick={handleMessage}
                        className="flex items-center gap-1.5 px-btnX py-btnY text-vs font-medium font-poppins text-secondary border border-secondary rounded-full hover:bg-secondary hover:text-white transition-colors"
                    >
                        <svg className="w-nm-icon h-nm-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Message
                    </button>
                )}
            </div>

            {/* Image */}
            {post.imagePath && (
                <img
                    src={`${API_URL}${post.imagePath}`}
                    alt="post"
                    className="w-full object-cover max-h-[480px]"
                />
            )}

            {/* Caption */}
            <div className="px-paddingX py-paddingY">
                <p className="text-sm text-primary font-poppins leading-relaxed whitespace-pre-wrap">
                    {post.caption}
                </p>
            </div>

        </div>
    );
}