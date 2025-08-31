import React, { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import './Dashboard.css';

const Dashboard = ({ currentUser }) => {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:5000/data", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/data/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const needsUpload = !dashboardData || (!dashboardData.sales?.length && !dashboardData.quantity?.length);

  const totalSales = dashboardData?.sales?.reduce((acc, item) => acc + item.value, 0) || 0;
  const totalQuantity = dashboardData?.quantity?.reduce((acc, item) => acc + item.value, 0) || 0;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {currentUser?.username}</h2>
      <p>Your role: <strong>{currentUser?.role}</strong></p>

      {currentUser?.role === "admin" && (
        <form onSubmit={handleFileUpload} className="upload-form">
          <input type="file" name="file" accept=".csv" />
          <button type="submit" className="success-btn">Upload CSV</button>
        </form>
      )}

      {!needsUpload && (
        <>
          <div className="summary-cards">
            <SummaryCard title="Total Sales" value={totalSales} />
            <SummaryCard title="Total Quantity" value={totalQuantity} />
          </div>
          <div className="charts">
            <ChartCard title="Sales Over Time" data={dashboardData.sales} />
            <ChartCard title="Quantity Over Time" data={dashboardData.quantity} />
          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value }) => (
  <div className="summary-card">
    <h3>{title}</h3>
    <p>{value.toLocaleString()}</p>
  </div>
);

const ChartCard = ({ title, data }) => (
  <div className="chart-card">
    <h3>{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#1E40AF" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default Dashboard;
