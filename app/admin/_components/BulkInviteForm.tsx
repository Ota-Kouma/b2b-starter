"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = { email: string; name: string; role: string };
type ResultRow = Row & { status: "ok" | "error"; message?: string };

const VALID_ROLES = ["COMPANY_ADMIN", "COMPANY_MANAGER", "COMPANY_AUDITOR", "EMPLOYEE"];

function parseCSV(text: string): { rows: Row[]; errors: string[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const errors: string[] = [];
  const rows: Row[] = [];

  if (lines.length === 0) return { rows, errors: ["ファイルが空です"] };

  // ヘッダー行を検出
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  const nameIdx = header.indexOf("name");
  const roleIdx = header.indexOf("role");

  if (emailIdx === -1) return { rows, errors: ["emailカラムが見つかりません"] };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const email = cols[emailIdx] ?? "";
    const name = nameIdx !== -1 ? (cols[nameIdx] ?? "") : "";
    const role = roleIdx !== -1 ? (cols[roleIdx] ?? "").toUpperCase() : "EMPLOYEE";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`行${i + 1}: 無効なメールアドレス「${email}」`);
      continue;
    }

    const resolvedRole = VALID_ROLES.includes(role) ? role : "EMPLOYEE";
    rows.push({ email, name, role: resolvedRole });
  }

  return { rows, errors };
}

export function BulkInviteForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<Row[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    setResults(null);
    const text = await f.text();
    const { rows, errors } = parseCSV(text);
    setPreview(rows);
    setParseErrors(errors);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }

  function handleRemove() {
    setFile(null);
    setPreview(null);
    setParseErrors([]);
    setResults(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0) return;
    setRunning(true);
    setProgress(0);
    const resultRows: ResultRow[] = [];

    for (let i = 0; i < preview.length; i++) {
      const row = preview[i];
      try {
        const res = await fetch("/api/admin/users/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: row.email, name: row.name || undefined, role: row.role }),
        });
        const data = await res.json();
        if (res.ok) {
          resultRows.push({ ...row, status: "ok" });
        } else {
          resultRows.push({ ...row, status: "error", message: data.error ?? "不明なエラー" });
        }
      } catch {
        resultRows.push({ ...row, status: "error", message: "ネットワークエラー" });
      }
      setProgress(i + 1);
    }

    setResults(resultRows);
    setRunning(false);
  }

  const ROLE_LABEL: Record<string, string> = {
    COMPANY_ADMIN: "会社管理者",
    COMPANY_MANAGER: "マネージャー",
    COMPANY_AUDITOR: "監査者",
    EMPLOYEE: "社員",
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">ファイルをドロップ、またはクリックして選択</p>
          <p className="text-xs text-gray-400 mt-1">CSV形式（email, name, role）</p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleChange} />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <FileText className="w-5 h-5 text-gray-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          {!running && (
            <button onClick={handleRemove} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {parseErrors.length > 0 && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-3 space-y-1">
          {parseErrors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {preview && preview.length > 0 && !results && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 border-b">
            プレビュー（{preview.length}件）
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">メール</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">名前</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">ロール</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2 text-gray-500">{row.name || "-"}</td>
                    <td className="px-3 py-2">{ROLE_LABEL[row.role] ?? row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {running && (
        <div className="text-sm text-gray-600 text-center">
          処理中... {progress} / {preview?.length}
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${((progress / (preview?.length ?? 1)) * 100).toFixed(0)}%` }}
            />
          </div>
        </div>
      )}

      {results && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 border-b flex justify-between">
            <span>結果</span>
            <span>
              成功 {results.filter((r) => r.status === "ok").length} / {results.length}件
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <tbody className="divide-y">
                {results.map((row, i) => (
                  <tr key={i} className={row.status === "ok" ? "" : "bg-red-50"}>
                    <td className="px-3 py-2 w-6">
                      {row.status === "ok"
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    </td>
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2 text-gray-400">{row.message ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!results && (
        <Button
          disabled={!preview || preview.length === 0 || running}
          className="w-full"
          onClick={handleSubmit}
        >
          {running ? "招待中..." : `一括招待を実行${preview ? `（${preview.length}件）` : ""}`}
        </Button>
      )}

      {!file && (
        <p className="text-xs text-gray-400 text-center">
          フォーマット例: email,name,role / yamada@example.com,山田太郎,EMPLOYEE
        </p>
      )}
    </div>
  );
}
