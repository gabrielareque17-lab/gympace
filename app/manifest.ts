import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymPace",
    short_name: "GymPace",
    description:
      "A plataforma definitiva para atletas híbridos. Corrida, academia, analytics e competições.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    orientation: "portrait-primary",
    categories: ["fitness", "health", "sports"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        label: "GymPace — Feed social",
      },
    ],
    shortcuts: [
      {
        name: "Registrar corrida",
        short_name: "Corrida",
        description: "Adicione uma nova corrida",
        url: "/corridas",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Feed social",
        short_name: "Feed",
        description: "Veja atividades da sua rede",
        url: "/feed",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Competições",
        short_name: "Competições",
        description: "Ver e participar de competições",
        url: "/competicoes",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
