import React from "react";
import classes from "./AnalyticsChart.module.css"
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

function AnalyticsChart({
  type,
  data,
  xKey = "x",
  yKey = "y",
  dataKey = "value",
  title,
  barValueLabel,
  /** Для type="groupedBar": [{ key: "p0", label: "Период 1" }, ...] */
  series = [],
  /** Для type="groupedBar": форматирование значений в тултипе */
  groupedValueFormat,
  // colors = ["#0057C3", "#F44336", "#4CAF50", "#9575CD", "#9E9E9E", "#FF9800", "#638EA4", "#3B653D"],
  colors = ["#0057C3", "#2196f3", "#4CAF50", "#9575CD", "#ff9800", "#f44336", "#638EA4", "#3B653D"],
  height = 265,
  fullWidth = false,
}) {
  const isValidDateValue = (value) => {
    if (value === null || value === undefined) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  };

  const formatAxisLabel = (value) => {
    if (!isValidDateValue(value)) {
      return String(value ?? "");
    }

    const date = new Date(value);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatTooltipLabel = (label) => {
    if (!isValidDateValue(label)) {
      return String(label ?? "");
    }

    const date = new Date(label);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const renderChart = () => {
    if (!data || data.length === 0) return <p>Нет данных</p>;

    const chartHeight =
      type === "pie"
        ? Math.min(305, Math.max(height, 260 + Math.max(0, data.length - 5) * 22))
        : height;

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight} outline={false}>
            <BarChart data={data}
              margin={{ top: 0, right: 0, left: -19, bottom: 0 }}
            >
              <XAxis dataKey={xKey} tickFormatter={formatAxisLabel} />
              <YAxis />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #aab0dd5c", borderRadius: "8px" }}
                itemStyle={{ color: "#000" }}
                cursor={{ fill: "#9CA4D91A" }}
                formatter={(value, name) => {
                  if (name === 'count') return [value, 'Количество'];
                  if (name === 'hours') return [value, 'Часов'];
                  return [value, name];
                }}
                labelFormatter={formatTooltipLabel}
              />
              <Bar dataKey={yKey} fill={colors[0]} />

            </BarChart>
          </ResponsiveContainer>
        );

      case "simpleBar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight} outline={false}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf5" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval={0} angle={-28} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #aab0dd5c", borderRadius: "8px" }}
                itemStyle={{ color: "#000" }}
                cursor={{ fill: "#9CA4D91A" }}
                formatter={(value, name) => [value, name === yKey ? (barValueLabel || name) : name]}
                labelFormatter={(label) => String(label ?? "")}
              />
              <Bar dataKey={yKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "groupedBar": {
        if (!series?.length) {
          return <p>Нет серий для группировки</p>;
        }
        const formatGrouped = (v) =>
          typeof groupedValueFormat === "function"
            ? groupedValueFormat(v)
            : v;

        const seriesKeys = series.map((s) => s.key);
        /** Если ни в одной категории нет двух периодов сразу — один столбец на категорию (без «дыр» от null) */
        const anyCategoryHasBothPeriods = data.some((row) => {
          let withValue = 0;
          for (const k of seriesKeys) {
            const v = row[k];
            if (v !== null && v !== undefined) withValue += 1;
          }
          return withValue >= 2;
        });

        const periodLegend = (
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            content={() => (
              <ul
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  justifyContent: "center",
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                {series.map((s, i) => (
                  <li
                    key={s.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: colors[i % colors.length],
                        flexShrink: 0,
                      }}
                    />
                    <span>{s.label}</span>
                  </li>
                ))}
              </ul>
            )}
          />
        );

        if (!anyCategoryHasBothPeriods) {
          const singleData = data.map((row) => {
            let value = 0;
            let periodIndex = 0;
            for (let i = 0; i < seriesKeys.length; i++) {
              const k = seriesKeys[i];
              const v = row[k];
              if (v !== null && v !== undefined) {
                value = Number.isNaN(Number(v)) ? 0 : Number(v);
                periodIndex = i;
                break;
              }
            }
            return { ...row, value, periodIndex };
          });

          return (
            <ResponsiveContainer width="100%" height={chartHeight} outline={false}>
              <BarChart
                data={singleData}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                barCategoryGap="24%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf5" />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #aab0dd5c",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#000" }}
                  cursor={{ fill: "#9CA4D91A" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const pl = payload[0]?.payload;
                    const idx = pl?.periodIndex ?? 0;
                    const s = series[idx];
                    const num = Number(pl?.value) || 0;
                    return (
                      <div
                        style={{
                          background: "#fff",
                          border: "1px solid #aab0dd5c",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          {String(label ?? "")}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: colors[idx % colors.length],
                              flexShrink: 0,
                            }}
                          />
                          <span>
                            {s?.label}: {formatGrouped(num)}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                {periodLegend}
                <Bar
                  dataKey="value"
                  maxBarSize={48}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                >
                  {singleData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[entry.periodIndex % colors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={chartHeight} outline={false}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              barCategoryGap="24%"
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf5" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-28}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #aab0dd5c", borderRadius: "8px" }}
                itemStyle={{ color: "#000" }}
                cursor={{ fill: "#9CA4D91A" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #aab0dd5c",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        {String(label ?? "")}
                      </div>
                      {series.map((s, i) => {
                        const row = payload.find((p) => p.dataKey === s.key);
                        const raw = row?.value;
                        if (raw === null || raw === undefined) return null;
                        const num = Number.isNaN(Number(raw)) ? 0 : Number(raw);
                        return (
                          <div
                            key={s.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 4,
                            }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                background: colors[i % colors.length],
                                flexShrink: 0,
                              }}
                            />
                            <span>
                              {s.label}: {formatGrouped(num)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {periodLegend}
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={colors[i % colors.length]}
                  maxBarSize={40}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case "line":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data}
              margin={{ top: 0, right: 5, left: -30, bottom: 0 }}>
              <XAxis
                dataKey={xKey}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
                }}
              />
              <YAxis />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #aab0dd5c", borderRadius: "8px" }}
                itemStyle={{ color: "#000" }}
                cursor={{ fill: "#9CA4D91A" }}
                formatter={(value, name) => {
                  if (name === 'hours') return [value, 'Часов'];
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  });
                }}
              />
              <Line type="monotone" dataKey={yKey} stroke={colors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        const total = data.reduce((acc, item) => acc + item[dataKey], 0);

        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={xKey}
                outerRadius={90}
                innerRadius={70}
                paddingAngle={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #aab0dd5c", borderRadius: "8px" }}
                itemStyle={{ color: "#000" }}
                cursor={{ fill: "#9CA4D91A" }}
                formatter={(value, name) => [`${value}`, name]}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                content={({ payload }) => (
                  <ul style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    width: 210
                  }}>
                    {payload.map((entry, index) => {
                      const percent = Math.round((entry.payload[dataKey] / total) * 100);
                      return (
                        <li key={`item-${index}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: entry.color
                          }} />
                          <span style={{ fontSize: 16, color: "#333" }}>
                            {entry.value} — {percent || 0}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <p>Тип графика не поддерживается</p>;
    }
  };

  return (
    <div className={classes.container} style={fullWidth ? { width: "100%" } : undefined}>
      {title && <h4>{title}</h4>}
      {renderChart()}
    </div>
  );
}

export default AnalyticsChart;
