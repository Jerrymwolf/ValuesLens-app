import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: '#E6F4F9',
          100: '#CCE9F3',
          200: '#99D3E7',
          300: '#66BDDB',
          400: '#33A7CF',
          500: '#0279AF',
          600: '#0268A0',
          700: '#015E8C',
          800: '#004466',
          900: '#002233',
        },
        accent: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#AFFC40',
          500: '#8FD932',
          600: '#65A30D',
          700: '#4D7C0F',
          800: '#3F6212',
          900: '#365314',
        },
        // ValuesPrism brand colors (4-color palette)
        prism: {
          purple: '#6B46C1',  // Deep Purple
          blue: '#4A5FC1',    // Royal Blue
          coral: '#E85D4C',   // Coral Red
          orange: '#F6AD55',  // Warm Orange
        },
      },
      backgroundImage: {
        'prism': 'linear-gradient(135deg, #6B46C1 0%, #4A5FC1 33%, #E85D4C 66%, #F6AD55 100%)',
        'prism-subtle': 'linear-gradient(135deg, rgba(107,70,193,0.15) 0%, rgba(74,95,193,0.15) 33%, rgba(232,93,76,0.15) 66%, rgba(246,173,85,0.15) 100%)',
        'prism-vertical': 'linear-gradient(180deg, #6B46C1 0%, #4A5FC1 33%, #E85D4C 66%, #F6AD55 100%)',
      },
      animation: {
        'prism-shift': 'prism-shift 8s ease infinite',
      },
      keyframes: {
        'prism-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
