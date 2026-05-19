"use client";

import React, { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

/* Theme-aware styles */
function ClockInternal() {
  const { themeMode } = useTheme();
  const isDark = themeMode === "dark";

  const [mounted, setMounted] = useState(false);

  // HH:MM → 5 characters: ["H","H",":","M","M"]
  const [digits, setDigits] = useState<string[]>(["-", "-", ":", "-", "-"]);

  useEffect(() => {
    setMounted(true);

    const update = () => {
      const now = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/New_York",
      });

      // "18:15" → ["1","8",":","1","5"]
      setDigits(now.slice(0, 5).split(""));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const fallback = ["-", "-", ":", "-", "-"];

  // Dynamic styles based on theme
  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: 6,
    padding: "10px 14px",
    background: isDark ? "#1a1a1a" : "#fff",
    border: "3px solid #000",
  };

  const digitStyle: React.CSSProperties = {
    width: 70,
    height: 50,
    border: "3px solid #000",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 28,
    color: isDark ? "#fff" : "#000",
  };

  // Colors for the offset panel (brutalist contrast)
  const panelColor = isDark ? "#666" : "#000";

  return (
    <motion.div style={{ position: "relative" }}>
      {/* Back panel - hidden by default (stacked behind front panel) */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: -1,
          width: "100%",
          height: "100%",
          background: panelColor,
          border: "3px solid #000",
        }}
        initial={{ x: 0, y: 0 }}
        whileHover={{ x: -8, y: -8 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
      />
      {/* Main clock container - at resting position, covers back panel */}
      <motion.div
        style={containerStyle}
        initial={{ x: 0, y: 0 }}
        whileHover={{ x: 8, y: 8 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
      >
        {(mounted ? digits : fallback).map((d, i) => (
          <div key={i} style={digitStyle}>
            {d}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default memo(ClockInternal);
ClockInternal.displayName = "Clock";
