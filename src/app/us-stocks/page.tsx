import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '普通人玩美股攻略',
  description: '普通人玩美股不知道要買什麼？兩個簡單思路：定投指數 + 跟著特朗普買',
}

const trackingSites = [
  {
    name: 'Open Cabinet',
    url: 'http://open-cabinet.org',
    desc: '追蹤特朗普官員 OGE 交易記錄，數據接近官方',
    tag: '官方數據',
  },
  {
    name: 'TrumpTrades',
    url: 'http://trumpstrades.com',
    desc: '特朗普 Q1 交易可視化數據庫（3642+ 筆），可依行業與 Top 標的排序',
    tag: '可視化',
  },
  {
    name: 'Trump Tracker',
    url: 'http://trumptracker.org',
    desc: '覆蓋政府人物的交易和資產，瀏覽方便',
    tag: '綜合追蹤',
  },
  {
    name: 'OGE 官網',
    url: 'http://oge.gov',
    desc: '最權威的原始披露，但查起來麻煩、PDF 多、有滯後',
    tag: '最權威',
  },
  {
    name: 'ProPublica',
    url: 'https://projects.propublica.org/trump-team-finances/',
    desc: '聚合了很多官員披露，輔助搜索好用',
    tag: '輔助搜索',
  },
]

export default function USStocksPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-stone-300 font-serif px-5 py-12 max-w-2xl mx-auto">
      <div className="mb-10">
        <p className="text-xs tracking-widest text-stone-500 uppercase mb-4">美股入門</p>
        <h1 className="text-2xl font-light leading-relaxed text-stone-200 mb-3">
          普通人玩美股，不知道要買什麼？
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          思路其實很簡單，兩條路任選其一。
        </p>
      </div>

      {/* Strategy 1 */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs border border-stone-600 text-stone-400 px-2 py-0.5 tracking-wider">
            第一選擇
          </span>
          <span className="text-xs text-stone-500">穩健型</span>
        </div>
        <h2 className="text-lg font-light text-stone-200 mb-4">
          定投指數，長期基本都賺
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { ticker: 'SPY / VOO', name: '標普500', desc: '美國前500大企業，最分散' },
            { ticker: 'QQQ / TQQQ', name: '納指100', desc: '科技權重高，波動較大' },
          ].map((item) => (
            <div
              key={item.ticker}
              className="border border-stone-700 bg-zinc-900 p-4 rounded-sm"
            >
              <p className="text-sm font-medium text-amber-600 mb-1">{item.ticker}</p>
              <p className="text-sm text-stone-300 mb-1">{item.name}</p>
              <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-600 mt-4 leading-relaxed">
          每月固定買入，不擇時，長期持有10年以上，歷史回測基本正報酬。
        </p>
      </section>

      {/* Strategy 2 */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs border border-stone-600 text-stone-400 px-2 py-0.5 tracking-wider">
            第二選擇
          </span>
          <span className="text-xs text-stone-500">跟單型</span>
        </div>
        <h2 className="text-lg font-light text-stone-200 mb-2">
          跟著特朗普買
        </h2>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          $INTC、$DELL、$MU 等暴漲個股，官員申報記錄顯示都有提前布局。
          以下追蹤工具均基於<strong className="text-stone-400 font-normal">事後披露數據</strong>，有延遲，適合長期參考。
        </p>
        <div className="space-y-3">
          {trackingSites.map((site, i) => (
            <a
              key={site.name}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 border border-stone-800 hover:border-stone-600 bg-zinc-900 hover:bg-zinc-800 p-4 rounded-sm transition-colors group"
            >
              <span className="text-xs text-stone-600 mt-0.5 w-4 shrink-0">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-stone-200 group-hover:text-amber-500 transition-colors">
                    {site.name}
                  </span>
                  <span className="text-xs text-stone-600 border border-stone-700 px-1.5 py-0.5 rounded-sm shrink-0">
                    {site.tag}
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">{site.desc}</p>
                <p className="text-xs text-stone-700 mt-1 truncate">{site.url}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-stone-800 pt-6">
        <p className="text-xs text-stone-600 leading-relaxed">
          以上內容僅供資訊參考，不構成投資建議。美股有風險，投資需謹慎。
          官員申報數據均有法定滯後期（通常30–60天），不適合短線跟單。
        </p>
      </div>
    </main>
  )
}
