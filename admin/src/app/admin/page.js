"use client";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminStats, useAdminChartData } from "@/hooks/useAdminApi";
import { BarChart, MiniLineChart, DonutChart } from "@/components/Charts";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatPrice } from "@/lib/currency";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [chartDays, setChartDays] = useState(30);
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: chartData } = useAdminChartData(chartDays);
  const s = stats || {};

  const cards = [
    { label: t("orders"), value: s.totalOrders || 0, color: "bg-primary/10 text-primary", href: "/admin/orders", icon: "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" },
    { label: "Today", value: s.todayOrders || 0, color: "bg-green/10 text-green", href: "/admin/orders", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
    { label: t("revenue"), value: formatPrice(s.totalRevenue || 0), color: "bg-yellow/10 text-yellow", href: "/admin/reports", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: t("profit"), value: formatPrice(s.totalProfit || 0), color: "bg-green/10 text-green", href: "/admin/reports", icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
    { label: t("pending"), value: s.pendingApprovals || 0, color: "bg-red/10 text-red", href: "/admin/products?status=pending", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
    { label: t("blog"), value: s.totalBlogPosts || 0, color: "bg-primary/10 text-primary", href: "/admin/blog", icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" },
    { label: t("customer"), value: s.totalCustomers || 0, color: "bg-primary/10 text-primary", href: "/admin/users?role=customer", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" },
    { label: t("supplier"), value: s.totalSuppliers || 0, color: "bg-navy/10 text-navy", href: "/admin/users?role=supplier", icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" },
  ];

  const statusColor = { pending: "badge-yellow", confirmed: "badge-blue", shipped: "badge-primary", delivered: "badge-green", cancelled: "badge-red" };
  const revenueData = (chartData || []).map(d => ({ label: d.date?.slice(5) || "", value: d.revenue || 0 }));
  const profitData = (chartData || []).map(d => ({ value: d.profit || 0 }));
  const ordersData = (chartData || []).map(d => ({ value: d.orders || 0 }));

  if (statsLoading) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t("dashboard")}</h1></div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => (
          <Link key={i} href={c.href} className="card stat-card hover:shadow-md transition-shadow group">
            <div className={`stat-icon ${c.color}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={c.icon} /></svg>
            </div>
            <div className="flex-1">
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
            <svg className="w-4 h-4 text-body opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 card card-p">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">{t("revenue")} Trend</h3>
            <div className="flex gap-1">
              {[{ label: "7D", val: 7 }, { label: "14D", val: 14 }, { label: "30D", val: 30 }, { label: "90D", val: 90 }].map(p => (
                <button key={p.val} onClick={() => setChartDays(p.val)} className={`px-2.5 py-1 text-xs font-semibold rounded ${chartDays === p.val ? "bg-primary text-white" : "text-body hover:text-navy bg-gray-50"}`}>{p.label}</button>
              ))}
            </div>
          </div>
          <BarChart data={revenueData} height={220} color="#38B6FF" />
        </div>
        <div className="card card-p space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-navy mb-2">{t("profit")} Trend</h4>
            <MiniLineChart data={profitData} height={70} color="#11B76B" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy mb-2">{t("orders")} Volume</h4>
            <MiniLineChart data={ordersData} height={70} color="#FBA707" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy mb-2">Orders by Status</h4>
            <DonutChart size={110} strokeWidth={14} segments={[
              { value: s.ordersByStatus?.pending || 0, color: "#FBA707" },
              { value: s.ordersByStatus?.confirmed || 0, color: "#38B6FF" },
              { value: s.ordersByStatus?.shipped || 0, color: "#053262" },
              { value: s.ordersByStatus?.delivered || 0, color: "#11B76B" },
              { value: s.ordersByStatus?.cancelled || 0, color: "#FD6A6A" },
            ]} />
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-[10px]">
              {[{ l: "Pending", c: "#FBA707" }, { l: "Confirmed", c: "#38B6FF" }, { l: "Shipped", c: "#053262" }, { l: "Delivered", c: "#11B76B" }, { l: "Cancelled", c: "#FD6A6A" }].map(x => (
                <span key={x.l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: x.c }} />{x.l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-navy">Quick Actions</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-4">
          {[
            { label: "Pending Products", href: "/admin/products?status=pending", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z", count: s.pendingApprovals },
            { label: "Manage Users", href: "/admin/users", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
            { label: "Website Content", href: "/admin/content", icon: "M19.5 6.75h-15m15 5.25h-15m15 5.25h-15" },
            { label: "View Reports", href: "/admin/reports", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" },
            { label: "Blog Posts", href: "/admin/blog", icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" },
          ].map((a, i) => (
            <Link key={i} href={a.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
              </div>
              <span className="flex-1 font-semibold text-sm text-navy">{a.label}</span>
              {a.count > 0 && <span className="badge badge-red">{a.count}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
