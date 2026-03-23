import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import Navbar from "../../components/NavBar";

export default function PaymentCancel() {
  const { profile } = useProfile();
  const navigate = useNavigate();

  return (
    <>
      <Navbar userRole={profile?.userRole} />
      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-widest uppercase text-gray-400 mb-2">
            Wallet
          </p>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            Payment Cancelled
          </h1>
        </div>

        <div className="border border-gray-100 rounded-xl px-6 py-10 bg-gray-50 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 text-red-500 flex items-center justify-center text-lg">
            ✕
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Payment was cancelled
            </p>
            <p className="text-xs text-gray-400 mt-1">
              You have not been charged. You can try again anytime.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate(profile?.userRole === "employer" ? "/employer/topup" : "/user/topup")}
            className="font-mono text-xs tracking-wider text-white bg-gray-900 hover:bg-gray-700 px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Try Again →
          </button>
        </div>

      </div>
    </>
  );
}