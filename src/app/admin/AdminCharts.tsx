"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export function RegistrationChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#888" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#888" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8F0EE" }}
          formatter={(v) => [`${v}件`, "新規登録"]}
        />
        <Bar dataKey="count" fill="#0D686E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LoginRateChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#888" }} />
        <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: "#888" }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8F0EE" }}
          formatter={(v) => [`${v}%`, "ログイン率"]}
        />
        <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
