"use client";

import { useEffect } from "react";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID as string | undefined;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID as string | undefined;

function injectGtag(id: string) {
  if (!id) return;
  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s1);

  const s2 = document.createElement("script");
  s2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${id}', { send_page_view: true });`;
  document.head.appendChild(s2);
}

function injectGtm(id: string) {
  if (!id) return;
  const s = document.createElement("script");
  s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
  document.head.appendChild(s);

  const ns = document.createElement("noscript");
  ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.appendChild(ns);
}

function hasConsent(): boolean {
  try {
    const v = localStorage.getItem("ef_consent");
    return v === "yes";
  } catch (e) {
    return false;
  }
}

export default function Analytics(): null {
  useEffect(() => {
    if (!hasConsent()) return;

    if (GTM_ID) injectGtm(GTM_ID);
    if (GA4_ID) injectGtag(GA4_ID);
  }, []);

  return null;
}
