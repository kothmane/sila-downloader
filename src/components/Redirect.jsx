import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/authProvider";

export default function Redirect({ children }) {
  const { admin, authLoading, error, firstFirebaseAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (!authLoading && !admin && !error && pathname !== "/login") {
      console.log("No admin found, redirecting to login");
      navigate("/login");
      console.log("Redirected to login");
    }
  }, [admin, authLoading, error, navigate, pathname]);




  if (!(firstFirebaseAuthLoading.current === false || (!authLoading && !admin && !error && pathname !== "/login"))) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Chargement...</h1>
            <p className="text-sm text-gray-500">Veuillez patienter...</p>
          </div>
        </div>
      </div>
    );
  }

  else if (admin || pathname === "/login") {
   
    return (
      <>
        {children}
      </>
    );
  }
}