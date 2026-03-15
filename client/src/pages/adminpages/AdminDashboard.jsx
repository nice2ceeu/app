import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useEffect } from "react";

export default function AdminDashboard(){
    const { profile, loading: profileLoading } = useProfile();

     useEffect(() => {
    if (!profileLoading && !profile) window.location.href = "/login";
    }, [profile, profileLoading]);

    return(<>
    <Navbar userRole={profile.userRole}/>
        <h1>This is Admin Dashboard</h1>
    </>)

}