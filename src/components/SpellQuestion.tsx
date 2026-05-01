import { useState } from 'react'
import type { Word } from '../types'
import { gradeAnswer } from '../services/quiz-engine'

interface SpellQuestionProps {
  word: Word
  showHint: boolean
  onAnswer: (userAnswer: string, correct: boolean) => void
}

export default function SpellQuestion({ word, showHint, onAnswer }: SpellQuestionProps) {
  const [input, setInput] = useState('')
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (answered || !input.trim()) return

    const correct = gradeAnswer('spell', input, word.english)
    setIsCorrect(correct)
    setAnswered(true)

    const delay = correct ? 500 : 2000
    setTimeout(() => {
      onAnswer(input.trim(), correct)
    }, delay)
  }

  function renderComparison() {
    if (!answered || isCorrect) return null
    const userChars = input.trim().toLowerCase().split('')
    const correctChars = word.english.toLowerCase().split('')

    return (
      <div className="mt-4 text-center">
        <div className="text-lg text-gray-600 mb-1">正确拼写：</div>
        <div className="text-2xl font-mono tracking-widest">
          {correctChars.map((ch, i) => (
            <span
              key={i}
              className={userChars[i] !== ch ? 'text-red-500 font-bold' : 'text-green-600'}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 text-center">
        <div className="text-4xl mb-2">{word.emoji}</div>
        <div className="text-2xl font-bold text-gray-800">{word.chinese}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={answered}
          placeholder={showHint ? word.english[0] + '...' : '输入英文单词'}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          className={`w-full text-center text-2xl p-4 border-2 rounded-xl outline-none transition-colors ${
            answered
              ? isCorrect
                ? 'border-green-400 bg-green-50'
                : 'border-red-400 bg-red-50'
              : 'border-gray-300 focus:border-sky-400'
          }`}
        />
        {!answered && (
          <button
            type="submit"
            className="w-full bg-sky-500 text-white text-xl py-3 rounded-xl hover:bg-sky-600 transition-colors"
          >
            确认
          </button>
        )}
      </form>

      {renderComparison()}
    </div>
  )
}
