import { useSpeech } from '../hooks/use-speech'
import type { Word } from '../types'

interface WordCardProps {
  word: Word
  showChinese?: boolean
  showEnglish?: boolean
}

export default function WordCard({ word, showChinese = true, showEnglish = true }: WordCardProps) {
  const { speak } = useSpeech()

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 text-center space-y-3">
      {word.emoji && <div className="text-5xl">{word.emoji}</div>}
      {showEnglish && (
        <div>
          <button
            onClick={() => speak(word.english)}
            className="text-3xl font-bold text-gray-800 hover:text-sky-600 transition-colors"
            aria-label={`播放 ${word.english} 的发音`}
          >
            {word.english} 🔊
          </button>
          <div className="text-lg text-gray-500 mt-1">{word.phonetic}</div>
        </div>
      )}
      {showChinese && (
        <div className="text-2xl text-gray-700">{word.chinese}</div>
      )}
    </div>
  )
}
