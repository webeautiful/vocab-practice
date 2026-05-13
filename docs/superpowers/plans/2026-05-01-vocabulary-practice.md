# 小学生单词练习应用 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based vocabulary practice app for primary school students (grades 1-6) with 1500 words, spaced repetition, and parent dashboard.

**Architecture:** Pure frontend SPA using React + TypeScript. Word data stored as static JSON. Learning progress persisted in IndexedDB via Dexie.js. User settings in localStorage. Browser TTS for pronunciation.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Dexie.js, Web Speech API, React Router, Vitest + React Testing Library

---

## File Structure

```
vocab-practice/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── correct.mp3                  # short success sound effect
├── scripts/
│   └── extract-words.py             # one-time script to parse content.html → words.json
├── src/
│   ├── main.tsx                     # app entry
│   ├── App.tsx                      # router setup
│   ├── data/
│   │   └── words.json               # static word bank (1500 words)
│   ├── db/
│   │   ├── index.ts                 # Dexie database definition
│   │   ├── learning-records.ts      # CRUD for learning records
│   │   └── error-records.ts         # CRUD for error records
│   ├── stores/
│   │   └── settings.ts              # localStorage settings read/write
│   ├── hooks/
│   │   ├── use-speech.ts            # Web Speech API wrapper
│   │   └── use-sound.ts             # audio feedback hook
│   ├── services/
│   │   ├── quiz-engine.ts           # question generation, distractor selection, answer grading
│   │   ├── review-scheduler.ts      # Ebbinghaus scheduling logic
│   │   └── category-unlock.ts       # category unlock logic
│   ├── components/
│   │   ├── Layout.tsx               # shared layout shell
│   │   ├── WordCard.tsx             # word display card (english, phonetic, chinese, emoji, play button)
│   │   ├── ChoiceQuestion.tsx       # multiple choice question component
│   │   ├── SpellQuestion.tsx        # spelling input question component
│   │   ├── ProgressBar.tsx          # simple progress bar
│   │   └── BarChart.tsx             # 7-day bar chart for parent dashboard
│   ├── pages/
│   │   ├── HomePage.tsx             # role selection + review reminder
│   │   ├── CategoryListPage.tsx     # topic list with lock/unlock status
│   │   ├── LearnPage.tsx            # new word browsing (swipe cards)
│   │   ├── PracticePage.tsx         # quiz session (15 questions)
│   │   ├── ResultPage.tsx           # practice result summary
│   │   ├── ParentLoginPage.tsx      # 4-digit password entry
│   │   ├── ParentDashboardPage.tsx  # progress overview
│   │   ├── ParentCategoryPage.tsx   # per-category detail + error words
│   │   └── ParentSettingsPage.tsx   # parent controls
│   └── types.ts                     # shared TypeScript interfaces
└── tests/
    ├── services/
    │   ├── quiz-engine.test.ts
    │   ├── review-scheduler.test.ts
    │   └── category-unlock.test.ts
    ├── db/
    │   ├── learning-records.test.ts
    │   └── error-records.test.ts
    └── stores/
        └── settings.test.ts
```


---

### Task 1: Project Scaffolding

**Files:**
- Create: `vocab-practice/package.json`
- Create: `vocab-practice/tsconfig.json`
- Create: `vocab-practice/vite.config.ts`
- Create: `vocab-practice/tailwind.config.js`
- Create: `vocab-practice/postcss.config.js`
- Create: `vocab-practice/index.html`
- Create: `vocab-practice/src/main.tsx`
- Create: `vocab-practice/src/App.tsx`

- [ ] **Step 1: Initialize project with Vite**

```bash
cd /Users/xiongfusong/claude-workspace
npm create vite@latest vocab-practice -- --template react-ts
cd vocab-practice
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npm install dexie react-router-dom
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom happy-dom
```

- [ ] **Step 3: Configure Tailwind CSS**

Replace `vocab-practice/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

Replace `vocab-practice/src/index.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Create test setup file**

