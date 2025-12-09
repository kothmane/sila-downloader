

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/authProvider";
import { useNavigate } from "react-router";
import AsyncButton from "@/components/basic/asyncButton";

export default function Login() {
  const { admin, signIn, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (admin) {
      navigate("/");
    }
  }, [admin]);


  const handleSignIn = useCallback(async () => {
    const adminData = await signIn(email, password);
    if (adminData) {
      console.log("Admin data found, redirecting to home");
      navigate("/");
    }
  }, [email, password]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-16">
      <h1 className="text-3xl">Sila Downloader</h1>
      <div className="card p-8 flex flex-col gap-4">
        <h1>Connectez-Vous</h1>
        <input className="h-10" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="h-10" type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <AsyncButton className="primary-button-big" onClick={handleSignIn}>Se connecter</AsyncButton>
        <p className={`${error ? "visible" : "invisible"} error-card`}>{error || ""}</p>

      </div>
    </div>
  );
}
