/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // فحمي مائل للأزرق (من الأسطح والجبال في الصور)
        ink: { 50: "#f1f3f4", 700: "#3b434a", 900: "#1e2428" },
        // أحمر السدو (من المفارش في الصور)
        sadu: { 200: "#e9c3bc", 700: "#a03626", 800: "#862b1e", 900: "#681f15" },
        // لون الخشب
        pine: { 50: "#f8f2e9", 200: "#e6d3b3", 300: "#dbbd8c", 400: "#c89c5c" },
        // ضباب الجبل
        mist: { 50: "#f3f5f6", 200: "#d4dce0" },
      },
    },
  },
  plugins: [],
};
