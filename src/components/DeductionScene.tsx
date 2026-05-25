'use client'

import { useState } from 'react'
import { useGame } from '@/lib/gameContext'

const QUESTIONS = [
  {
    id: 'victim',
    prompt: '昨晚清淨院主殿裡，死去的人是誰？',
    options: [
      { id: 'a', label: '行空法師（林志遠）', sub: '他試圖逃離，在火起之前遇害' },
      { id: 'b', label: '廖子豪——那個失蹤的記者', sub: '死者不是行空' },
      { id: 'c', label: '無法判斷', sub: '現有線索不足以確認' },
    ],
  },
  {
    id: 'whereIsLinzhiyuan',
    prompt: '林志遠——行空法師——昨夜去了哪裡？',
    options: [
      { id: 'a', label: '他在火災中死亡', sub: '遺體可能在別處或未被發現' },
      { id: 'b', label: '他趁火逃走，再次消失', sub: '和十五年前一樣，他讓一個人死了，然後不見了' },
      { id: 'c', label: '他早在昨夜之前就已離開', sub: '清淨院裡根本沒有行空' },
    ],
  },
  {
    id: 'whySheWent',
    prompt: '你為什麼違背了和廖子豪的約定，昨晚獨自上山？',
    options: [
      { id: 'a', label: '因為我擔心廖子豪', sub: '我知道他的目的不單純，他可能有危險' },
      { id: 'b', label: '因為我等不及了', sub: '十五年了，我再也等不下去' },
      { id: 'c', label: '我不知道', sub: '那四個小時的空白，我至今不明白自己的選擇' },
    ],
  },
]

const REVEAL_TEXT = `真相一：主殿裡死去的人，是廖子豪。

行空從不穿舊袍進主殿。三年，無一例外。
死者穿著舊款僧袍——所以死者不是行空。

草稿 #3：廖子豪昨晚在後院等他。
你的記憶：那個轉頭的人說「你不應該來的。」
那是廖子豪的聲音。

真相二：林志遠——再次消失了。

他利用那場火，趁亂離開了清淨院。
和十五年前一樣。
他讓另一個人留在他該在的地方。

還剩下一個問題。

你為什麼違背了承諾？

這個問題，沒有線索可以回答。
答案在你的記憶缺口裡。
也在你選擇的那個答案裡。`

export default function DeductionScene() {
  const { dispatch } = useGame()
  const [step, setStep] = useState<'q0' | 'q1' | 'q2' | 'reveal' | 'done'>('q0')
  const [answers, setAnswers] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const questionIndex = step === 'q0' ? 0 : step === 'q1' ? 1 : step === 'q2' ? 2 : -1
  const question = questionIndex >= 0 ? QUESTIONS[questionIndex] : null

  const handleConfirm = () => {
    if (!selected) return
    const newAnswers = [...answers, selected]
    setAnswers(newAnswers)
    setSelected(null)
    if (step === 'q0') setStep('q1')
    else if (step === 'q1') setStep('q2')
    else if (step === 'q2') setStep('reveal')
  }

  if (step === 'reveal' || step === 'done') {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          <div>
            <p className="text-stone-500 text-xs tracking-widest">第一幕 · 推理呈堂</p>
            <div className="w-8 h-px bg-stone-800 mt-3" />
          </div>
          <p className="text-stone-200 text-sm leading-loose font-serif whitespace-pre-line">
            {REVEAL_TEXT}
          </p>
        </div>
        <div className="px-6 pb-8 pt-3 border-t border-stone-900 flex-shrink-0">
          <button
            onClick={() => dispatch({ type: 'DEDUCTION_COMPLETE' })}
            className="w-full border border-stone-600 text-stone-300 text-sm py-3 hover:border-stone-400 hover:text-stone-100 transition-colors duration-200 tracking-wider"
          >
            呈交推理
          </button>
        </div>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col">
      <div className="px-5 pt-6 pb-4 flex-shrink-0">
        <p className="text-stone-500 text-xs tracking-widest">
          第一幕 · 推理呈堂 · {questionIndex + 1} / {QUESTIONS.length}
        </p>
        <div className="w-8 h-px bg-stone-800 mt-3 mb-4" />
        <p className="text-stone-200 text-base font-serif leading-relaxed">
          {question.prompt}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-4">
        {question.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`w-full text-left border py-3 px-4 transition-colors duration-150 ${
              selected === opt.id
                ? 'border-stone-400 bg-stone-900'
                : 'border-stone-800 hover:border-stone-600'
            }`}
          >
            <p className={`text-sm font-serif ${selected === opt.id ? 'text-stone-100' : 'text-stone-400'}`}>
              {opt.label}
            </p>
            <p className="text-stone-600 text-xs mt-0.5">{opt.sub}</p>
          </button>
        ))}
      </div>

      <div className="px-5 pb-8 pt-3 border-t border-stone-900 flex-shrink-0">
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className={`w-full text-sm py-3 transition-colors duration-200 tracking-wider ${
            selected
              ? 'border border-stone-500 text-stone-200 hover:border-stone-300 hover:text-stone-100'
              : 'border border-stone-900 text-stone-700 cursor-not-allowed'
          }`}
        >
          確認
        </button>
      </div>
    </div>
  )
}
