'use client'

import { useState, useRef, useCallback } from 'react'

// ─── 型別 ─────────────────────────────────────────────────────────────────────

type StepStatus = 'idle' | 'running' | 'done' | 'skipped' | 'error'

interface Step {
  id: number
  label: string
  tool: string
  desc: string
  status: StepStatus
  detail?: string
}

// ─── 預設流水線步驟 ────────────────────────────────────────────────────────────

const DEFAULT_STEPS: Step[] = [
  {
    id: 1,
    label: '語音轉文字',
    tool: 'Whisper',
    desc: '用 Whisper 把影片的聲音轉成 SRT 字幕檔',
    status: 'idle',
  },
  {
    id: 2,
    label: '自動快剪',
    tool: 'Auto-Editor',
    desc: '自動去除靜音與贅詞，保留精華片段',
    status: 'idle',
  },
  {
    id: 3,
    label: '裁切 9:16',
    tool: 'ffmpeg',
    desc: '裁切為 1080×1920 直式，適合 IG／YT Shorts／TikTok',
    status: 'idle',
  },
  {
    id: 4,
    label: '燒錄字幕',
    tool: 'ffmpeg + SRT',
    desc: '把 Whisper 產出的字幕硬燒進影片',
    status: 'idle',
  },
  {
    id: 5,
    label: '加標題字卡',
    tool: 'ImageMagick + ffmpeg',
    desc: '在開頭插入 2 秒標題字卡（可選）',
    status: 'idle',
  },
  {
    id: 6,
    label: '配樂混音',
    tool: 'ffmpeg',
    desc: '混入背景音樂，音量自動壓低至 15%（可選）',
    status: 'idle',
  },
]

// ─── 工具標籤顏色 ──────────────────────────────────────────────────────────────

const TOOL_COLORS: Record<string, string> = {
  Whisper: 'bg-violet-900 text-violet-200',
  'Auto-Editor': 'bg-emerald-900 text-emerald-200',
  ffmpeg: 'bg-blue-900 text-blue-200',
  'ffmpeg + SRT': 'bg-blue-900 text-blue-200',
  'ImageMagick + ffmpeg': 'bg-amber-900 text-amber-200',
}

// ─── 狀態圖示 ─────────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'running') {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-500 border-t-white" />
      </span>
    )
  }
  if (status === 'done') return <span className="text-emerald-400 text-lg">✓</span>
  if (status === 'skipped') return <span className="text-stone-500 text-lg">–</span>
  if (status === 'error') return <span className="text-red-400 text-lg">✗</span>
  return <span className="text-stone-600 text-lg">○</span>
}

// ─── 主頁面 ───────────────────────────────────────────────────────────────────

