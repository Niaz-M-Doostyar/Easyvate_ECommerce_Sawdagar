"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { href: "/dashboard", icon: "far fa-gauge-high", label: "Dashboard" },
  { href: "/profile", icon: "far fa-user", label: "My Profile" },
  { href: "/orders", icon: "far fa-shopping-bag", label: "Orders" },
  { href: "/wishlist", icon: "far fa-heart", label: "My Wishlist" },
  { href: "/cart", icon: "far fa-cart-shopping", label: "Cart" },
  { href: "/setting", icon: "far fa-gear", label: "Settings" },
];

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="user-area bg-2 py-100">
      <div className="container">
        <div className="row">
          <div className="col-lg-3">
            <div className="sidebar">
              <div className="sidebar-top">
                <div className="sidebar-profile-img">
                  <img src="/assets/img/account/03.jpg" alt="" />
                </div>
                <h5>{user?.fullName || "User"}</h5>
                <p>{user?.email || ""}</p>
              </div>
              <ul className="sidebar-list">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={pathname === item.href ? "active" : ""}>
                      <i className={item.icon}></i> {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
                    <i className="far fa-sign-out"></i> Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-lg-9">
            <div className="user-wrapper">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
