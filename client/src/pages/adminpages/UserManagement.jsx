import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserManagement(){
    const navigate = useNavigate();
    const { profile, loading: profileLoading } = useProfile();
    useEffect(() => {
        if (!profileLoading && !profile) navigate("/login");
    }, [profile, profileLoading]);
    return(<>
     <Navbar userRole={profile.userRole}/>
        <h1>This is User UserManagement</h1>
    </>)

}