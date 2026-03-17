"use client";

/**
 * 401（セッション切れ）時に自動でログインページへリダイレクトするfetchラッパー
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    window.location.href = "/login";
  }
  return res;
}
