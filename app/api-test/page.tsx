"use client";

import { useState } from "react";

export default function APITestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ error?: string; [key: string]: unknown } | null>(null);
  const [message, setMessage] = useState("");

  const testDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/test-db");
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testOpenAI = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/test-openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message || "Hello" }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testVector = async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/test-vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action,
          query: message || "team performance",
          documentContent: "Test document about TMS methodology and team transformation."
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4">Database Test</h2>
          <button
            onClick={testDatabase}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Database Connection"}
          </button>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4">OpenAI Test</h2>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message"
            className="border px-3 py-2 rounded mr-2 w-64"
          />
          <button
            onClick={testOpenAI}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test OpenAI"}
          </button>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-4">Vector Database Test</h2>
          <div className="space-y-2">
            <button
              onClick={() => testVector("check-status")}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 mr-2"
            >
              Check Status
            </button>
            <button
              onClick={() => testVector("test-embedding")}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 mr-2"
            >
              Test Embedding
            </button>
            <button
              onClick={() => testVector("create-document")}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 mr-2"
            >
              Create Document
            </button>
            <button
              onClick={() => testVector("test-search")}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Search
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Tests document storage, embeddings, and vector search capabilities
          </p>
        </div>

        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}