import type { DiscoverySectionId } from "@codematica/core";

export const sectionThemes: Record<
  DiscoverySectionId,
  {
    accentText: string;
    accentBackground: string;
    accentBorder: string;
    softBackground: string;
    softBorder: string;
    hoverBorder: string;
  }
> = {
  paths: {
    accentText: "text-[#00645f]",
    accentBackground: "bg-[#00645f]",
    accentBorder: "border-[#004d49]",
    softBackground: "bg-[#e8f8f6]",
    softBorder: "border-[#7bcac3]",
    hoverBorder: "hover:border-[#00645f]",
  },
  lessons: {
    accentText: "text-[#1d4e9e]",
    accentBackground: "bg-[#1d4e9e]",
    accentBorder: "border-[#163e7e]",
    softBackground: "bg-[#edf5ff]",
    softBorder: "border-[#9cc7ff]",
    hoverBorder: "hover:border-[#1d4e9e]",
  },
  interviews: {
    accentText: "text-[#4b369e]",
    accentBackground: "bg-[#4b369e]",
    accentBorder: "border-[#392777]",
    softBackground: "bg-[#f3efff]",
    softBorder: "border-[#c8b8ff]",
    hoverBorder: "hover:border-[#4b369e]",
  },
  practice: {
    accentText: "text-[#a6263c]",
    accentBackground: "bg-[#a6263c]",
    accentBorder: "border-[#7d1b2d]",
    softBackground: "bg-[#fff0f2]",
    softBorder: "border-[#f0a4b1]",
    hoverBorder: "hover:border-[#a6263c]",
  },
  languages: {
    accentText: "text-[#7a5200]",
    accentBackground: "bg-[#7a5200]",
    accentBorder: "border-[#5b3d00]",
    softBackground: "bg-[#fff5d6]",
    softBorder: "border-[#e8c45c]",
    hoverBorder: "hover:border-[#7a5200]",
  },
};
