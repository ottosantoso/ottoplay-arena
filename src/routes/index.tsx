import { createFileRoute } from "@tanstack/react-router";
import bannerAsset from "@/assets/otto-play-arena-banner.png.asset.json";
import padelAsset from "@/assets/padel.png.asset.json";
import badmintonAsset from "@/assets/badminton.png.asset.json";
import pingpongAsset from "@/assets/pingpong.png.asset.json";
import tennisAsset from "@/assets/tennis.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OTTOPLAY ARENA — Rotasi Otomatis Padel, Badminton, Tenis" },
      {
        name: "description",
        content:
          "Atur rotasi pemain otomatis untuk padel, badminton, tenis meja, dan tenis. Kocok pasangan, catat skor, dan lihat klasemen real-time.",
      },
      { property: "og:title", content: "OTTOPLAY ARENA — Rotasi Otomatis Olahraga Raket" },
      {
        property: "og:description",
        content:
          "Pilih cabang olahraga, kocok pasangan, dan biarkan rotasi berjalan otomatis dari ronde pertama sampai terakhir.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const sports = [
  { logo: padelAsset.url, name: "Padel", desc: "4 pemain per lapangan" },
  { logo: badmintonAsset.url, name: "Badminton", desc: "Ganda & rotasi adil" },
  { logo: pingpongAsset.url, name: "Tenis Meja", desc: "Ronde cepat, skor instan" },
  { logo: tennisAsset.url, name: "Tenis", desc: "Rotasi partner otomatis" },
];


const features = [
  { title: "Kocok Otomatis", desc: "Partner & lawan diacak tiap ronde, tetap adil buat semua." },
  { title: "Skor & Klasemen", desc: "Catat skor per match, klasemen langsung terupdate." },
  { title: "Timer Ronde", desc: "Atur durasi ronde, dapat peringatan sebelum ganti." },
];

function Home() {
  return (
    <main className="arena-home min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-12">
        <section className="flex flex-col items-center text-center">
          <img
            src={bannerAsset.url}
            alt="OTTO PLAY ARENA"
            className="w-full max-w-xl drop-shadow-[0_0_26px_rgba(186,255,41,0.25)]"
          />
          <p className="mt-8 max-w-xl text-base leading-relaxed text-arena-dim">
            Pilih cabang olahraga, kocok pasangan, dan biarkan rotasi berjalan otomatis dari ronde
            pertama sampai terakhir.
          </p>
          <a href="/arena.html" className="btn-arena mt-9">
            Mulai Sekarang
          </a>
        </section>

        <section className="mt-20">
          <h2 className="text-arena-heading mb-6 text-center">Cabang Olahraga</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {sports.map((s) => (
              <div key={s.name} className="arena-card-static text-center">
                <span className="block text-4xl">{s.icon}</span>
                <span className="mt-3 block font-display text-lg font-bold uppercase tracking-wide">
                  {s.name}
                </span>
                <span className="mt-1 block text-xs text-arena-dim">{s.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="arena-card-static">
              <h3 className="font-display text-base font-bold uppercase tracking-wide text-arena-lime">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-arena-dim">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 text-center text-xs text-arena-dim">
          <span className="font-display uppercase tracking-wider text-arena-lime">
            Ottoplay Arena
          </span>{" "}
          — mainkan strategi, biarkan Otto beraksi.
        </footer>
      </div>
    </main>
  );
}
