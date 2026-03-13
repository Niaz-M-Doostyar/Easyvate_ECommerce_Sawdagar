"use client";
import { redirect } from "next/navigation";
export default function CategoryPage({ params }) {
  const { slug } = params;
  redirect(`/search?category=${slug}`);
}
