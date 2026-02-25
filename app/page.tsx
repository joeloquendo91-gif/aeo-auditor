'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState('')

  async function analyze() {
    if (!url) return
    setLoading(true)
    setError('')
    setReport(null)

    setStatus('Fetching content...')
    await new Promise(r => setTimeout(r, 800))
    setStatus('Extracting entities with Google NLP...')
    await new Promise(r => setTimeout(r, 800))
    setStatus('Running AEO audit with Claude...')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, keyword })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReport(data)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AEO Content Auditor</h1>
          <p className="text-gray-500">Find out why AI systems aren't citing your content — and how to fix it.</p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Page URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/your-page"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Keyword <span className="text-gray-400 font-normal">(optional but recommended)</span></label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="e.g. IVF treatment options"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={analyze}
            disabled={loading || !url}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? status : 'Analyze Content'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-8">
            {error}
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-semibold text-gray-900">{report.content.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{url}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(report.audit)}
                className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-3 py-1.5"
              >
                Copy Report
              </button>
            </div>

            {/* Entities */}
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Entities Detected</p>
              <div className="flex flex-wrap gap-2">
                {report.entities?.slice(0, 8).map((e: any, i: number) => (
                  <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                    {e.name} <span className="text-gray-400">{(e.salience * 100).toFixed(0)}%</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Audit */}
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {report.audit}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}