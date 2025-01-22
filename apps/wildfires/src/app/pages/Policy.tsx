import React, { useEffect } from "react";

const Policy: React.FC = () => {
    useEffect(() => {
      const script = document.createElement("script");
      script.src = "https://app.termly.io/embed-policy.min.js";
      script.async = true;
      script.onload = () => console.log("Termly script loaded successfully.");
      script.onerror = () => console.error("Failed to load the Termly script.");
      document.body.appendChild(script);
    }, []);

    return (
      <div
        name="termly-embed"
        data-id="289dda2d-120b-4304-abfd-a7deaa4abd14"
        data-type="iframe"
      ></div>
    );
  };

  export default Policy;
