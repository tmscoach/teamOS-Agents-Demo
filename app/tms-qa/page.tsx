"use client";

import { useState } from "react";

const exampleQuestions = [
  "What is an outer wheel creator innovator and how is it different from an inner wheel creator innovator?",
  "What are the key components of the TMP assessment?",
  "How does the QO2 framework measure team effectiveness?",
  "What is the difference between a Coordinator and an Implementer role?",
  "Explain the Team Signals methodology",
  "What are the stages of team development according to TMS?",
  "How do you identify dysfunction in a team using TMS tools?",
];

export default function TMSQAPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch("/api/test-rag-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    }
    
    setLoading(false);
  };

  const useExample = (exampleQ: string) => {
    setQuestion(exampleQ);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">TMS Knowledge Base Q&A</h1>
      <p className="text-gray-600 mb-6">
        Ask questions about Team Management Systems methodology and get answers based on the loaded TMS documents.
      </p>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <label className="block text-sm font-medium mb-2">Your Question:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
            placeholder="Ask about TMS methodology, assessments, team roles, etc."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={askQuestion}
            disabled={loading || !question.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Ask"}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Example Questions:</h3>
        <div className="space-y-2">
          {exampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => useExample(q)}
              className="block text-left w-full p-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
            >
              → {q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-700">Searching TMS knowledge base and generating answer...</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.success ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-3">Answer:</h3>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{result.answer}</p>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Search Details:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Found {result.context.chunksFound} relevant chunks</li>
                  <li>• Search method: {result.context.searchMethod}</li>
                  <li>• Sources consulted: {result.context.sources.join(', ') || 'Various documents'}</li>
                </ul>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="bg-gray-50 p-4 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-sm">Debug Information</summary>
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(result.debug, null, 2)}
                  </pre>
                </details>
              )}
            </>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-700">Error: {result.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> This uses keyword search to find relevant document chunks since vector similarity search 
          requires the pgvector extension. Results may be less accurate than true semantic search.
        </p>
        <p className="mt-2">
          Database contains 47 TMS documents with 12,484 searchable chunks including handbooks, 
          questionnaires, reports, and research materials.
        </p>
      </div>
    </div>
  );
}