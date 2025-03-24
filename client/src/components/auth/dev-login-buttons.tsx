import { useEffect, useState } from "react";

export default function DevLoginButtons() {
  const [isDev, setIsDev] = useState(false);
  
  useEffect(() => {
    // Verificar se estamos em ambiente de desenvolvimento
    setIsDev(window.location.hostname === "localhost" || 
             window.location.hostname.includes(".replit.dev") ||
             window.location.hostname.includes("replit.app") ||
             window.location.hostname.includes(".riker.replit.dev"));
  }, []);
  
  if (!isDev) {
    return null;
  }
  
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <div className="text-xs text-gray-400 mb-2 text-center">Opções de Desenvolvimento</div>
      <div className="grid grid-cols-2 gap-2">
        <a
          href="/auth/dev/login?admin=false"
          className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          Login Dev (User)
        </a>
        <a
          href="/auth/dev/login?admin=true"
          className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          Login Dev (Admin)
        </a>
      </div>
    </div>
  );
}