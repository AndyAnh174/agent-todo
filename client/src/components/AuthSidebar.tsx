"use client";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function AuthSidebar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("token");
      setLoggedIn(!!t);
    } catch (e) {
      setLoggedIn(false);
    }
  }, []);

  // while we don't know, render nothing to avoid layout shift
  if (loggedIn === null) return null;
  return loggedIn ? <Sidebar /> : null;
}