Create `vocab-practice/tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Create minimal App with router**

Replace `vocab-practice/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Placeholder({ name }: { name: string }) {
  return <div className="p-8 text-2xl text-center">{name}</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder name="首页" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

Replace `vocab-practice/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Verify dev server starts**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npm run dev
```

Expected: Vite dev server starts, browser shows "首页".

- [ ] **Step 7: Verify tests run**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run
```

Expected: Test runner initializes successfully (no tests yet, 0 pass).

- [ ] **Step 8: Initialize git and commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git init
echo "node_modules\ndist\n.DS_Store" > .gitignore
git add -A
git commit -m "chore: scaffold project with Vite + React + TypeScript + Tailwind + Dexie"
```


---

### Task 2: Extract Word Data from HTML

**Files:**
- Create: `vocab-practice/scripts/extract-words.py`
- Create: `vocab-practice/src/data/words.json`
- Create: `vocab-practice/src/types.ts`

- [ ] **Step 1: Write the extraction script**

Create `vocab-practice/scripts/extract-words.py`:

```python
"""
Parse content.html and extract all words into a structured JSON file.
Each word entry: { id, english, phonetic, chinese, emoji, category, categoryId }
"""
import re
import json
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.skip = False
        self.in_content = False
    def handle_starttag(self, tag, attrs):
        if dict(attrs).get('id') == 'js_content':
            self.in_content = True
        if tag in ('script', 'style'):
            self.skip = True
    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = False
    def handle_data(self, data):
        if self.in_content and not self.skip:
            text = data.strip()
            if text:
                self.text.append(text)

with open('../content.html', 'r', encoding='utf-8') as f:
    parser = TextExtractor()
    parser.feed(f.read())

lines = '\n'.join(parser.text).split('\n')

categories = []
words = []
current_category = None
current_category_id = 0

# Pattern for section headers like "一、基础认知类" or "三十五、日常用语篇💬"
section_re = re.compile(r'^[一二三四五六七八九十百]+、(.+?)(?:篇|类)(.*)$')
# Pattern for word lines like "big /bɪɡ/ 大的 🐘"
word_re = re.compile(r'^(.+?)\s+(/[^/]+/)\s+(.+?)(\s+\S+)?$')
# More flexible word pattern for lines with phonetic
word_re2 = re.compile(r'^([A-Za-z][A-Za-z\s\-\']*?)\s+(/[^/]+/)\s+(.+)$')

for line in lines:
    line = line.strip()
    if not line:
        continue

    # Check for section header
    m = section_re.match(line)
    if m:
        current_category_id += 1
        # Clean category name - remove emojis
        cat_name = m.group(1).strip()
        current_category = {
            'id': current_category_id,
            'name': cat_name
        }
        categories.append(current_category)
        continue

    if not current_category:
        # Try to detect first section "基础认知类"
        if '基础认知' in line:
            current_category_id += 1
            current_category = {'id': current_category_id, 'name': '基础认知'}
            categories.append(current_category)
        continue

    # Try to parse word line
    m = word_re2.match(line)
    if m and current_category:
        english = m.group(1).strip()
        phonetic = m.group(2).strip()
        rest = m.group(3).strip()

        # Split chinese and emoji from rest
        # Emoji are typically at the end after space
        parts = rest.rsplit(' ', 1)
        if len(parts) == 2:
            chinese = parts[0].strip()
            emoji = parts[1].strip()
        else:
            chinese = rest
            emoji = ''

        # Generate id from category and english
        cat_prefix = f"cat{current_category['id']}"
        word_id = f"{cat_prefix}_{english.lower().replace(' ', '_').replace('-', '_')}"

        words.append({
            'id': word_id,
            'english': english,
            'phonetic': phonetic,
            'chinese': chinese,
            'emoji': emoji,
            'category': current_category['name'],
            'categoryId': current_category['id']
        })

# Write output
output = {
    'categories': categories,
    'words': words
}

with open('../src/data/words.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(categories)} categories, {len(words)} words")
for cat in categories:
    count = len([w for w in words if w['categoryId'] == cat['id']])
    print(f"  {cat['id']}. {cat['name']}: {count} words")
```

- [ ] **Step 2: Run the extraction script**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice/scripts
python3 extract-words.py
```

Expected: Prints category/word counts. Creates `src/data/words.json`.

- [ ] **Step 3: Verify and manually fix the extracted data**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
python3 -c "
import json
with open('src/data/words.json') as f:
    data = json.load(f)
print(f'Categories: {len(data[\"categories\"])}')
print(f'Words: {len(data[\"words\"])}')
# Check for words missing fields
bad = [w for w in data['words'] if not w['english'] or not w['chinese'] or not w['phonetic']]
print(f'Words with missing fields: {len(bad)}')
for b in bad[:5]:
    print(f'  {b}')
"
```

Expected: ~38 categories, ~1000+ words, 0 words with missing fields. If extraction misses words or has errors, fix the script and re-run. The script may need tuning for edge cases (multi-word phrases like "hot dog", "ice cream", etc.).

- [ ] **Step 4: Create TypeScript types**

Create `vocab-practice/src/types.ts`:

```ts
export interface Word {
  id: string
  english: string
  phonetic: string
  chinese: string
  emoji: string
  category: string
  categoryId: number
}

export interface Category {
  id: number
  name: string
}

export interface WordBank {
  categories: Category[]
  words: Word[]
}

export interface LearningRecord {
  wordId: string
  level: number
  consecutiveCorrect: number
  nextReviewDate: string
  totalAttempts: number
  totalCorrect: number
  mastered: boolean
  lastPracticeDate: string
}

export interface ErrorEntry {
  date: string
  mode: 'choiceCnToEn' | 'choiceEnToCn' | 'spell'
  userAnswer: string
}

export interface ErrorRecord {
  wordId: string
  errorCount: number
  consecutiveCorrect: number
  lastErrorDate: string
  errors: ErrorEntry[]
}

export interface UserSettings {
  parentPassword: string | null
  dailyGoal: number
  unlockedCategories: number[]
  choiceCount: 3 | 4
  spellHint: boolean
  unlockThreshold: number
}

export type QuestionMode = 'choiceCnToEn' | 'choiceEnToCn' | 'spell'

export interface Question {
  word: Word
  mode: QuestionMode
  choices?: Word[]
}

export interface AnswerResult {
  wordId: string
  mode: QuestionMode
  correct: boolean
  userAnswer: string
  correctAnswer: string
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add scripts/ src/data/words.json src/types.ts
git commit -m "feat: extract word data from article and define TypeScript types"
```


---

### Task 3: Database Layer (Dexie.js)

**Files:**
- Create: `vocab-practice/src/db/index.ts`
- Create: `vocab-practice/src/db/learning-records.ts`
- Create: `vocab-practice/src/db/error-records.ts`
- Create: `vocab-practice/tests/db/learning-records.test.ts`
- Create: `vocab-practice/tests/db/error-records.test.ts`

- [ ] **Step 1: Write failing tests for learning records**

Create `vocab-practice/tests/db/learning-records.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db'
import {
  getRecord,
  upsertRecord,
  getRecordsByCategory,
  getDueReviewWords,
  getTodayPracticedCount,
  getAllRecords,
} from '../../src/db/learning-records'

beforeEach(async () => {
  await db.learningRecords.clear()
})

describe('learning-records', () => {
  it('returns undefined for unknown word', async () => {
    const r = await getRecord('nonexistent')
    expect(r).toBeUndefined()
  })

  it('creates and retrieves a record', async () => {
    await upsertRecord({
      wordId: 'cat1_big',
      level: 1,
      consecutiveCorrect: 1,
      nextReviewDate: '2026-05-02',
      totalAttempts: 1,
      totalCorrect: 1,
      mastered: false,
      lastPracticeDate: '2026-05-01',
    })
    const r = await getRecord('cat1_big')
    expect(r).toBeDefined()
    expect(r!.level).toBe(1)
    expect(r!.wordId).toBe('cat1_big')
  })

  it('updates an existing record', async () => {
    await upsertRecord({
      wordId: 'cat1_big',
      level: 1,
      consecutiveCorrect: 1,
      nextReviewDate: '2026-05-02',
      totalAttempts: 1,
      totalCorrect: 1,
      mastered: false,
      lastPracticeDate: '2026-05-01',
    })
    await upsertRecord({
      wordId: 'cat1_big',
      level: 2,
      consecutiveCorrect: 2,
      nextReviewDate: '2026-05-03',
      totalAttempts: 2,
      totalCorrect: 2,
      mastered: false,
      lastPracticeDate: '2026-05-01',
    })
    const r = await getRecord('cat1_big')
    expect(r!.level).toBe(2)
  })

  it('gets records by category prefix', async () => {
    await upsertRecord({
      wordId: 'cat7_apple',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-05-02',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-05-01',
    })
    await upsertRecord({
      wordId: 'cat7_banana',
      level: 0, consecutiveCorrect: 0, nextReviewDate: '2026-05-01',
      totalAttempts: 0, totalCorrect: 0, mastered: false, lastPracticeDate: '2026-05-01',
    })
    await upsertRecord({
      wordId: 'cat8_tomato',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-05-02',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-05-01',
    })
    const records = await getRecordsByCategory(7)
    expect(records).toHaveLength(2)
  })

  it('gets due review words', async () => {
    await upsertRecord({
      wordId: 'cat1_big',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-04-30',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-04-29',
    })
    await upsertRecord({
      wordId: 'cat1_small',
      level: 2, consecutiveCorrect: 2, nextReviewDate: '2026-12-31',
      totalAttempts: 2, totalCorrect: 2, mastered: false, lastPracticeDate: '2026-05-01',
    })
    const due = await getDueReviewWords('2026-05-01')
    expect(due).toHaveLength(1)
    expect(due[0].wordId).toBe('cat1_big')
  })

  it('counts today practiced words', async () => {
    await upsertRecord({
      wordId: 'cat1_big',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-05-02',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-05-01',
    })
    await upsertRecord({
      wordId: 'cat1_small',
      level: 1, consecutiveCorrect: 1, nextReviewDate: '2026-05-02',
      totalAttempts: 1, totalCorrect: 1, mastered: false, lastPracticeDate: '2026-04-30',
    })
    const count = await getTodayPracticedCount('2026-05-01')
    expect(count).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/db/learning-records.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement database definition**

Create `vocab-practice/src/db/index.ts`:

```ts
import Dexie, { type Table } from 'dexie'
import type { LearningRecord, ErrorRecord } from '../types'

class VocabDatabase extends Dexie {
  learningRecords!: Table<LearningRecord, string>
  errorRecords!: Table<ErrorRecord, string>

  constructor() {
    super('vocab-practice')
    this.version(1).stores({
      learningRecords: 'wordId, nextReviewDate, lastPracticeDate, mastered',
      errorRecords: 'wordId, errorCount, lastErrorDate',
    })
  }
}

export const db = new VocabDatabase()
```

- [ ] **Step 4: Implement learning records CRUD**

Create `vocab-practice/src/db/learning-records.ts`:

```ts
import { db } from './index'
import type { LearningRecord } from '../types'

export async function getRecord(wordId: string): Promise<LearningRecord | undefined> {
  return db.learningRecords.get(wordId)
}

export async function upsertRecord(record: LearningRecord): Promise<void> {
  await db.learningRecords.put(record)
}

export async function getRecordsByCategory(categoryId: number): Promise<LearningRecord[]> {
  const prefix = `cat${categoryId}_`
  return db.learningRecords
    .filter(r => r.wordId.startsWith(prefix))
    .toArray()
}

export async function getDueReviewWords(today: string): Promise<LearningRecord[]> {
  return db.learningRecords
    .where('nextReviewDate')
    .belowOrEqual(today)
    .filter(r => !r.mastered)
    .toArray()
}

export async function getTodayPracticedCount(today: string): Promise<number> {
  return db.learningRecords
    .where('lastPracticeDate')
    .equals(today)
    .count()
}

export async function getAllRecords(): Promise<LearningRecord[]> {
  return db.learningRecords.toArray()
}
```

- [ ] **Step 5: Run learning records tests**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/db/learning-records.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 6: Write failing tests for error records**

Create `vocab-practice/tests/db/error-records.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../src/db'
import {
  getErrorRecord,
  addError,
  recordCorrectAnswer,
  getActiveErrors,
  getAllErrors,
} from '../../src/db/error-records'

beforeEach(async () => {
  await db.errorRecords.clear()
})

describe('error-records', () => {
  it('returns undefined for word with no errors', async () => {
    const r = await getErrorRecord('nonexistent')
    expect(r).toBeUndefined()
  })

  it('creates error record on first mistake', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    const r = await getErrorRecord('cat7_apple')
    expect(r).toBeDefined()
    expect(r!.errorCount).toBe(1)
    expect(r!.consecutiveCorrect).toBe(0)
    expect(r!.errors).toHaveLength(1)
    expect(r!.errors[0].mode).toBe('spell')
    expect(r!.errors[0].userAnswer).toBe('aple')
  })

  it('increments error count on repeated mistakes', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await addError('cat7_apple', 'choiceCnToEn', 'banana')
    const r = await getErrorRecord('cat7_apple')
    expect(r!.errorCount).toBe(2)
    expect(r!.errors).toHaveLength(2)
  })

  it('tracks consecutive correct answers', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await recordCorrectAnswer('cat7_apple')
    const r = await getErrorRecord('cat7_apple')
    expect(r!.consecutiveCorrect).toBe(1)
  })

  it('removes from active errors after 2 consecutive correct', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await recordCorrectAnswer('cat7_apple')
    await recordCorrectAnswer('cat7_apple')
    const active = await getActiveErrors()
    expect(active).toHaveLength(0)
  })

  it('resets consecutive correct on new error', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await recordCorrectAnswer('cat7_apple')
    await addError('cat7_apple', 'spell', 'appl')
    const r = await getErrorRecord('cat7_apple')
    expect(r!.consecutiveCorrect).toBe(0)
    expect(r!.errorCount).toBe(2)
  })

  it('getActiveErrors returns only words with consecutiveCorrect < 2 and errorCount >= 2', async () => {
    await addError('cat7_apple', 'spell', 'aple')
    await addError('cat7_apple', 'spell', 'appl')
    await addError('cat7_banana', 'spell', 'banan')
    const active = await getActiveErrors()
    expect(active).toHaveLength(1)
    expect(active[0].wordId).toBe('cat7_apple')
  })
})
```

- [ ] **Step 7: Run error records tests to verify they fail**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/db/error-records.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 8: Implement error records CRUD**

Create `vocab-practice/src/db/error-records.ts`:

```ts
import { db } from './index'
import type { ErrorRecord, QuestionMode } from '../types'

