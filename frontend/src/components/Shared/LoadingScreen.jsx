import React from "react";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner"></div>
        <h2>Loading...</h2>
        <p>Please wait while we process your request</p>
      </div>
    </div>
  );
}