export default function VideoEditorPage() {
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const videoInputRef = useRef<HTMLInputElement>(null)
  const musicInputRef = useRef<HTMLInputElement>(null)

  const appendLog = (msg: string) => setLog(prev => [...prev, msg])

  const resetSteps = () => setSteps(DEFAULT_STEPS.map(s => ({ ...s, status: 'idle' })))

  const updateStep = (id: number, patch: Partial<Step>) =>
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))

  // ─── 模擬流水線（本地工具由 API route 觸發，這裡模擬進度）──────────────────

  const runPipeline = useCallback(async () => {
    if (!videoFile) return
    setIsProcessing(true)
    setResultUrl(null)
    setLog([])
    resetSteps()

    const formData = new FormData()
    formData.append('video', videoFile)
    if (musicFile) formData.append('music', musicFile)
    if (title) formData.append('title', title)

    appendLog('上傳影片中…')

    try {
      const res = await fetch('/api/process-video', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok || !res.body) {
        throw new Error(`伺服器錯誤：${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'step') {
              updateStep(event.id, { status: event.status, detail: event.detail })
              appendLog(`[步驟 ${event.id}] ${event.label}：${event.status}`)
            } else if (event.type === 'log') {
              appendLog(event.message)
            } else if (event.type === 'done') {
              setResultUrl(event.url)
              appendLog('完成！')
            } else if (event.type === 'error') {
              appendLog(`錯誤：${event.message}`)
            }
          } catch {
            // 忽略解析錯誤
          }
        }
      }
    } catch (err) {
      appendLog(`錯誤：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }, [videoFile, musicFile, title])

  // ─── 拖放處理 ─────────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('video/')) setVideoFile(file)
  }

  // ─── 渲染 ─────────────────────────────────────────────────────────────────

  const allDone = steps.every(s => s.status === 'done' || s.status === 'skipped')
  const hasAnyProgress = steps.some(s => s.status !== 'idle')

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-stone-200 font-serif p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-10">

        {/* 標題 */}
        <header className="space-y-2">
          <h1 className="text-3xl font-light tracking-wide">9:16 短影音剪輯</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            把原始影片丟進來，自動完成 6 個步驟，輸出直式短影音。
          </p>
        </header>

        {/* 上傳區 */}
        <section className="space-y-4">
          <h2 className="text-xs text-stone-500 uppercase tracking-widest">素材</h2>

          {/* 影片拖放 */}
          <div
            className={`relative border rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-stone-400 bg-stone-800'
                : videoFile
                ? 'border-emerald-700 bg-emerald-950/30'
                : 'border-stone-700 bg-stone-900/40 hover:border-stone-500'
            }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => videoInputRef.current?.click()}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
            />
            {videoFile ? (
              <div className="space-y-1">
                <p className="text-emerald-300 text-sm">{videoFile.name}</p>
                <p className="text-stone-500 text-xs">
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-2xl text-stone-600">↑</p>
                <p className="text-stone-400 text-sm">點選或拖放原始影片</p>
                <p className="text-stone-600 text-xs">MP4、MOV、MKV…</p>
              </div>
            )}
          </div>

          {/* 標題文字 */}
          <div>
            <label className="block text-xs text-stone-500 mb-1">標題字卡文字（可選）</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：Claude Code 真的太猛"
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>

          {/* 背景音樂 */}
          <div>
            <label className="block text-xs text-stone-500 mb-1">背景音樂（可選）</label>
            <div
              className="border border-stone-700 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-stone-500 transition-colors flex items-center gap-2"
              onClick={() => musicInputRef.current?.click()}
            >
              <input
                ref={musicInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={e => setMusicFile(e.target.files?.[0] ?? null)}
              />
              {musicFile ? (
                <span className="text-stone-300">{musicFile.name}</span>
              ) : (
                <span className="text-stone-600">選擇 MP3／WAV 音樂檔…</span>
              )}
            </div>
          </div>
        </section>

        {/* 流水線步驟 */}
        <section className="space-y-4">
          <h2 className="text-xs text-stone-500 uppercase tracking-widest">流水線</h2>

          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={`flex items-start gap-4 rounded-xl border px-5 py-4 transition-colors ${
                  step.status === 'running'
                    ? 'border-stone-500 bg-stone-800/60'
                    : step.status === 'done'
                    ? 'border-emerald-900 bg-emerald-950/20'
                    : step.status === 'error'
                    ? 'border-red-900 bg-red-950/20'
                    : 'border-stone-800 bg-stone-900/30'
                }`}
              >
                {/* 序號 + 狀態 */}
                <div className="flex-none w-8 pt-0.5 text-center">
                  {hasAnyProgress ? (
                    <StepIcon status={step.status} />
                  ) : (
                    <span className="text-stone-600 text-sm">{i + 1}</span>
                  )}
                </div>

                {/* 文字 */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-stone-200">{step.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono ${
                        TOOL_COLORS[step.tool] ?? 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {step.tool}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{step.desc}</p>
                  {step.detail && (
                    <p className="text-xs text-stone-400 font-mono">{step.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 執行按鈕 */}
        <div className="flex items-center gap-4">
          <button
            onClick={runPipeline}
            disabled={!videoFile || isProcessing}
            className="px-8 py-3 rounded-xl bg-stone-200 text-stone-900 text-sm font-medium transition-opacity disabled:opacity-30 hover:bg-white disabled:cursor-not-allowed"
          >
            {isProcessing ? '處理中…' : '開始剪輯'}
          </button>
          {hasAnyProgress && !isProcessing && (
            <button
              onClick={() => { resetSteps(); setResultUrl(null); setLog([]) }}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              重置
            </button>
          )}
        </div>

        {/* 完成下載 */}
        {resultUrl && (
          <div className="border border-emerald-800 bg-emerald-950/30 rounded-xl px-6 py-5 space-y-3">
            <p className="text-emerald-300 text-sm">影片處理完成！</p>
            <a
              href={resultUrl}
              download
              className="inline-block px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
            >
              下載 9:16 短影音
            </a>
          </div>
        )}

        {/* 日誌 */}
        {log.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs text-stone-500 uppercase tracking-widest">執行紀錄</h2>
            <div className="bg-stone-950 border border-stone-800 rounded-xl px-5 py-4 max-h-48 overflow-y-auto font-mono text-xs text-stone-400 space-y-0.5">
              {log.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>
        )}

        {/* 安裝說明 */}
        <section className="space-y-3 border-t border-stone-800 pt-8">
          <h2 className="text-xs text-stone-500 uppercase tracking-widest">工具安裝</h2>
          <div className="bg-stone-950 border border-stone-800 rounded-xl px-5 py-4 font-mono text-xs text-stone-400 space-y-1">
            <p className="text-stone-500"># Python 工具</p>
            <p>pip install openai-whisper auto-editor requests</p>
            <p></p>
            <p className="text-stone-500"># macOS</p>
            <p>brew install ffmpeg imagemagick</p>
            <p></p>
            <p className="text-stone-500"># Ubuntu / Debian</p>
            <p>apt install ffmpeg imagemagick</p>
            <p></p>
            <p className="text-stone-500"># 執行腳本</p>
            <p>chmod +x scripts/clip.sh</p>
            <p>./scripts/clip.sh raw.mp4 &quot;標題&quot; bg_music.mp3</p>
            <p></p>
            <p className="text-stone-500"># B-roll 下載（需 Pexels API Key）</p>
            <p>export PEXELS_API_KEY=&quot;你的金鑰&quot;</p>
            <p>python scripts/pexels_broll.py &quot;科技 辦公室&quot; --count 3</p>
          </div>
        </section>

      </div>
    </main>
  )
}
