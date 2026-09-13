import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/detail-pemain")({
  head: () => ({
    meta: [
      { title: "Report Detail Pemain — OTTOPLAY ARENA" },
      {
        name: "description",
        content:
          "Breakdown detail performa tiap pejuang: total poin, win rate, dan rincian poin/out/kesalahan per pemain.",
      },
    ],
  }),
  component: DetailPemain,
});

type MatchRow = {
  id: string;
  team_a: string[];
  team_b: string[];
  score_a: number;
  score_b: number;
};

type PlayerStatRow = {
  player_name: string;
  point_count: number;
  out_count: number;
  foul_count: number;
};

type Standing = { name: string; points: number; games: number; wins: number };

type ActionSummary = {
  name: string;
  pointCount: number;
  outCount: number;
  foulCount: number;
  total: number;
  efficiency: number;
};

function buildStandings(players: string[], matches: MatchRow[]): Standing[] {
  const table = new Map<string, Standing>();
  players.forEach((name) => table.set(name, { name, points: 0, games: 0, wins: 0 }));

  matches.forEach((m) => {
    const teamA = m.team_a ?? [];
    const teamB = m.team_b ?? [];
    const aWon = (m.score_a ?? 0) > (m.score_b ?? 0);
    const bWon = (m.score_b ?? 0) > (m.score_a ?? 0);

    teamA.forEach((name) => {
      const row = table.get(name) ?? { name, points: 0, games: 0, wins: 0 };
      row.games += 1;
      row.points += m.score_a ?? 0;
      if (aWon) row.wins += 1;
      table.set(name, row);
    });
    teamB.forEach((name) => {
      const row = table.get(name) ?? { name, points: 0, games: 0, wins: 0 };
      row.games += 1;
      row.points += m.score_b ?? 0;
      if (bWon) row.wins += 1;
      table.set(name, row);
    });
  });

  return [...table.values()];
}

function buildActionSummary(statRows: PlayerStatRow[]): ActionSummary[] {
  const table = new Map<string, { pointCount: number; outCount: number; foulCount: number }>();
  statRows.forEach((row) => {
    const cur = table.get(row.player_name) ?? { pointCount: 0, outCount: 0, foulCount: 0 };
    cur.pointCount += row.point_count ?? 0;
    cur.outCount += row.out_count ?? 0;
    cur.foulCount += row.foul_count ?? 0;
    table.set(row.player_name, cur);
  });

  return [...table.entries()].map(([name, v]) => {
    const total = v.pointCount + v.outCount + v.foulCount;
    return {
      name,
      pointCount: v.pointCount,
      outCount: v.outCount,
      foulCount: v.foulCount,
      total,
      efficiency: total > 0 ? (v.pointCount / total) * 100 : 0,
    };
  });
}

const SPORT_GREEN = "#85bd13";
const SPORT_BLUE = "#28a9e0";
const SPORT_PINK = "#ff5b6e";
const SPORT_AMBER = "#f0b429";