export async function getErrorRecord(wordId: string): Promise<ErrorRecord | undefined> {
  return db.errorRecords.get(wordId)
}

export async function addError(wordId: string, mode: QuestionMode, userAnswer: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const existing = await db.errorRecords.get(wordId)

  if (existing) {
    existing.errorCount += 1
    existing.consecutiveCorrect = 0
    existing.lastErrorDate = today
    existing.errors.push({ date: today, mode, userAnswer })
    await db.errorRecords.put(existing)
  } else {
    await db.errorRecords.put({
      wordId,
      errorCount: 1,
      consecutiveCorrect: 0,
      lastErrorDate: today,
      errors: [{ date: today, mode, userAnswer }],
    })
  }
}

export async function recordCorrectAnswer(wordId: string): Promise<void> {
  const existing = await db.errorRecords.get(wordId)
  if (!existing) return
  existing.consecutiveCorrect += 1
  await db.errorRecords.put(existing)
}

export async function getActiveErrors(): Promise<ErrorRecord[]> {
  return db.errorRecords
    .filter(r => r.errorCount >= 2 && r.consecutiveCorrect < 2)
    .toArray()
}

export async function getAllErrors(): Promise<ErrorRecord[]> {
  return db.errorRecords.toArray()
}
```

- [ ] **Step 9: Run all DB tests**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/db/
```

Expected: All 13 tests PASS.

- [ ] **Step 10: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/db/ tests/db/
git commit -m "feat: add Dexie database layer for learning and error records"
```


---

### Task 4: Settings Store + Review Scheduler + Category Unlock

**Files:**
- Create: `vocab-practice/src/stores/settings.ts`
- Create: `vocab-practice/src/services/review-scheduler.ts`
- Create: `vocab-practice/src/services/category-unlock.ts`
- Create: `vocab-practice/tests/stores/settings.test.ts`
- Create: `vocab-practice/tests/services/review-scheduler.test.ts`
- Create: `vocab-practice/tests/services/category-unlock.test.ts`

- [ ] **Step 1: Write failing tests for settings store**

Create `vocab-practice/tests/stores/settings.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '../../src/stores/settings'

beforeEach(() => {
  localStorage.clear()
})

