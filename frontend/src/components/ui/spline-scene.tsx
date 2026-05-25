"use client";

import Spline from "@splinetool/react-spline/next";

export default function SplineScene({ scene }: { scene: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Force the Spline canvas to fill the container */}
      <style>{`
        #spline-canvas,
        canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
        }
      `}</style>
      <Spline
        scene={scene}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