function MiniBarChart({
  data,
  dataKey,
  color,
  suffix = "",
}: {
  data: { name: string; value: number }[];
  dataKey: string;
  color: string;
  suffix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.26 0.05 250 / 0.08)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--arena-dim)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--arena-dim)" }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v: number) => [`${v}${suffix}`, ""]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid oklch(0.26 0.05 250 / 0.1)",
            fontSize: 12,
          }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} maxBarSize={40} name={dataKey} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DetailPemain() {
  const [code, setCode] = useState("");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("kode");
    let latest = "";
    if (!fromUrl) {
      let latestAt = -1;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("ottoKlasemenCode_") || key.endsWith("_at")) continue;
        const value = localStorage.getItem(key);
        if (!value) continue;
        const at = Number(localStorage.getItem(key + "_at") ?? 0);
        if (at >= latestAt) {
          latestAt = at;
          latest = value;
        }
      }
    }
    const saved = (fromUrl || latest || "").toUpperCase();
    if (saved) setCode(saved);
  }, []);

  const query = useQuery({
    queryKey: ["detail-pemain", code],
    enabled: !!code,
    refetchInterval: 15000,
    queryFn: async () => {
      const [playersRes, matchesRes, statsRes] = await Promise.all([
        supabase.from("arena_players").select("name").eq("arena_code", code),
        supabase
          .from("arena_matches")
          .select("id, team_a, team_b, score_a, score_b")
          .eq("arena_code", code),
        supabase
          .from("arena_player_stats")
          .select("player_name, point_count, out_count, foul_count")
          .eq("arena_code", code),
      ]);
      if (playersRes.error) throw playersRes.error;
      if (matchesRes.error) throw matchesRes.error;
      const players = (playersRes.data ?? []).map((p) => p.name);
      const matches = (matchesRes.data ?? []) as MatchRow[];
      const statRows = statsRes.error ? [] : ((statsRes.data ?? []) as PlayerStatRow[]);
      return {
        standings: buildStandings(players, matches),
        actions: buildActionSummary(statRows),
        hasActionData: !statsRes.error && statRows.length > 0,
      };
    },
  });

  const data = query.data;

  const rankedStandings = data
    ? [...data.standings].sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name))
    : [];
  const podium = rankedStandings.slice(0, 3);
  const maxPodiumPoints = podium.length ? Math.max(...podium.map((p) => p.points), 1) : 1;

  const topPoin = data
    ? [...data.standings].sort((a, b) => b.points - a.points).slice(0, 5).map((s) => ({ name: s.name, value: s.points }))
    : [];
  const topWinRate = data
    ? [...data.standings]
        .map((s) => ({ name: s.name, value: s.games > 0 ? Math.round((s.wins / s.games) * 100) : 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    : [];
  const topLowestErrors = data
    ? [...data.actions]
        .map((a) => ({ name: a.name, value: a.outCount + a.foulCount }))
        .sort((a, b) => a.value - b.value)
        .slice(0, 5)
    : [];
  const rankedActions = data
    ? [...data.actions].sort((a, b) => b.efficiency - a.efficiency || b.total - a.total)
    : [];

  return (
    <main className="arena-home court-lines min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-10">
        <nav className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="rounded-full border border-arena-ink/15 bg-white/70 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-arena-ink transition hover:border-arena-lime"
          >
            ← Beranda
          </Link>
          <a
            href={`/klasemen?kode=${encodeURIComponent(code)}`}
            className="font-display text-xs font-bold uppercase tracking-wider text-arena-lime"
          >
            Lihat Klasemen
          </a>
        </nav>

        <header className="text-center">
          <span className="text-4xl">📊</span>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-arena-ink">
            Report Detail Pemain
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-arena-dim">
            Breakdown performa tiap pejuang: total poin, win rate, dan rincian aksi (poin/out/kesalahan)
            dari mode pencatatan Detail.
          </p>
        </header>

        {!code && (
          <p className="mt-10 text-center text-sm text-arena-dim">
            Kode arena tidak ditemukan di link ini. Buka halaman ini dari tombol "Report Detail Pemain"
            di layar Turnamen Kelar, atau{" "}
            <Link to="/klasemen" className="font-bold text-arena-lime underline">
              cari lewat halaman Klasemen
            </Link>
            .
          </p>
        )}

        {code && query.isLoading && (
          <p className="mt-10 text-center text-sm text-arena-dim">Memuat data…</p>
        )}

        {code && query.isError && (
          <p className="mt-10 text-center text-sm text-arena-dim">
            Gagal memuat data. Coba lagi sebentar.
          </p>
        )}

        {code && data && (
          <>
            <section className="mt-10">
              <h2 className="text-arena-heading mb-1">Podium</h2>
              <p className="mb-4 text-xs text-arena-dim">
                Top 3 pejuang lapangan berdasarkan total poin & win rate keseluruhan.
              </p>
              {podium.length === 0 ? (
                <p className="text-sm text-arena-dim">Belum ada data.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {podium.map((p, i) => {
                    const rank = i + 1;
                    const meta =
                      rank === 1
                        ? { badge: "🥇", label: "GOLD BADGE", color: SPORT_AMBER }
                        : rank === 2
                          ? { badge: "🥈", label: "SILVER BADGE", color: SPORT_BLUE }
                          : { badge: "🥉", label: "BRONZE BADGE", color: SPORT_PINK };
                    const winRate = p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0;
                    const losses = p.games - p.wins;
                    const pointsPct = Math.min(100, Math.round((p.points / maxPodiumPoints) * 100));

                    return (
                      <div
                        key={p.name}
                        className="arena-card-static"
                        style={{ boxShadow: `0 0 0 1px ${meta.color}33, 0 14px 30px -24px ${meta.color}88` }}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{meta.badge}</span>
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full font-display text-xs font-bold text-white"
                            style={{ background: meta.color }}
                          >
                            {rank}
                          </span>
                        </div>
                        <p className="mt-2 font-display text-lg font-bold uppercase tracking-wide text-arena-ink">
                          {p.name}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
                          {meta.label}
                        </p>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-arena-dim">
                            <span>Points</span>
                            <span className="font-display font-bold text-arena-ink">{p.points} pts</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-arena-ink/10">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pointsPct}%`, background: meta.color }}
                            />
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-arena-dim">
                            <span>Win Rate</span>
                            <span className="font-display font-bold text-arena-ink">{winRate}%</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-arena-ink/10">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${winRate}%`, background: meta.color }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                          <span className="rounded-full bg-arena-ink/5 px-2 py-1 text-arena-dim">
                            {p.games} Game
                          </span>
                          <span className="rounded-full bg-arena-lime/15 px-2 py-1 text-arena-ink">
                            {p.wins} Menang
                          </span>
                          <span className="rounded-full px-2 py-1" style={{ background: `${SPORT_PINK}22`, color: SPORT_PINK }}>
                            {losses} Kalah
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-arena-heading mb-4">Top 5 Statistics</h2>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="arena-card-static">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-arena-dim">
                    Top 5 Total Poin
                  </p>
                  {topPoin.length ? (
                    <MiniBarChart data={topPoin} dataKey="value" color={SPORT_GREEN} />
                  ) : (
                    <p className="py-10 text-center text-xs text-arena-dim">Belum ada data.</p>
                  )}
                </div>
                <div className="arena-card-static">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-arena-dim">
                    Top 5 Win Rate %
                  </p>
                  {topWinRate.length ? (
                    <MiniBarChart data={topWinRate} dataKey="value" color={SPORT_BLUE} suffix="%" />
                  ) : (
                    <p className="py-10 text-center text-xs text-arena-dim">Belum ada data.</p>
                  )}
                </div>
                <div className="arena-card-static">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-arena-dim">
                    Top 5 Paling Sedikit Kesalahan
                  </p>
                  {data.hasActionData && topLowestErrors.length ? (
                    <MiniBarChart data={topLowestErrors} dataKey="value" color={SPORT_PINK} />
                  ) : (
                    <p className="py-10 text-center text-xs text-arena-dim">
                      Belum ada data mode Detail.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-arena-heading mb-1">Per-Player Event Log Breakdown</h2>
              <p className="mb-4 text-xs text-arena-dim">
                Efisiensi = poin yang dicetak sendiri ÷ total aksi (poin + out + kesalahan). Cuma
                terisi untuk pertandingan yang dicatat pakai mode Detail.
              </p>

              {!data.hasActionData ? (
                <p className="text-sm text-arena-dim">
                  Belum ada data breakdown — mainkan pertandingan pakai mode Detail dulu.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rankedActions.map((a, i) => (
                    <div key={a.name} className="arena-card-static">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-arena-ink/5 font-display text-sm font-bold text-arena-ink">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-display text-sm font-bold uppercase tracking-wide text-arena-ink">
                              {a.name}
                            </p>
                            <p className="text-xs text-arena-dim">{a.total} aksi</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-arena-ink/10">
                        {a.total > 0 && (
                          <div className="flex h-full w-full">
                            <div
                              className="h-full"
                              style={{ width: `${(a.pointCount / a.total) * 100}%`, background: SPORT_GREEN }}
                            />
                            <div
                              className="h-full"
                              style={{ width: `${(a.outCount / a.total) * 100}%`, background: SPORT_AMBER }}
                            />
                            <div
                              className="h-full"
                              style={{ width: `${(a.foulCount / a.total) * 100}%`, background: SPORT_PINK }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-arena-dim">
                        <span>
                          <span
                            className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                            style={{ background: SPORT_GREEN }}
                          />
                          {a.pointCount} poin
                        </span>
                        <span>
                          <span
                            className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                            style={{ background: SPORT_AMBER }}
                          />
                          {a.outCount} out
                        </span>
                        <span>
                          <span
                            className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                            style={{ background: SPORT_PINK }}
                          />
                          {a.foulCount} kesalahan
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-arena-dim">
                          Efisiensi
                        </span>
                        <div className="flex flex-1 items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-arena-ink/10">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, a.efficiency))}%`,
                                background: a.efficiency >= 60 ? SPORT_GREEN : a.efficiency >= 35 ? SPORT_AMBER : SPORT_PINK,
                              }}
                            />
                          </div>
                          <span className="font-display text-xs font-bold text-arena-ink">
                            {a.efficiency.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
