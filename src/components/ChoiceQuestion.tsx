import { useState } from 'react'
import type { Word, QuestionMode } from '../types'
import { useSpeech } from '../hooks/use-speech'

interface ChoiceQuestionProps {
  word: Word
  mode: QuestionMode
  choices: Word[]
  onAnswer: (userAnswer: string, correct: boolean) => void
}

export default function ChoiceQuestion({ word, mode, choices, onAnswer }: ChoiceQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const { speak } = useSpeech()

  const isCnToEn = mode === 'choiceCnToEn'
  const correctId = word.id

  function handleSelect(choice: Word) {
    if (answered) return
    setSelected(choice.id)
    setAnswered(true)

    const isCorrect = choice.id === correctId
    const userAnswer = isCnToEn ? choice.english : choice.chinese

    if (isCorrect) {
      speak(word.english)
    }

    const delay = isCorrect ? 500 : 1500
    setTimeout(() => {
      onAnswer(userAnswer, isCorrect)
    }, delay)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 text-center">
        {isCnToEn ? (
          <>
            <div className="text-4xl mb-2">{word.emoji}</div>
            <div className="text-2xl font-bold text-gray-800">{word.chinese}</div>
          </>
        ) : (
          <>
            <button
              onClick={() => speak(word.english)}
              className="text-3xl font-bold text-gray-800 hover:text-sky-600"
              aria-label={`播放 ${word.english} 的发音`}
            >
              {word.english} 🔊
            </button>
            <div className="text-lg text-gray-500 mt-1">{word.phonetic}</div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {choices.map(choice => {
          let bg = 'bg-white hover:bg-sky-50'
          if (answered) {
            if (choice.id === correctId) bg = 'bg-green-100 border-green-400'
            else if (choice.id === selected) bg = 'bg-red-100 border-red-400'
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleSelect(choice)}
              disabled={answered}
              className={`${bg} border-2 border-gray-200 rounded-xl p-4 text-lg font-medium text-gray-800 transition-colors`}
            >
              {isCnToEn ? choice.english : choice.chinese}
            </button>
          )
        })}
      </div>
    </div>
  )
}
