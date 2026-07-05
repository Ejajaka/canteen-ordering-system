import React from "react";
import {
  ShoppingBag,
  Menu as MenuIcon,
  Wallet,
  BarChart3,
  LogOut,
} from "lucide-react";
import { TabType } from "../types";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
}: SidebarProps) {
  // --- Refined formal dark blue palette ---
  const BLUE_DARK = "#0B1224"; // deep navy
  const BLUE_MID = "#162A45"; // softer navy
  const BLUE_ACCENT = "#3C7DD9"; // subtle blue highlight
  const TEXT_MAIN = "rgba(255,255,255,0.95)";
  const TEXT_MUTED = "rgba(255,255,255,0.65)";

  const navItems = [
    { key: "orders" as TabType, label: "Orders", icon: ShoppingBag },
    { key: "menu" as TabType, label: "Menu", icon: MenuIcon },
    { key: "wallet" as TabType, label: "Wallet", icon: Wallet },
    { key: "analytics" as TabType, label: "Analytics", icon: BarChart3 },
  ];

  const baseBtn =
    "group w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium";
  const inactive =
    "text-white/80 hover:bg-white/5 hover:text-white";
  const active =
    "bg-white/10 text-white shadow-inner ring-1 ring-white/10";

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col text-white shadow-xl overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${BLUE_DARK} 0%, ${BLUE_MID} 100%)`,
      }}
    >
      {/* HEADER */}
      <div className="relative px-5 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-lg p-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Amrita-vishwa-vidyapeetham-logo.svg/512px-Amrita-vishwa-vidyapeetham-logo.svg.png"
            alt="Amrita Logo"
            className="h-10 w-auto object-contain filter brightness-0 invert opacity-90"
          />
        </div>

        <h1
          className="mt-3 text-[15px] font-semibold leading-none"
          style={{ color: TEXT_MAIN }}
        >
          Canteen Dashboard
        </h1>
        <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>
          Admin Console
        </p>
      </div>

      {/* NAVIGATION */}
      {/* ⬇️ Removed overflow-y-auto to stop showing scrollbar */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`${baseBtn} ${isActive ? active : inactive} relative`}
            >
              {/* Subtle accent bar */}
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-all duration-300 ${
                  isActive
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-50"
                }`}
                style={{ backgroundColor: BLUE_ACCENT }}
              />

              {/* Icon */}
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-md ring-1 ring-white/10 transition-all ${
                  isActive
                    ? "bg-blue-500/20 text-white"
                    : "bg-white/5 text-white/70 group-hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>

              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="px-4 pb-6 pt-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-white/10 hover:bg-white/15 text-white font-medium transition-all ring-1 ring-white/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>

        <p
          className="text-center text-[11px] mt-4 font-light tracking-wide"
          style={{ color: BLUE_ACCENT }}
        >
          © Amrita Vishwa Vidyapeetham
        </p>
      </div>

      {/* BACKGROUND LIGHTING */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(800px 400px at 20% 0%, rgba(60,125,217,0.06), transparent 70%)",
        }}
      />
    </aside>
  );
}
