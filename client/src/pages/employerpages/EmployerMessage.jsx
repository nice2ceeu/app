import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import Inbox from "../../components/MessageComponents/Inbox";
import Message from "../../components/MessageComponents/Message";
import { useNavigate } from "react-router-dom";
export default function EmployerMessage() {
    const navigate = useNavigate();

    const { profile, loading: profileLoading } = useProfile();
    const location = useLocation();
    const [activeChat, setActiveChat] = useState(location.state?.receiver || null);

    useEffect(() => {
        if (!profileLoading && !profile) navigate("/login");
    }, [profile, profileLoading]);

    if (profileLoading || !profile) return null;

    return (
        <>
            <Navbar userRole={profile?.userRole} verified={profile?.verified} />
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
                    <div className="flex-1 flex items-center justify-center bg-lightbackground">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-white border border-lightborder flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-lightgray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-lightgray font-poppins">Select a conversation</p>
                            <p className="text-vs text-lightgray/70 font-poppins mt-1">Choose from your inbox to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}