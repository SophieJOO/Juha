import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "주하 관찰 OS",
    short_name: "관찰 OS",
    description: "부모가 함께 쓰는 학교생활 관찰 기록",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
