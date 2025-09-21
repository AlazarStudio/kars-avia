import React from "react";
import classes from "./AnalyticsChart.module.css"
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  Legend
} from "recharts";

function AnalyticsChart({
  type,
  data,
  xKey = "x",
  yKey = "y",
  dataKey = "value",
  title,
  // colors = ["#0057C3", "#F44336", "#4CAF50", "#9575CD", "#9E9E9E", "#FF9800", "#638EA4", "#3B653D"],
  colors = ["#0057C3", "#2196f3", "#4CAF50", "#9575CD", "#ff9800", "#f44336", "#638EA4", "#3B653D"],
  height = 250
}) {
  const renderChart = () => {
    if (!data || data.length === 0) return <p>Нет данных</p>;

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height} outline={false}>
            <BarChart data={data}
              margin={{ top: 0, right: 0, left: -19, bottom: 0 }}
            >
              <XAxis dataKey={xKey} tickFormatter={(tick) => {
                const date = new Date(tick);
                return date.toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit'
                });
              }} />
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
                labelFormatter={(label) => {
                  const date = new Date(label);
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}.${month}.${year}`;
                }}
              />
              <Bar dataKey={yKey} fill={colors[0]} />

            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
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
          <ResponsiveContainer width="100%" height={height}>
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
    <div className={classes.container}>
      {title && <h4>{title}</h4>}
      {renderChart()}
    </div>
  );
}

export default AnalyticsChart;
