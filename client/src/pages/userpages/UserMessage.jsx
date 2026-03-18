import { useState, useEffect } from "react";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import Inbox from "../../components/MessageComponents/Inbox";
import Message from "../../components/MessageComponents/Message";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
export default function UserMessage() {

    const { profile, loading: profileLoading } = useProfile();
    const location = useLocation();
    const [activeChat, setActiveChat] = useState(location.state?.receiver || null);

    const navigate = useNavigate();
    useEffect(() => {
        if (!profileLoading && !profile) navigate("/login");
    }, [profile, profileLoading]);

    if (profileLoading || !profile) return null;

    return (
        <>
            <Navbar userRole={profile.userRole} />
            <div className="flex h-[calc(100vh-64px)]">
                <Inbox
                    currentUser={profile.username}
                    onSelectConversation={setActiveChat}
                />
                {activeChat ? (
                    <Message
                        currentUser={profile.username}
                        receiverUsername={activeChat}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-500">Select a conversation</p>
                            <p className="text-xs text-gray-400 mt-1">Choose from your inbox to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}