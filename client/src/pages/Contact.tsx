import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Contact() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/support", { replace: true });
  }, [setLocation]);

  return null;
}
