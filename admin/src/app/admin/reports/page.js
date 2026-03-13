"use client";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminReportSummary, useAdminChartData } from "@/hooks/useAdminApi";
import { BarChart, DonutChart } from "@/components/Charts";
import { CSVButton } from "@/components/CSVExport";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatPrice, formatPriceDecimal } from "@/lib/currency";

export default function AdminReports() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState("month");
  const [chartDays, setChartDays] = useState(30);
  const { data: report, isLoading } = useAdminReportSummary(period);
  const { data: chartData } = useAdminChartData(chartDays);

  const r = report || {};
  const revenueData = (chartData || []).map(d => ({ label: d.date?.slice(5) || "", value: d.revenue || 0 }));
  const ordersChartData = (chartData || []).map(d => ({ label: d.date?.slice(5) || "", value: d.orders || 0 }));

  const orderStatusSegments = Object.entries(r.ordersByStatus || {}).map(([status, count]) => ({
    value: count,
    color: { pending: "#FBA707", confirmed: "#38B6FF", shipped: "#053262", delivered: "#11B76B", cancelled: "#FD6A6A" }[status] || "#999",
    label: status,
  }));

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t("reports")}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            {[{label:"Day",val:"day"},{label:"Week",val:"week"},{label:"Month",val:"month"}].map(p => (
              <button key={p.val} onClick={() => setPeriod(p.val)} className={`btn btn-sm ${period === p.val ? "btn-primary" : "btn-outline"}`}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("revenue"), value: formatPrice(r.totalRevenue || 0), color: "bg-primary/10 text-primary", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: t("profit"), value: formatPrice(r.totalProfit || 0), color: "bg-green/10 text-green", icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
          { label: "Total Orders", value: r.totalOrders || 0, color: "bg-yellow/10 text-yellow", icon: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" },
          { label: "Avg Order", value: formatPriceDecimal(r.averageOrder || 0), color: "bg-navy/10 text-navy", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" },
        ].map((c, i) => (
          <div key={i} className="card stat-card">
            <div className={`stat-icon ${c.color}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={c.icon} /></svg>
            </div>
            <div><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 card card-p">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">Revenue Over Time</h3>
            <div className="flex gap-1">
              {[{ label: "7D", val: 7 }, { label: "14D", val: 14 }, { label: "30D", val: 30 }, { label: "90D", val: 90 }].map(p => (
                <button key={p.val} onClick={() => setChartDays(p.val)} className={`px-2.5 py-1 text-xs font-semibold rounded ${chartDays === p.val ? "bg-primary text-white" : "text-body hover:text-navy bg-gray-50"}`}>{p.label}</button>
              ))}
            </div>
          </div>
          <BarChart data={revenueData} height={220} color="#38B6FF" />
        </div>
        <div className="card card-p">
          <h3 className="font-semibold text-navy mb-4">Orders by Status</h3>
          <div className="flex flex-col items-center">
            <DonutChart size={140} strokeWidth={18} segments={orderStatusSegments} />
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-4 text-xs">
              {orderStatusSegments.map(seg => (
                <span key={seg.label} className="flex items-center gap-1.5 capitalize">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  {seg.label}: <strong>{seg.value}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Volume Chart */}
      <div className="card card-p mb-6">
        <h3 className="font-semibold text-navy mb-4">Daily Orders Volume</h3>
        <BarChart data={ordersChartData} height={160} color="#11B76B" />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-navy">Top Products</h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {(r.topProducts || []).length === 0 && <tr><td colSpan={3} className="text-center py-6 text-body text-sm">No data</td></tr>}
                {(r.topProducts || []).map((p, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-navy text-sm">{p.name}</td>
                    <td><span className="badge badge-blue">{p.sold}</span></td>
                    <td className="font-semibold">{formatPrice(p.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-navy">Supplier Payables</h3>
            <CSVButton type="supplier_payables" period={period} label="Export" />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("supplier")}</th><th>Amount Due</th></tr></thead>
              <tbody>
                {(r.supplierPayables || []).length === 0 && <tr><td colSpan={2} className="text-center py-6 text-body text-sm">No data</td></tr>}
                {(r.supplierPayables || []).map((s, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-navy text-sm">{s.supplier}</td>
                    <td className="font-semibold text-red">{formatPrice(s.amount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sponsorship Revenue */}
      <div className="card card-p">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy">Sponsorship Revenue</h3>
        </div>
        <div className="text-center py-6">
          <div className="text-5xl font-bold text-primary mb-2">{formatPrice(r.sponsorshipRevenue || 0)}</div>
          <p className="text-body">Total sponsorship income this {period}</p>
        </div>
      </div>

      {/* Export Section */}
      <div className="card card-p mt-6">
        <h3 className="font-semibold text-navy mb-4">Export Data</h3>
        <div className="flex flex-wrap gap-3">
          <CSVButton type="orders" period={period} label="Export Orders" />
          <CSVButton type="products" label="Export Products" />
          <CSVButton type="users" label="Export Users" />
          <CSVButton type="supplier_payables" period={period} label="Export Payables" />
        </div>
      </div>
    </div>
  );
}