describe('settings', () => {
  it('returns defaults when nothing stored', () => {
    const s = getSettings()
    expect(s.dailyGoal).toBe(15)
    expect(s.choiceCount).toBe(4)
    expect(s.spellHint).toBe(false)
    expect(s.parentPassword).toBeNull()
    expect(s.unlockedCategories).toEqual([1])
    expect(s.unlockThreshold).toBe(0.8)
  })

  it('persists and retrieves updated settings', () => {
    updateSettings({ dailyGoal: 20, choiceCount: 3 })
    const s = getSettings()
    expect(s.dailyGoal).toBe(20)
    expect(s.choiceCount).toBe(3)
    expect(s.spellHint).toBe(false)
  })

  it('merges partial updates', () => {
    updateSettings({ dailyGoal: 25 })
    updateSettings({ spellHint: true })
    const s = getSettings()
    expect(s.dailyGoal).toBe(25)
    expect(s.spellHint).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/stores/settings.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement settings store**

Create `vocab-practice/src/stores/settings.ts`:

```ts
import type { UserSettings } from '../types'

const STORAGE_KEY = 'vocab-practice-settings'

export const DEFAULT_SETTINGS: UserSettings = {
  parentPassword: null,
  dailyGoal: 15,
  unlockedCategories: [1],
  choiceCount: 4,
  spellHint: false,
  unlockThreshold: 0.8,
}

export function getSettings(): UserSettings {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
}

export function updateSettings(partial: Partial<UserSettings>): void {
  const current = getSettings()
  const updated = { ...current, ...partial }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
```

- [ ] **Step 4: Run settings tests**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/stores/settings.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Write failing tests for review scheduler**

Create `vocab-practice/tests/services/review-scheduler.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getNextReviewDate, REVIEW_INTERVALS } from '../../src/services/review-scheduler'

describe('review-scheduler', () => {
  it('level 0 returns same day', () => {
    const result = getNextReviewDate(0, '2026-05-01')
    expect(result).toBe('2026-05-01')
  })

  it('level 1 returns +1 day', () => {
    const result = getNextReviewDate(1, '2026-05-01')
    expect(result).toBe('2026-05-02')
  })

  it('level 2 returns +2 days', () => {
    const result = getNextReviewDate(2, '2026-05-01')
    expect(result).toBe('2026-05-03')
  })

  it('level 3 returns +4 days', () => {
    const result = getNextReviewDate(3, '2026-05-01')
    expect(result).toBe('2026-05-05')
  })

  it('level 4 returns +7 days', () => {
    const result = getNextReviewDate(4, '2026-05-01')
    expect(result).toBe('2026-05-08')
  })

  it('level 5 returns +15 days', () => {
    const result = getNextReviewDate(5, '2026-05-01')
    expect(result).toBe('2026-05-16')
  })

  it('mastered returns +30 days', () => {
    const result = getNextReviewDate(5, '2026-05-01', true)
    expect(result).toBe('2026-05-31')
  })

  it('handles month boundary', () => {
    const result = getNextReviewDate(4, '2026-05-28')
    expect(result).toBe('2026-06-04')
  })
})
```

- [ ] **Step 6: Run to verify failure**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/services/review-scheduler.test.ts
```

Expected: FAIL.

- [ ] **Step 7: Implement review scheduler**

Create `vocab-practice/src/services/review-scheduler.ts`:

```ts
export const REVIEW_INTERVALS: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 15,
}

const MASTERED_INTERVAL = 30

export function getNextReviewDate(level: number, today: string, mastered = false): string {
  const days = mastered ? MASTERED_INTERVAL : (REVIEW_INTERVALS[level] ?? 0)
  const date = new Date(today + 'T00:00:00')
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
```

- [ ] **Step 8: Run review scheduler tests**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/services/review-scheduler.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 9: Write failing tests for category unlock**

Create `vocab-practice/tests/services/category-unlock.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { shouldUnlockNext } from '../../src/services/category-unlock'
import type { LearningRecord, Word } from '../../src/types'

function makeWords(categoryId: number, count: number): Word[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cat${categoryId}_word${i}`,
    english: `word${i}`,
    phonetic: '/test/',
    chinese: `词${i}`,
    emoji: '📝',
    category: `cat${categoryId}`,
    categoryId,
  }))
}

function makeRecords(categoryId: number, count: number, level: number): LearningRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    wordId: `cat${categoryId}_word${i}`,
    level,
    consecutiveCorrect: 1,
    nextReviewDate: '2026-05-02',
    totalAttempts: 1,
    totalCorrect: 1,
    mastered: false,
    lastPracticeDate: '2026-05-01',
  }))
}

describe('category-unlock', () => {
  it('unlocks next when 80% of words reach level 1+', () => {
    const words = makeWords(1, 10)
    const records = makeRecords(1, 8, 1)
    expect(shouldUnlockNext(words, records, 0.8)).toBe(true)
  })

  it('does not unlock when below threshold', () => {
    const words = makeWords(1, 10)
    const records = makeRecords(1, 7, 1)
    expect(shouldUnlockNext(words, records, 0.8)).toBe(false)
  })

  it('does not count level 0 records', () => {
    const words = makeWords(1, 10)
    const records = makeRecords(1, 10, 0)
    expect(shouldUnlockNext(words, records, 0.8)).toBe(false)
  })

  it('handles empty records', () => {
    const words = makeWords(1, 10)
    expect(shouldUnlockNext(words, [], 0.8)).toBe(false)
  })

  it('handles empty words', () => {
    expect(shouldUnlockNext([], [], 0.8)).toBe(true)
  })
})
```

- [ ] **Step 10: Run to verify failure**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/services/category-unlock.test.ts
```

Expected: FAIL.

- [ ] **Step 11: Implement category unlock**

Create `vocab-practice/src/services/category-unlock.ts`:

```ts
import type { Word, LearningRecord } from '../types'

export function shouldUnlockNext(
  categoryWords: Word[],
  records: LearningRecord[],
  threshold: number,
): boolean {
  if (categoryWords.length === 0) return true
  const qualifiedCount = records.filter(r => r.level >= 1).length
  return qualifiedCount / categoryWords.length >= threshold
}
```

- [ ] **Step 12: Run all service tests**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/services/ tests/stores/
```

Expected: All 16 tests PASS.

- [ ] **Step 13: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/stores/ src/services/ tests/stores/ tests/services/
git commit -m "feat: add settings store, review scheduler, and category unlock logic"
```


---

### Task 5: Quiz Engine

**Files:**
- Create: `vocab-practice/src/services/quiz-engine.ts`
- Create: `vocab-practice/tests/services/quiz-engine.test.ts`

- [ ] **Step 1: Write failing tests for quiz engine**

Create `vocab-practice/tests/services/quiz-engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  determineMode,
  generateDistractors,
  buildQuizQuestions,
  gradeAnswer,
} from '../../src/services/quiz-engine'
import type { Word, LearningRecord } from '../../src/types'

const apple: Word = { id: 'cat7_apple', english: 'apple', phonetic: '/ˈæpl/', chinese: '苹果', emoji: '🍎', category: '水果篇', categoryId: 7 }
const banana: Word = { id: 'cat7_banana', english: 'banana', phonetic: '/bəˈnɑːnə/', chinese: '香蕉', emoji: '🍌', category: '水果篇', categoryId: 7 }
const orange: Word = { id: 'cat7_orange', english: 'orange', phonetic: '/ˈɒrɪndʒ/', chinese: '橙子', emoji: '🍊', category: '水果篇', categoryId: 7 }
const pear: Word = { id: 'cat7_pear', english: 'pear', phonetic: '/peə/', chinese: '梨', emoji: '🍐', category: '水果篇', categoryId: 7 }
const grape: Word = { id: 'cat7_grape', english: 'grape', phonetic: '/ɡreɪp/', chinese: '葡萄', emoji: '🍇', category: '水果篇', categoryId: 7 }
const dog: Word = { id: 'cat10_dog', english: 'dog', phonetic: '/dɒɡ/', chinese: '狗', emoji: '🐕', category: '动物篇', categoryId: 10 }

const fruitWords = [apple, banana, orange, pear, grape]

describe('determineMode', () => {
  it('returns choiceCnToEn for level 0', () => {
    expect(determineMode(0)).toBe('choiceCnToEn')
  })
  it('returns choiceCnToEn for level 1', () => {
    expect(determineMode(1)).toBe('choiceCnToEn')
  })
  it('returns choiceEnToCn for level 2', () => {
    expect(determineMode(2)).toBe('choiceEnToCn')
  })
  it('returns choiceEnToCn for level 3', () => {
    expect(determineMode(3)).toBe('choiceEnToCn')
  })
  it('returns spell for level 4', () => {
    expect(determineMode(4)).toBe('spell')
  })
  it('returns spell for level 5', () => {
    expect(determineMode(5)).toBe('spell')
  })
})

describe('generateDistractors', () => {
  it('returns requested number of distractors', () => {
    const result = generateDistractors(apple, fruitWords, [], 3)
    expect(result).toHaveLength(3)
  })

  it('does not include the target word', () => {
    const result = generateDistractors(apple, fruitWords, [], 3)
    expect(result.find(w => w.id === apple.id)).toBeUndefined()
  })

  it('excludes mastered words', () => {
    const mastered = ['cat7_banana', 'cat7_orange', 'cat7_pear']
    const result = generateDistractors(apple, fruitWords, mastered, 3)
    const hasMastered = result.some(w => mastered.includes(w.id))
    expect(hasMastered).toBe(false)
  })

  it('falls back to other categories when same-category pool is too small', () => {
    const allWords = [...fruitWords, dog]
    const mastered = ['cat7_banana', 'cat7_orange', 'cat7_pear']
    const result = generateDistractors(apple, allWords, mastered, 3)
    expect(result).toHaveLength(3)
  })
})

describe('gradeAnswer', () => {
  it('grades correct choice', () => {
    expect(gradeAnswer('choiceCnToEn', 'apple', 'apple')).toBe(true)
  })
  it('grades incorrect choice', () => {
    expect(gradeAnswer('choiceCnToEn', 'banana', 'apple')).toBe(false)
  })
  it('grades spell case-insensitive', () => {
    expect(gradeAnswer('spell', 'Apple', 'apple')).toBe(true)
  })
  it('grades spell with trimmed spaces', () => {
    expect(gradeAnswer('spell', '  apple  ', 'apple')).toBe(true)
  })
  it('grades incorrect spell', () => {
    expect(gradeAnswer('spell', 'aple', 'apple')).toBe(false)
  })
})

describe('buildQuizQuestions', () => {
  it('returns up to requested count', () => {
    const records: LearningRecord[] = []
    const questions = buildQuizQuestions({
      allWords: fruitWords,
      categoryWords: fruitWords,
      dueReviewWords: [],
      activeErrorWordIds: [],
      records,
      count: 3,
      choiceCount: 4,
    })
    expect(questions.length).toBeLessThanOrEqual(3)
    expect(questions.length).toBeGreaterThan(0)
  })

  it('includes choices for choice modes', () => {
    const questions = buildQuizQuestions({
      allWords: fruitWords,
      categoryWords: fruitWords,
      dueReviewWords: [],
      activeErrorWordIds: [],
      records: [],
      count: 3,
      choiceCount: 4,
    })
    const choiceQ = questions.find(q => q.mode !== 'spell')
    if (choiceQ) {
      expect(choiceQ.choices).toBeDefined()
      expect(choiceQ.choices!.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('does not include choices for spell mode', () => {
    const records: LearningRecord[] = fruitWords.map(w => ({
      wordId: w.id, level: 4, consecutiveCorrect: 0,
      nextReviewDate: '2026-05-01', totalAttempts: 4, totalCorrect: 4,
      mastered: false, lastPracticeDate: '2026-05-01',
    }))
    const questions = buildQuizQuestions({
      allWords: fruitWords,
      categoryWords: fruitWords,
      dueReviewWords: fruitWords.map(w => records.find(r => r.wordId === w.id)!),
      activeErrorWordIds: [],
      records,
      count: 3,
      choiceCount: 4,
    })
    questions.forEach(q => {
      if (q.mode === 'spell') {
        expect(q.choices).toBeUndefined()
      }
    })
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/services/quiz-engine.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement quiz engine**

Create `vocab-practice/src/services/quiz-engine.ts`:

```ts
import type { Word, LearningRecord, Question, QuestionMode } from '../types'

export function determineMode(level: number): QuestionMode {
  if (level <= 1) return 'choiceCnToEn'
  if (level <= 3) return 'choiceEnToCn'
  return 'spell'
}

export function generateDistractors(
  target: Word,
  allWords: Word[],
  masteredIds: string[],
  count: number,
): Word[] {
  const excluded = new Set([target.id, ...masteredIds])

  const sameCat = allWords.filter(w => w.categoryId === target.categoryId && !excluded.has(w.id))
  const otherCat = allWords.filter(w => w.categoryId !== target.categoryId && !excluded.has(w.id))

  const pool = [...shuffle(sameCat), ...shuffle(otherCat)]
  return pool.slice(0, count)
}

export function gradeAnswer(mode: QuestionMode, userAnswer: string, correctAnswer: string): boolean {
  if (mode === 'spell') {
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
  }
  return userAnswer === correctAnswer
}

interface BuildQuizParams {
  allWords: Word[]
  categoryWords: Word[]
  dueReviewWords: LearningRecord[]
  activeErrorWordIds: string[]
  records: LearningRecord[]
  count: number
  choiceCount: number
}

export function buildQuizQuestions(params: BuildQuizParams): Question[] {
  const { allWords, categoryWords, dueReviewWords, activeErrorWordIds, records, count, choiceCount } = params
  const wordMap = new Map(allWords.map(w => [w.id, w]))
  const recordMap = new Map(records.map(r => [r.wordId, r]))
  const masteredIds = records.filter(r => r.mastered).map(r => r.wordId)

  const selected: Word[] = []
  const usedIds = new Set<string>()

  const targetDue = Math.min(Math.ceil(count * 0.4), dueReviewWords.length)
  const dueWords = shuffle(dueReviewWords).slice(0, targetDue)
  for (const r of dueWords) {
    const w = wordMap.get(r.wordId)
    if (w && !usedIds.has(w.id)) {
      selected.push(w)
      usedIds.add(w.id)
    }
  }

  const targetError = Math.min(Math.ceil(count * 0.3), activeErrorWordIds.length)
  const errorWords = shuffle(activeErrorWordIds).slice(0, targetError)
  for (const id of errorWords) {
    const w = wordMap.get(id)
    if (w && !usedIds.has(w.id)) {
      selected.push(w)
      usedIds.add(w.id)
    }
  }

  const newWords = shuffle(categoryWords.filter(w => !usedIds.has(w.id) && !recordMap.has(w.id)))
  for (const w of newWords) {
    if (selected.length >= count) break
    selected.push(w)
    usedIds.add(w.id)
  }

  const remaining = shuffle(categoryWords.filter(w => !usedIds.has(w.id)))
  for (const w of remaining) {
    if (selected.length >= count) break
    selected.push(w)
    usedIds.add(w.id)
  }

  return shuffle(selected).map(word => {
    const record = recordMap.get(word.id)
    const level = record?.level ?? 0
    const mode = determineMode(level)

    if (mode === 'spell') {
      return { word, mode }
    }

    const distractorCount = choiceCount - 1
    const distractors = generateDistractors(word, allWords, masteredIds, distractorCount)
    const choices = shuffle([word, ...distractors])
    return { word, mode, choices }
  })
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
```

- [ ] **Step 4: Run quiz engine tests**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run tests/services/quiz-engine.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/services/quiz-engine.ts tests/services/quiz-engine.test.ts
git commit -m "feat: add quiz engine with question generation and grading"
```


---

### Task 6: Speech & Sound Hooks

**Files:**
- Create: `vocab-practice/src/hooks/use-speech.ts`
- Create: `vocab-practice/src/hooks/use-sound.ts`

- [ ] **Step 1: Implement speech hook**

Create `vocab-practice/src/hooks/use-speech.ts`:

```ts
import { useCallback } from 'react'

export function useSpeech() {
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }, [])

  return { speak }
}
```

- [ ] **Step 2: Implement sound hook**

Create `vocab-practice/src/hooks/use-sound.ts`:

```ts
import { useCallback, useRef } from 'react'

export function useSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src)
      audioRef.current.volume = 0.3
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [src])

  return { play }
}
```

- [ ] **Step 3: Add a short correct sound effect**

Download or create a minimal correct answer sound. For now, use a simple approach:

Create `vocab-practice/public/correct.mp3` — use any short "ding" sound effect (< 50KB). If no audio file is available, the app will gracefully skip the sound (the `.catch(() => {})` handles this).

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/hooks/ public/
git commit -m "feat: add speech synthesis and sound effect hooks"
```

---

### Task 7: Shared Components (WordCard, ProgressBar, BarChart)

**Files:**
- Create: `vocab-practice/src/components/Layout.tsx`
- Create: `vocab-practice/src/components/WordCard.tsx`
- Create: `vocab-practice/src/components/ProgressBar.tsx`
- Create: `vocab-practice/src/components/BarChart.tsx`

- [ ] **Step 1: Implement Layout**

Create `vocab-practice/src/components/Layout.tsx`:

```tsx
import type { ReactNode } from 'react'

interface LayoutProps {
  title?: string
  onBack?: () => void
  children: ReactNode
}

export default function Layout({ title, onBack, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col">
      {title && (
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-2xl text-sky-600 leading-none"
              aria-label="返回"
            >
              ←
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </header>
      )}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Implement WordCard**

Create `vocab-practice/src/components/WordCard.tsx`:

```tsx
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
```

- [ ] **Step 3: Implement ProgressBar**

Create `vocab-practice/src/components/ProgressBar.tsx`:

```tsx
interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="w-full bg-gray-200 rounded-full h-3" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      <div
        className="bg-sky-400 h-3 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Implement BarChart**

Create `vocab-practice/src/components/BarChart.tsx`:

```tsx
interface BarChartProps {
  data: { label: string; value: number }[]
}

export default function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-600">{d.value}</span>
          <div
            className="w-full bg-sky-400 rounded-t-md transition-all duration-300"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
          />
          <span className="text-xs text-gray-500">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Verify dev server renders components**

Import and render one component temporarily in App.tsx to verify Tailwind is working:

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npm run dev
```

Check browser — verify styles render correctly, then revert App.tsx.

- [ ] **Step 6: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/components/
git commit -m "feat: add shared components (Layout, WordCard, ProgressBar, BarChart)"
```


---

### Task 8: Question Components (ChoiceQuestion, SpellQuestion)

**Files:**
- Create: `vocab-practice/src/components/ChoiceQuestion.tsx`
- Create: `vocab-practice/src/components/SpellQuestion.tsx`

- [ ] **Step 1: Implement ChoiceQuestion**

Create `vocab-practice/src/components/ChoiceQuestion.tsx`:

```tsx
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
```

- [ ] **Step 2: Implement SpellQuestion**

Create `vocab-practice/src/components/SpellQuestion.tsx`:

```tsx
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
```

- [ ] **Step 3: Verify components render in dev server**

Temporarily import and render both components in App.tsx with mock data to verify they display correctly. Check:
- ChoiceQuestion shows prompt and 4 clickable options
- SpellQuestion shows prompt and input field
- Color feedback works on answer

Then revert App.tsx.

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/components/ChoiceQuestion.tsx src/components/SpellQuestion.tsx
git commit -m "feat: add ChoiceQuestion and SpellQuestion components"
```


---

### Task 9: HomePage + CategoryListPage

**Files:**
- Create: `vocab-practice/src/pages/HomePage.tsx`
- Create: `vocab-practice/src/pages/CategoryListPage.tsx`
- Modify: `vocab-practice/src/App.tsx`

- [ ] **Step 1: Implement HomePage**

Create `vocab-practice/src/pages/HomePage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDueReviewWords, getAllRecords } from '../db/learning-records'
import Layout from '../components/Layout'

export default function HomePage() {
  const navigate = useNavigate()
  const [dueCount, setDueCount] = useState(0)
  const [totalLearned, setTotalLearned] = useState(0)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    getDueReviewWords(today).then(words => setDueCount(words.length))
    getAllRecords().then(records => setTotalLearned(records.length))
  }, [])

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">单词练习</h1>
        <p className="text-gray-500">已学 {totalLearned} 个单词</p>

        {dueCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-center">
            今日待复习 <span className="font-bold">{dueCount}</span> 个词
          </div>
        )}

        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={() => navigate('/categories')}
            className="w-full bg-sky-500 text-white text-xl py-4 rounded-2xl hover:bg-sky-600 transition-colors"
          >
            开始学习
          </button>
          <button
            onClick={() => navigate('/parent/login')}
            className="w-full bg-white text-gray-600 text-lg py-3 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            家长入口
          </button>
        </div>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Implement CategoryListPage**

Create `vocab-practice/src/pages/CategoryListPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProgressBar from '../components/ProgressBar'
import wordBank from '../data/words.json'
import { getRecordsByCategory } from '../db/learning-records'
import { getSettings } from '../stores/settings'
import { shouldUnlockNext } from '../services/category-unlock'
import type { Category, Word } from '../types'

const categories = wordBank.categories as Category[]
const allWords = wordBank.words as Word[]

export default function CategoryListPage() {
  const navigate = useNavigate()
  const [unlockedIds, setUnlockedIds] = useState<number[]>([1])
  const [categoryStats, setCategoryStats] = useState<Map<number, { learned: number; total: number }>>(new Map())

  useEffect(() => {
    async function load() {
      const settings = getSettings()
      let unlocked = [...settings.unlockedCategories]

      const stats = new Map<number, { learned: number; total: number }>()

      for (const cat of categories) {
        const catWords = allWords.filter(w => w.categoryId === cat.id)
        const records = await getRecordsByCategory(cat.id)
        const learned = records.filter(r => r.level >= 1).length
        stats.set(cat.id, { learned, total: catWords.length })

        if (unlocked.includes(cat.id) && !unlocked.includes(cat.id + 1)) {
          if (shouldUnlockNext(catWords, records, settings.unlockThreshold)) {
            const nextCat = categories.find(c => c.id === cat.id + 1)
            if (nextCat) {
              unlocked.push(nextCat.id)
            }
          }
        }
      }

      if (unlocked.length > settings.unlockedCategories.length) {
        const { updateSettings } = await import('../stores/settings')
        updateSettings({ unlockedCategories: unlocked })
      }

      setUnlockedIds(unlocked)
      setCategoryStats(stats)
    }
    load()
  }, [])

  return (
    <Layout title="选择主题" onBack={() => navigate('/')}>
      <div className="space-y-3">
        {categories.map(cat => {
          const locked = !unlockedIds.includes(cat.id)
          const stat = categoryStats.get(cat.id)

          return (
            <button
              key={cat.id}
              onClick={() => !locked && navigate(`/learn/${cat.id}`)}
              disabled={locked}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                locked
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-gray-200 hover:border-sky-300 text-gray-800'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium">
                  {locked ? '🔒 ' : ''}{cat.name}
                </span>
                {stat && (
                  <span className="text-sm text-gray-500">
                    {stat.learned}/{stat.total}
                  </span>
                )}
              </div>
              {stat && !locked && (
                <ProgressBar current={stat.learned} total={stat.total} />
              )}
            </button>
          )
        })}
      </div>
    </Layout>
  )
}
```

- [ ] **Step 3: Wire up routes in App.tsx**

Replace `vocab-practice/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CategoryListPage from './pages/CategoryListPage'

function Placeholder({ name }: { name: string }) {
  return <div className="p-8 text-2xl text-center">{name}</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/learn/:categoryId" element={<Placeholder name="学习页" />} />
        <Route path="/practice/:categoryId" element={<Placeholder name="练习页" />} />
        <Route path="/result" element={<Placeholder name="结果页" />} />
        <Route path="/parent/login" element={<Placeholder name="家长登录" />} />
        <Route path="/parent/dashboard" element={<Placeholder name="家长面板" />} />
        <Route path="/parent/category/:categoryId" element={<Placeholder name="主题详情" />} />
        <Route path="/parent/settings" element={<Placeholder name="设置" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Test in browser**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npm run dev
```

Verify:
- HomePage shows "单词练习", learned count, and two buttons
- "开始学习" navigates to /categories
- CategoryListPage shows all categories, first one unlocked, rest locked
- Clicking unlocked category navigates to /learn/:id

- [ ] **Step 5: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/pages/HomePage.tsx src/pages/CategoryListPage.tsx src/App.tsx
git commit -m "feat: add HomePage with review reminder and CategoryListPage with unlock logic"
```


---

### Task 10: LearnPage (New Word Browsing)

**Files:**
- Create: `vocab-practice/src/pages/LearnPage.tsx`
- Modify: `vocab-practice/src/App.tsx` (import LearnPage)

- [ ] **Step 1: Implement LearnPage**

Create `vocab-practice/src/pages/LearnPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import WordCard from '../components/WordCard'
import { useSpeech } from '../hooks/use-speech'
import wordBank from '../data/words.json'
import { getRecordsByCategory } from '../db/learning-records'
import type { Word } from '../types'

const allWords = wordBank.words as Word[]

export default function LearnPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { speak } = useSpeech()
  const catId = Number(categoryId)

  const [newWords, setNewWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const catWords = allWords.filter(w => w.categoryId === catId)
      const records = await getRecordsByCategory(catId)
      const learnedIds = new Set(records.map(r => r.wordId))
      const unlearned = catWords.filter(w => !learnedIds.has(w.id)).slice(0, 10)
      setNewWords(unlearned)
      setLoading(false)
    }
    load()
  }, [catId])

  useEffect(() => {
    if (newWords.length > 0 && currentIndex < newWords.length) {
      speak(newWords[currentIndex].english)
    }
  }, [currentIndex, newWords, speak])

  if (loading) {
    return <Layout title="加载中..."><div /></Layout>
  }

  if (newWords.length === 0) {
    return (
      <Layout title="学习新词" onBack={() => navigate('/categories')}>
        <div className="text-center py-12 space-y-4">
          <p className="text-xl text-gray-600">这个主题没有新词了</p>
          <button
            onClick={() => navigate(`/practice/${catId}`)}
            className="bg-sky-500 text-white text-lg px-6 py-3 rounded-xl hover:bg-sky-600 transition-colors"
          >
            直接练习
          </button>
        </div>
      </Layout>
    )
  }

  const word = newWords[currentIndex]
  const isLast = currentIndex === newWords.length - 1

  return (
    <Layout title={`学习新词 (${currentIndex + 1}/${newWords.length})`} onBack={() => navigate('/categories')}>
      <div className="space-y-6">
        <WordCard word={word} />

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-600 text-lg py-3 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            上一个
          </button>

          {isLast ? (
            <button
              onClick={() => navigate(`/practice/${catId}`)}
              className="flex-1 bg-sky-500 text-white text-lg py-3 rounded-xl hover:bg-sky-600 transition-colors"
            >
              开始练习
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              className="flex-1 bg-sky-500 text-white text-lg py-3 rounded-xl hover:bg-sky-600 transition-colors"
            >
              下一个
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Update App.tsx to use LearnPage**

In `vocab-practice/src/App.tsx`, replace the learn route placeholder:

```tsx
import LearnPage from './pages/LearnPage'
// ...
<Route path="/learn/:categoryId" element={<LearnPage />} />
```

- [ ] **Step 3: Test in browser**

Verify:
- Navigate to /learn/1 — shows first new word with emoji, english, phonetic, chinese
- Auto-plays pronunciation on load
- Click 🔊 replays pronunciation
- Arrow buttons navigate between words
- Last word shows "开始练习" button → navigates to /practice/1
- If all words already learned, shows "直接练习" shortcut

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/pages/LearnPage.tsx src/App.tsx
git commit -m "feat: add LearnPage for browsing new words with pronunciation"
```


---

### Task 11: PracticePage (Quiz Session)

**Files:**
- Create: `vocab-practice/src/pages/PracticePage.tsx`
- Modify: `vocab-practice/src/App.tsx` (import PracticePage)

- [ ] **Step 1: Implement PracticePage**

Create `vocab-practice/src/pages/PracticePage.tsx`:

```tsx
import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import ProgressBar from '../components/ProgressBar'
import ChoiceQuestion from '../components/ChoiceQuestion'
import SpellQuestion from '../components/SpellQuestion'
import wordBank from '../data/words.json'
import { buildQuizQuestions, gradeAnswer } from '../services/quiz-engine'
import { getNextReviewDate } from '../services/review-scheduler'
import { getRecordsByCategory, getDueReviewWords, upsertRecord, getRecord } from '../db/learning-records'
import { addError, recordCorrectAnswer, getActiveErrors } from '../db/error-records'
import { getSettings } from '../stores/settings'
import { useSound } from '../hooks/use-sound'
import type { Word, Question, AnswerResult, LearningRecord } from '../types'

const allWords = wordBank.words as Word[]

export default function PracticePage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const catId = Number(categoryId)
  const { play: playCorrect } = useSound('/correct.mp3')

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [loading, setLoading] = useState(true)
  const startTime = useRef(Date.now())

  useEffect(() => {
    async function load() {
      const settings = getSettings()
      const categoryWords = allWords.filter(w => w.categoryId === catId)
      const today = new Date().toISOString().slice(0, 10)
      const records = await getRecordsByCategory(catId)
      const dueReview = await getDueReviewWords(today)
      const activeErrors = await getActiveErrors()

      const qs = buildQuizQuestions({
        allWords,
        categoryWords,
        dueReviewWords: dueReview,
        activeErrorWordIds: activeErrors.map(e => e.wordId),
        records,
        count: settings.dailyGoal,
        choiceCount: settings.choiceCount,
      })

      setQuestions(qs)
      setLoading(false)
    }
    load()
  }, [catId])

  async function handleAnswer(userAnswer: string, correct: boolean) {
    const q = questions[currentIndex]
    const today = new Date().toISOString().slice(0, 10)

    const result: AnswerResult = {
      wordId: q.word.id,
      mode: q.mode,
      correct,
      userAnswer,
      correctAnswer: q.mode === 'choiceEnToCn' ? q.word.chinese : q.word.english,
    }
    setResults(prev => [...prev, result])

    if (correct) {
      playCorrect()
    }

    const existing = await getRecord(q.word.id)
    const oldLevel = existing?.level ?? 0
    const oldConsecutive = existing?.consecutiveCorrect ?? 0

    let newLevel: number
    let newConsecutive: number
    let mastered: boolean

    if (correct) {
      newLevel = Math.min(5, oldLevel + 1)
      newConsecutive = oldConsecutive + 1
      mastered = newLevel === 5 && newConsecutive >= 3
      await recordCorrectAnswer(q.word.id)
    } else {
      newLevel = Math.max(0, oldLevel - 1)
      newConsecutive = 0
      mastered = false
      await addError(q.word.id, q.mode, userAnswer)
    }

    const nextReview = getNextReviewDate(newLevel, today, mastered)

    await upsertRecord({
      wordId: q.word.id,
      level: newLevel,
      consecutiveCorrect: newConsecutive,
      nextReviewDate: nextReview,
      totalAttempts: (existing?.totalAttempts ?? 0) + 1,
      totalCorrect: (existing?.totalCorrect ?? 0) + (correct ? 1 : 0),
      mastered,
      lastPracticeDate: today,
    })

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      const elapsed = Math.round((Date.now() - startTime.current) / 60000)
      navigate('/result', {
        state: {
          results: [...results, result],
          elapsed,
          categoryId: catId,
        },
      })
    }
  }

  if (loading) {
    return <Layout title="加载中..."><div /></Layout>
  }

  if (questions.length === 0) {
    return (
      <Layout title="练习" onBack={() => navigate('/categories')}>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">暂无可练习的单词</p>
        </div>
      </Layout>
    )
  }

  const q = questions[currentIndex]
  const settings = getSettings()

  return (
    <Layout title={`练习`} onBack={() => navigate('/categories')}>
      <div className="space-y-4">
        <ProgressBar current={currentIndex + 1} total={questions.length} />
        <div className="text-sm text-gray-500 text-center">
          {currentIndex + 1} / {questions.length}
        </div>

        {q.mode === 'spell' ? (
          <SpellQuestion
            key={q.word.id}
            word={q.word}
            showHint={settings.spellHint}
            onAnswer={handleAnswer}
          />
        ) : (
          <ChoiceQuestion
            key={q.word.id}
            word={q.word}
            mode={q.mode}
            choices={q.choices!}
            onAnswer={handleAnswer}
          />
        )}
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Update App.tsx**

In `vocab-practice/src/App.tsx`, replace the practice route placeholder:

```tsx
import PracticePage from './pages/PracticePage'
// ...
<Route path="/practice/:categoryId" element={<PracticePage />} />
```

- [ ] **Step 3: Test in browser**

Verify:
- Navigate through learn → practice flow
- Choice questions show prompt + 4 options
- Correct answer flashes green, plays sound, advances after 0.5s
- Wrong answer shows red + green correct, waits 1.5s
- Spell questions show input field, grade correctly
- Progress bar advances
- After last question, navigates to /result with state

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/pages/PracticePage.tsx src/App.tsx
git commit -m "feat: add PracticePage with quiz session, grading, and spaced repetition"
```


---

### Task 12: ResultPage

**Files:**
- Create: `vocab-practice/src/pages/ResultPage.tsx`
- Modify: `vocab-practice/src/App.tsx` (import ResultPage)

- [ ] **Step 1: Implement ResultPage**

Create `vocab-practice/src/pages/ResultPage.tsx`:

```tsx
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useSpeech } from '../hooks/use-speech'
import wordBank from '../data/words.json'
import type { AnswerResult, Word } from '../types'

const allWords = wordBank.words as Word[]

interface ResultState {
  results: AnswerResult[]
  elapsed: number
  categoryId: number
}

export default function ResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { speak } = useSpeech()
  const state = location.state as ResultState | null

  if (!state) {
    navigate('/')
    return null
  }

  const { results, elapsed, categoryId } = state
  const correctCount = results.filter(r => r.correct).length
  const wrongResults = results.filter(r => !r.correct)
  const wordMap = new Map(allWords.map(w => [w.id, w]))

  return (
    <Layout title="练习结果" onBack={() => navigate('/categories')}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center space-y-2">
          <div className="text-4xl font-bold text-gray-800">
            {correctCount} / {results.length}
          </div>
          <div className="text-gray-500">
            用时 {elapsed < 1 ? '不到1' : elapsed} 分钟
          </div>
        </div>

        {wrongResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-700">错误的词</h2>
            {wrongResults.map(r => {
              const word = wordMap.get(r.wordId)
              if (!word) return null
              return (
                <div
                  key={r.wordId}
                  className="bg-white rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <button
                      onClick={() => speak(word.english)}
                      className="text-lg font-medium text-gray-800 hover:text-sky-600"
                    >
                      {word.emoji} {word.english} 🔊
                    </button>
                    <div className="text-sm text-gray-500">{word.chinese}</div>
                  </div>
                  <div className="text-sm text-red-400">
                    你的答案: {r.userAnswer}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-3">
          {wrongResults.length > 0 && (
            <button
              onClick={() => navigate(`/practice/${categoryId}`)}
              className="flex-1 bg-amber-500 text-white text-lg py-3 rounded-xl hover:bg-amber-600 transition-colors"
            >
              重练错词
            </button>
          )}
          <button
            onClick={() => navigate('/categories')}
            className="flex-1 bg-sky-500 text-white text-lg py-3 rounded-xl hover:bg-sky-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Update App.tsx**

In `vocab-practice/src/App.tsx`, replace the result route placeholder:

```tsx
import ResultPage from './pages/ResultPage'
// ...
<Route path="/result" element={<ResultPage />} />
```

- [ ] **Step 3: Test in browser**

Complete a full learn → practice → result flow:
- Verify correct/total count displays
- Verify elapsed time shows
- Verify wrong words listed with play button
- Verify "重练错词" button navigates back to practice
- Verify "返回" goes to categories

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/pages/ResultPage.tsx src/App.tsx
git commit -m "feat: add ResultPage with wrong word list and replay"
```

---

### Task 13: Parent Login Page

**Files:**
- Create: `vocab-practice/src/pages/ParentLoginPage.tsx`
- Modify: `vocab-practice/src/App.tsx` (import ParentLoginPage)

- [ ] **Step 1: Implement ParentLoginPage**

Create `vocab-practice/src/pages/ParentLoginPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getSettings, updateSettings } from '../stores/settings'

export default function ParentLoginPage() {
  const navigate = useNavigate()
  const settings = getSettings()
  const isFirstTime = !settings.parentPassword

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (isFirstTime) {
      if (password.length !== 4 || !/^\d{4}$/.test(password)) {
        setError('请输入4位数字密码')
        return
      }
      if (password !== confirmPassword) {
        setError('两次密码不一致')
        return
      }
      updateSettings({ parentPassword: password })
      navigate('/parent/dashboard')
    } else {
      if (password !== settings.parentPassword) {
        setError('密码错误')
        return
      }
      navigate('/parent/dashboard')
    }
  }

  return (
    <Layout title="家长入口" onBack={() => navigate('/')}>
      <form onSubmit={handleSubmit} className="max-w-xs mx-auto space-y-4 pt-12">
        <div>
          <label className="block text-gray-700 mb-2">
            {isFirstTime ? '设置4位数字密码' : '输入密码'}
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={password}
            onChange={e => setPassword(e.target.value.replace(/\D/g, ''))}
            placeholder="4位数字"
            autoFocus
            className="w-full text-center text-2xl tracking-[0.5em] p-3 border-2 border-gray-300 rounded-xl focus:border-sky-400 outline-none"
          />
        </div>

        {isFirstTime && (
          <div>
            <label className="block text-gray-700 mb-2">确认密码</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value.replace(/\D/g, ''))}
              placeholder="再次输入"
              className="w-full text-center text-2xl tracking-[0.5em] p-3 border-2 border-gray-300 rounded-xl focus:border-sky-400 outline-none"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          className="w-full bg-sky-500 text-white text-lg py-3 rounded-xl hover:bg-sky-600 transition-colors"
        >
          {isFirstTime ? '设置密码并进入' : '进入'}
        </button>
      </form>
    </Layout>
  )
}
```

- [ ] **Step 2: Update App.tsx**

```tsx
import ParentLoginPage from './pages/ParentLoginPage'
// ...
<Route path="/parent/login" element={<ParentLoginPage />} />
```

- [ ] **Step 3: Test in browser**

- First visit: shows "设置4位数字密码" + confirm field
- Set password → navigates to dashboard
- Second visit: shows "输入密码" only
- Wrong password shows error
- Correct password navigates to dashboard

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/pages/ParentLoginPage.tsx src/App.tsx
git commit -m "feat: add parent login page with password setup and verification"
```


---

### Task 14: Parent Dashboard Page

**Files:**
- Create: `vocab-practice/src/pages/ParentDashboardPage.tsx`
- Modify: `vocab-practice/src/App.tsx` (import ParentDashboardPage)

- [ ] **Step 1: Implement ParentDashboardPage**

Create `vocab-practice/src/pages/ParentDashboardPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProgressBar from '../components/ProgressBar'
import BarChart from '../components/BarChart'
import wordBank from '../data/words.json'
import { getAllRecords, getTodayPracticedCount } from '../db/learning-records'
import { getSettings } from '../stores/settings'
import type { Word, LearningRecord } from '../types'

const allWords = wordBank.words as Word[]
const totalWords = allWords.length

export default function ParentDashboardPage() {
  const navigate = useNavigate()
  const settings = getSettings()

  const [records, setRecords] = useState<LearningRecord[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const [weekData, setWeekData] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    async function load() {
      const allRecs = await getAllRecords()
      setRecords(allRecs)

      const today = new Date().toISOString().slice(0, 10)
      const count = await getTodayPracticedCount(today)
      setTodayCount(count)

      const days: { label: string; value: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`
        const dayCount = allRecs.filter(r => r.lastPracticeDate === dateStr).length
        days.push({ label: dayLabel, value: dayCount })
      }
      setWeekData(days)
    }
    load()
  }, [])

  const learnedCount = records.length
  const masteredCount = records.filter(r => r.mastered).length
  const totalAttempts = records.reduce((sum, r) => sum + r.totalAttempts, 0)
  const totalCorrect = records.reduce((sum, r) => sum + r.totalCorrect, 0)
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  return (
    <Layout title="学习报告" onBack={() => navigate('/')}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <div className="flex justify-between text-gray-700">
            <span>已学单词</span>
            <span className="font-bold">{learnedCount} / {totalWords}</span>
          </div>
          <ProgressBar current={learnedCount} total={totalWords} />

          <div className="grid grid-cols-3 gap-3 text-center pt-2">
            <div>
              <div className="text-2xl font-bold text-sky-600">{masteredCount}</div>
              <div className="text-xs text-gray-500">已掌握</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-600">{todayCount}</div>
              <div className="text-xs text-gray-500">今日练习</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-sky-600">{accuracy}%</div>
              <div className="text-xs text-gray-500">正确率</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <h2 className="font-bold text-gray-700">最近7天</h2>
          <BarChart data={weekData} />
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <h2 className="font-bold text-gray-700">主题详情</h2>
          {wordBank.categories.map((cat: any) => {
            const catWords = allWords.filter(w => w.categoryId === cat.id)
            const catRecords = records.filter(r => r.wordId.startsWith(`cat${cat.id}_`))
            const catLearned = catRecords.filter(r => r.level >= 1).length

            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/parent/category/${cat.id}`)}
                className="w-full flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-left hover:bg-gray-50"
              >
                <span className="text-gray-700">{cat.name}</span>
                <span className="text-sm text-gray-500">{catLearned}/{catWords.length}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => navigate('/parent/settings')}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 text-lg py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          设置
        </button>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Update App.tsx**

```tsx
import ParentDashboardPage from './pages/ParentDashboardPage'
// ...
<Route path="/parent/dashboard" element={<ParentDashboardPage />} />
```

- [ ] **Step 3: Test in browser**

- Login as parent → see dashboard
- Verify stats display (learned, mastered, today, accuracy)
- Verify 7-day bar chart renders
- Verify category list with counts
- Click category → navigates to detail page

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/pages/ParentDashboardPage.tsx src/App.tsx
git commit -m "feat: add parent dashboard with progress overview and 7-day chart"
```


---

### Task 15: Parent Category Detail Page

**Files:**
- Create: `vocab-practice/src/pages/ParentCategoryPage.tsx`
- Modify: `vocab-practice/src/App.tsx` (import ParentCategoryPage)

- [ ] **Step 1: Implement ParentCategoryPage**

Create `vocab-practice/src/pages/ParentCategoryPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import wordBank from '../data/words.json'
import { getRecordsByCategory } from '../db/learning-records'
import { getAllErrors } from '../db/error-records'
import type { Word, LearningRecord, ErrorRecord } from '../types'

const allWords = wordBank.words as Word[]
const categories = wordBank.categories as { id: number; name: string }[]

export default function ParentCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const catId = Number(categoryId)
  const category = categories.find(c => c.id === catId)

  const [records, setRecords] = useState<LearningRecord[]>([])
  const [errors, setErrors] = useState<ErrorRecord[]>([])

  const catWords = allWords.filter(w => w.categoryId === catId)

  useEffect(() => {
    async function load() {
      const recs = await getRecordsByCategory(catId)
      setRecords(recs)
      const allErrs = await getAllErrors()
      const catErrs = allErrs.filter(e => e.wordId.startsWith(`cat${catId}_`))
      setErrors(catErrs.sort((a, b) => b.errorCount - a.errorCount))
    }
    load()
  }, [catId])

  const recordMap = new Map(records.map(r => [r.wordId, r]))

  const levelLabels = ['未学', '认知1', '认知2', '理解1', '理解2', '拼写']

  return (
    <Layout title={category?.name ?? '主题详情'} onBack={() => navigate('/parent/dashboard')}>
      <div className="space-y-6">
        {errors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
            <h2 className="font-bold text-red-500">易错词 ({errors.length})</h2>
            {errors.slice(0, 20).map(err => {
              const word = catWords.find(w => w.id === err.wordId)
              if (!word) return null
              return (
                <div key={err.wordId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="font-medium text-gray-800">{word.emoji} {word.english}</span>
                    <span className="text-gray-500 ml-2">{word.chinese}</span>
                  </div>
                  <span className="text-sm text-red-400">错{err.errorCount}次</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <h2 className="font-bold text-gray-700">全部单词 ({catWords.length})</h2>
          {catWords.map(word => {
            const record = recordMap.get(word.id)
            const level = record?.level ?? 0
            const mastered = record?.mastered ?? false

            return (
              <div key={word.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-gray-800">{word.emoji} {word.english}</span>
                  <span className="text-gray-500 ml-2 text-sm">{word.chinese}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  mastered ? 'bg-green-100 text-green-700' :
                  level > 0 ? 'bg-sky-100 text-sky-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {mastered ? '已掌握' : levelLabels[level]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Update App.tsx**

```tsx
import ParentCategoryPage from './pages/ParentCategoryPage'
// ...
<Route path="/parent/category/:categoryId" element={<ParentCategoryPage />} />
```

- [ ] **Step 3: Test in browser**

- Navigate from dashboard → click a category
- Verify error words section shows (if any errors exist)
- Verify all words listed with level badges
- Verify back button returns to dashboard

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/pages/ParentCategoryPage.tsx src/App.tsx
git commit -m "feat: add parent category detail page with error words and level display"
```

---

### Task 16: Parent Settings Page

**Files:**
- Create: `vocab-practice/src/pages/ParentSettingsPage.tsx`
- Modify: `vocab-practice/src/App.tsx` (import ParentSettingsPage)

- [ ] **Step 1: Implement ParentSettingsPage**

Create `vocab-practice/src/pages/ParentSettingsPage.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getSettings, updateSettings } from '../stores/settings'
import wordBank from '../data/words.json'
import { db } from '../db'

const categories = wordBank.categories as { id: number; name: string }[]

export default function ParentSettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(getSettings())
  const [resetConfirm, setResetConfirm] = useState<number | null>(null)

  function handleChange(partial: Partial<typeof settings>) {
    const updated = { ...settings, ...partial }
    setSettings(updated)
    updateSettings(partial)
  }

  function toggleCategory(catId: number) {
    const current = settings.unlockedCategories
    const updated = current.includes(catId)
      ? current.filter(id => id !== catId)
      : [...current, catId].sort((a, b) => a - b)
    handleChange({ unlockedCategories: updated })
  }

  async function resetCategory(catId: number) {
    const prefix = `cat${catId}_`
    const allRecords = await db.learningRecords.toArray()
    const toDelete = allRecords.filter(r => r.wordId.startsWith(prefix))
    await Promise.all(toDelete.map(r => db.learningRecords.delete(r.wordId)))

    const allErrors = await db.errorRecords.toArray()
    const errorsToDelete = allErrors.filter(r => r.wordId.startsWith(prefix))
    await Promise.all(errorsToDelete.map(r => db.errorRecords.delete(r.wordId)))

    setResetConfirm(null)
  }

  return (
    <Layout title="设置" onBack={() => navigate('/parent/dashboard')}>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h2 className="font-bold text-gray-700">练习设置</h2>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">每日目标词数</span>
            <select
              value={settings.dailyGoal}
              onChange={e => handleChange({ dailyGoal: Number(e.target.value) })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {[10, 15, 20, 25, 30].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">选项数量</span>
            <select
              value={settings.choiceCount}
              onChange={e => handleChange({ choiceCount: Number(e.target.value) as 3 | 4 })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value={3}>3个</option>
              <option value={4}>4个</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">拼写提示（首字母）</span>
            <button
              onClick={() => handleChange({ spellHint: !settings.spellHint })}
              className={`w-12 h-7 rounded-full transition-colors ${
                settings.spellHint ? 'bg-sky-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-1 ${
                settings.spellHint ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h2 className="font-bold text-gray-700">主题管理</h2>
          <p className="text-sm text-gray-500">勾选手动解锁主题，取消勾选则锁定</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  checked={settings.unlockedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h2 className="font-bold text-red-500">重置进度</h2>
          <p className="text-sm text-gray-500">选择一个主题重置其学习进度（不可恢复）</p>
          <select
            value=""
            onChange={e => setResetConfirm(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="" disabled>选择主题...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {resetConfirm !== null && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-red-700">
                确定要重置「{categories.find(c => c.id === resetConfirm)?.name}」的所有学习进度吗？此操作不可恢复。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => resetCategory(resetConfirm)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  确认重置
                </button>
                <button
                  onClick={() => setResetConfirm(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Update App.tsx**

```tsx
import ParentSettingsPage from './pages/ParentSettingsPage'
// ...
<Route path="/parent/settings" element={<ParentSettingsPage />} />
```

- [ ] **Step 3: Test in browser**

- Navigate to settings from dashboard
- Change daily goal → verify persists on page reload
- Toggle spell hint → verify toggle animation
- Change choice count → verify persists
- Unlock/lock categories → verify category list page reflects changes
- Reset a category → confirm dialog → verify records cleared

- [ ] **Step 4: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add src/pages/ParentSettingsPage.tsx src/App.tsx
git commit -m "feat: add parent settings page with goal, difficulty, unlock, and reset controls"
```


---

### Task 17: Final App.tsx Assembly + End-to-End Testing

**Files:**
- Modify: `vocab-practice/src/App.tsx` (final version with all routes)

- [ ] **Step 1: Write final App.tsx with all imports**

Replace `vocab-practice/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CategoryListPage from './pages/CategoryListPage'
import LearnPage from './pages/LearnPage'
import PracticePage from './pages/PracticePage'
import ResultPage from './pages/ResultPage'
import ParentLoginPage from './pages/ParentLoginPage'
import ParentDashboardPage from './pages/ParentDashboardPage'
import ParentCategoryPage from './pages/ParentCategoryPage'
import ParentSettingsPage from './pages/ParentSettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<CategoryListPage />} />
        <Route path="/learn/:categoryId" element={<LearnPage />} />
        <Route path="/practice/:categoryId" element={<PracticePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/parent/login" element={<ParentLoginPage />} />
        <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
        <Route path="/parent/category/:categoryId" element={<ParentCategoryPage />} />
        <Route path="/parent/settings" element={<ParentSettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Run all unit tests**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Run TypeScript type check**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: End-to-end manual testing in browser**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npm run dev
```

Test the complete flow:

**Child flow:**
1. HomePage → shows "单词练习", learned count, review reminder if applicable
2. "开始学习" → CategoryListPage → first category unlocked, rest locked
3. Click category → LearnPage → browse 10 new words with pronunciation
4. "开始练习" → PracticePage → 15 questions mixed (choice + spell based on level)
5. Answer questions → correct shows green + sound, wrong shows red + correct answer
6. After last question → ResultPage → shows score, time, wrong words with replay
7. "返回" → back to categories

**Parent flow:**
1. "家长入口" → ParentLoginPage → set 4-digit password (first time)
2. → ParentDashboardPage → stats, 7-day chart, category list
3. Click category → ParentCategoryPage → error words + all words with levels
4. "设置" → ParentSettingsPage → change goal, difficulty, unlock categories, reset

**Edge cases:**
- Practice with no new words (all learned) → should still work with review words
- All words mastered in a category → next category auto-unlocks
- Empty state (first use) → no errors, clean dashboard

- [ ] **Step 5: Build production bundle**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/xiongfusong/claude-workspace/vocab-practice
git add -A
git commit -m "feat: complete app assembly with all routes and pages"
```

