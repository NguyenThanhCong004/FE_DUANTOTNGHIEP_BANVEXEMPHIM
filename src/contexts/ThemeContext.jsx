import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "moviezone_theme";
const ThemeContext = createContext(undefined);

function getInitialTheme() {
  // Luôn mở đầu ở nền sáng (trắng), kể cả khi trình duyệt đã lỡ lưu "dark" từ trước
  // (bản cũ từng tự bật dark theo prefers-color-scheme của hệ điều hành). Người dùng
  // vẫn có thể bật dark mode qua nút chuyển đổi — lựa chọn đó được nhớ lại trong phiên này.
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
