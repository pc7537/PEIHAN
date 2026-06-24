import { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

const execAsync = promisify(exec)

// SSE 輔助
function sseEvent(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const videoBlob = formData.get('video') as File | null
  const musicBlob = formData.get('music') as File | null
  const title = (formData.get('title') as string | null) ?? ''

  if (!videoBlob) {
    return new Response('Missing video', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const emit = async (data: object) => {
    await writer.write(sseEvent(data))
  }

  // 把檔案寫到暫存目錄，然後呼叫 shell 腳本
  const processAsync = async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clip-'))

    try {
      // 寫入影片
      const videoPath = path.join(tmpDir, videoBlob.name.replace(/[^a-z0-9._-]/gi, '_'))
      await fs.writeFile(videoPath, Buffer.from(await videoBlob.arrayBuffer()))

      // 寫入音樂（可選）
      let musicPath = ''
      if (musicBlob) {
        musicPath = path.join(tmpDir, musicBlob.name.replace(/[^a-z0-9._-]/gi, '_'))
        await fs.writeFile(musicPath, Buffer.from(await musicBlob.arrayBuffer()))
      }

      await emit({ type: 'log', message: '影片上傳完成，開始流水線…' })

      // ─── 步驟 1：Whisper ────────────────────────────────────────────────────
      await emit({ type: 'step', id: 1, label: '語音轉文字', status: 'running' })
      let srtPath = ''
      try {
        await execAsync(
          `whisper "${videoPath}" --model small --language zh --output_format srt --output_dir "${tmpDir}"`,
          { timeout: 300_000 }
        )
        const base = path.basename(videoPath, path.extname(videoPath))
        srtPath = path.join(tmpDir, `${base}.srt`)
        await emit({ type: 'step', id: 1, label: '語音轉文字', status: 'done', detail: `SRT：${base}.srt` })
      } catch {
        await emit({ type: 'step', id: 1, label: '語音轉文字', status: 'skipped', detail: 'whisper 未安裝' })
      }

      // ─── 步驟 2：Auto-Editor ────────────────────────────────────────────────
      await emit({ type: 'step', id: 2, label: '自動快剪', status: 'running' })
      let autoCutPath = videoPath
      try {
        const outPath = path.join(tmpDir, 'autocut.mp4')
        await execAsync(
          `auto-editor "${videoPath}" --silent-threshold 0.04 --margin 0.2sec --output "${outPath}"`,
          { timeout: 600_000 }
        )
        autoCutPath = outPath
        await emit({ type: 'step', id: 2, label: '自動快剪', status: 'done' })
      } catch {
        await emit({ type: 'step', id: 2, label: '自動快剪', status: 'skipped', detail: 'auto-editor 未安裝' })
      }

      // ─── 步驟 3：裁切 9:16 ──────────────────────────────────────────────────
      await emit({ type: 'step', id: 3, label: '裁切 9:16', status: 'running' })
      const video916 = path.join(tmpDir, '916.mp4')
      await execAsync(
        `ffmpeg -i "${autoCutPath}" \
          -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
          -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k \
          "${video916}" -y`,
        { timeout: 300_000 }
      )
      await emit({ type: 'step', id: 3, label: '裁切 9:16', status: 'done' })

      // ─── 步驟 4：燒錄字幕 ───────────────────────────────────────────────────
      await emit({ type: 'step', id: 4, label: '燒錄字幕', status: 'running' })
      let subbedPath = video916
      if (srtPath) {
        const outPath = path.join(tmpDir, 'subbed.mp4')
        const srtEsc = srtPath.replace(/'/g, "\\'").replace(/:/g, '\\:')
        try {
          await execAsync(
            `ffmpeg -i "${video916}" \
              -vf "subtitles='${srtEsc}':force_style='Fontname=Noto Sans TC,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Bold=1,Alignment=2,MarginV=60'" \
              -c:v libx264 -preset fast -crf 23 -c:a copy \
              "${outPath}" -y`,
            { timeout: 300_000 }
          )
          subbedPath = outPath
          await emit({ type: 'step', id: 4, label: '燒錄字幕', status: 'done' })
        } catch {
          await emit({ type: 'step', id: 4, label: '燒錄字幕', status: 'error', detail: '字幕燒錄失敗（字型問題？）' })
        }
      } else {
        await emit({ type: 'step', id: 4, label: '燒錄字幕', status: 'skipped', detail: '無 SRT，跳過' })
      }

      // ─── 步驟 5：標題字卡 ───────────────────────────────────────────────────
      await emit({ type: 'step', id: 5, label: '加標題字卡', status: 'running' })
      let titledPath = subbedPath
      if (title.trim()) {
        const cardPath = path.join(tmpDir, 'title_card.png')
        const outPath = path.join(tmpDir, 'titled.mp4')
        try {
          await execAsync(
            `convert -size 1080x1920 xc:black -gravity Center -fill white -font "DejaVu-Sans-Bold" -pointsize 72 label:"${title.replace(/"/g, '\\"')}" "${cardPath}"`
          )
          await execAsync(
            `ffmpeg \
              -loop 1 -t 2 -i "${cardPath}" \
              -i "${subbedPath}" \
              -filter_complex "[0:v]scale=1080:1920,setsar=1,fade=t=out:st=1.5:d=0.5[t];[1:v]scale=1080:1920,setsar=1[m];[t][m]concat=n=2:v=1:a=0[v]" \
              -map "[v]" -map "1:a" -c:v libx264 -preset fast -crf 23 -c:a copy \
              "${outPath}" -y`,
            { timeout: 300_000 }
          )
          titledPath = outPath
          await emit({ type: 'step', id: 5, label: '加標題字卡', status: 'done' })
        } catch {
          await emit({ type: 'step', id: 5, label: '加標題字卡', status: 'error', detail: 'ImageMagick 未安裝？' })
        }
      } else {
        await emit({ type: 'step', id: 5, label: '加標題字卡', status: 'skipped', detail: '未填標題' })
      }

      // ─── 步驟 6：配樂混音 ───────────────────────────────────────────────────
      await emit({ type: 'step', id: 6, label: '配樂混音', status: 'running' })
      let finalPath = titledPath
      if (musicPath) {
        const outPath = path.join(tmpDir, 'final.mp4')
        try {
          await execAsync(
            `ffmpeg -i "${titledPath}" -i "${musicPath}" \
              -filter_complex "[1:a]volume=0.15[bg];[0:a][bg]amix=inputs=2:duration=first[a]" \
              -map "0:v" -map "[a]" -c:v copy -c:a aac -b:a 192k \
              "${outPath}" -y`,
            { timeout: 300_000 }
          )
          finalPath = outPath
          await emit({ type: 'step', id: 6, label: '配樂混音', status: 'done' })
        } catch {
          await emit({ type: 'step', id: 6, label: '配樂混音', status: 'error', detail: '音樂混音失敗' })
        }
      } else {
        await emit({ type: 'step', id: 6, label: '配樂混音', status: 'skipped', detail: '未提供背景音樂' })
      }

      // ─── 回傳結果 ────────────────────────────────────────────────────────────
      // 把最終影片讀出來，以 Base64 回傳（適合小檔案；大型影片建議改存到 /public）
      const finalBuffer = await fs.readFile(finalPath)
      const base64 = finalBuffer.toString('base64')
      await emit({ type: 'done', url: `data:video/mp4;base64,${base64}` })

    } catch (err) {
      await emit({ type: 'error', message: String(err) })
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true })
      await writer.close()
    }
  }

  processAsync()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
