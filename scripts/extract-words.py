#!/usr/bin/env python3
"""
Extract vocabulary words from WeChat article HTML.
Parses /Users/xiongfusong/claude-workspace/content.html and outputs
structured JSON to ../src/data/words.json.
"""

import json
import re
import os
from html.parser import HTMLParser


# ---------------------------------------------------------------------------
# Step 1: Extract raw text from the js_content div
# ---------------------------------------------------------------------------

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_content = False
        self.depth = 0
        self.texts = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if attrs_dict.get('id') == 'js_content':
            self.in_content = True
            self.depth = 1
        elif self.in_content:
            self.depth += 1

    def handle_endtag(self, tag):
        if self.in_content:
            self.depth -= 1
            if self.depth == 0:
                self.in_content = False

    def handle_data(self, data):
        if self.in_content:
            stripped = data.strip()
            if stripped:
                self.texts.append(stripped)


def extract_text(html_path: str) -> list[str]:
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    extractor = TextExtractor()
    extractor.feed(content)
    lines = []
    for chunk in extractor.texts:
        for line in chunk.split('\n'):
            line = line.strip()
            if line:
                lines.append(line)
    return lines


# ---------------------------------------------------------------------------
# Step 2: Parse sections and words
# ---------------------------------------------------------------------------

# Chinese numeral map (supports up to 四十)
CN_NUMS = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25,
    '二十六': 26, '二十七': 27, '二十八': 28, '二十九': 29, '三十': 30,
    '三十一': 31, '三十二': 32, '三十三': 33, '三十四': 34, '三十五': 35,
    '三十六': 36, '三十七': 37, '三十八': 38, '三十九': 39, '四十': 40,
}

# Build a regex that matches Chinese numeral prefixes (longest first to avoid
# partial matches, e.g. "三十" before "三")
CN_NUM_PATTERN = '|'.join(sorted(CN_NUMS.keys(), key=len, reverse=True))

# Section header pattern:
#   <cn_num>、<name>(篇|类|补充) [optional extra like （Sports）] [optional emoji]
HEADER_RE = re.compile(
    r'^(' + CN_NUM_PATTERN + r')[、、]'   # numeral + 、(full-width or half-width)
    r'(.+?)(?:（[^）]*）)?'               # name (strip parenthetical)
    r'\s*[\U00010000-\U0010ffff☀-➿\U0001F300-\U0001FAFF]*$'  # trailing emoji
)

# Simpler header check: line starts with a known CN numeral followed by 、
HEADER_QUICK_RE = re.compile(r'^(' + CN_NUM_PATTERN + r')[、、]')

# Word line pattern:
#   english_phrase /phonetic/ chinese [optional emoji]
# The english part may contain spaces (e.g. "hot dog", "sweet potato")
# Phonetic is enclosed in / /
# Chinese follows, then optional emoji(s)
WORD_RE = re.compile(
    r'^([A-Za-z][A-Za-z0-9\s\-\'\.]*?)'   # english (greedy but lazy)
    r'\s+(/[^/]+/)'                         # /phonetic/
    r'\s+(.+?)$'                            # rest: chinese + optional emoji
)

# Emoji detection: Unicode ranges covering most emoji
EMOJI_RE = re.compile(
    r'[\U0001F000-\U0001FAFF'
    r'\U00002600-\U000027BF'
    r'\U0000FE00-\U0000FE0F'
    r'\U0001F900-\U0001F9FF'
    r'⌀-⏿'
    r'⭐-⭕'
    r'⌚-⌛'
    r'▪-◾'
    r'☔-☕'
    r'♈-♓'
    r'⚪-⚫'
    r'✂-➰'
    r'⤴-⤵'
    r'⬅-⬇'
    r'〰'
    r'〽'
    r'㊗'
    r'㊙'
    r'\U0001F004'
    r'\U0001F0CF'
    r'\U0001F170-\U0001F171'
    r'\U0001F17E-\U0001F17F'
    r'\U0001F18E'
    r'\U0001F191-\U0001F19A'
    r'\U0001F1E0-\U0001F1FF'
    r'\U0001F201-\U0001F202'
    r'\U0001F21A'
    r'\U0001F22F'
    r'\U0001F232-\U0001F23A'
    r'\U0001F250-\U0001F251'
    r']+',
    re.UNICODE
)

# ZWJ and variation selectors that appear between/after emoji chars
ZWJ_RE = re.compile(r'[‍️⃣]')


def split_chinese_emoji(text: str):
    """
    Split a string like '大的 🐘' or '哥哥 / 弟弟 👦' into
    (chinese_part, emoji_part).  The emoji is the trailing emoji sequence.
    """
    text = text.strip()
    # Find the last run of emoji characters (including ZWJ sequences)
    # Walk from the end
    # Strategy: find all emoji positions, take trailing cluster
    matches = list(EMOJI_RE.finditer(text))
    if not matches:
        return text.strip(), ''

    # Check if the last match is at the very end (allowing trailing spaces/ZWJ)
    last = matches[-1]
    tail = text[last.end():].strip()
    # tail should be empty or only ZWJ/variation selectors
    if tail and not ZWJ_RE.fullmatch(tail):
        # emoji is not at the end — treat whole thing as chinese, no emoji
        return text.strip(), ''

    emoji_part = text[last.start():].strip()
    chinese_part = text[:last.start()].strip()
    return chinese_part, emoji_part


def make_word_id(category_id: int, english: str) -> str:
    """Generate ID like cat1_big or cat10_hot_dog"""
    slug = re.sub(r'[^a-z0-9]+', '_', english.lower()).strip('_')
    return f'cat{category_id}_{slug}'


def parse_header(line: str):
    """
    Return (category_id, category_name) if line is a section header, else None.
    Strips trailing emoji, parentheticals like （Sports）, and section suffixes
    like 篇/类/补充 from the display name.
    """
    m = HEADER_QUICK_RE.match(line)
    if not m:
        return None
    cn_num = m.group(1)
    cat_id = CN_NUMS.get(cn_num)
    if cat_id is None:
        return None

    # Everything after the 、
    rest = line[m.end():]

    # Strip parentheticals like （Sports）（Nature）first
    rest = re.sub(r'（[^）]*）', '', rest).strip()
    rest = re.sub(r'\([^)]*\)', '', rest).strip()
    # Strip ALL non-CJK, non-ASCII-letter/digit characters (covers all emoji,
    # ZWJ sequences, variation selectors, geometric shapes like ⬛, etc.)
    # Keep: CJK unified ideographs (4E00-9FFF), CJK extension A (3400-4DBF),
    #        ASCII letters/digits, spaces, and common Chinese punctuation
    rest = re.sub(
        r'[^一-鿿㐀-䶿豈-﫿A-Za-z0-9\s　-〿]',
        '', rest
    ).strip()

    if not rest:
        return None

    return cat_id, rest


def parse_word_line(line: str, category_name: str, category_id: int):
    """
    Parse a word line and return a word dict, or None if not a word line.
    """
    m = WORD_RE.match(line)
    if not m:
        return None

    english = m.group(1).strip()
    phonetic = m.group(2).strip()
    rest = m.group(3).strip()

    chinese, emoji = split_chinese_emoji(rest)

    if not english or not phonetic or not chinese:
        return None

    return {
        'id': make_word_id(category_id, english),
        'english': english,
        'phonetic': phonetic,
        'chinese': chinese,
        'emoji': emoji,
        'category': category_name,
        'categoryId': category_id,
    }


# ---------------------------------------------------------------------------
# Step 3: Main extraction logic
# ---------------------------------------------------------------------------

def extract(html_path: str):
    lines = extract_text(html_path)

    categories = []
    words = []
    current_category = None
    current_category_id = None

    # Track seen category IDs to avoid duplicates
    seen_cat_ids = set()
    # Track seen word IDs (handle duplicates by appending _2, _3 etc.)
    word_id_counts = {}

    # Special case: first section "一、基础认知类" — handled by normal regex
    # but let's also handle the bare "一、基础认知类" line that may appear
    # without a trailing emoji.

    for line in lines:
        # Try to parse as section header
        header = parse_header(line)
        if header:
            cat_id, cat_name = header
            current_category_id = cat_id
            current_category = cat_name
            if cat_id not in seen_cat_ids:
                seen_cat_ids.add(cat_id)
                categories.append({'id': cat_id, 'name': cat_name})
            continue

        # Skip lines before first section
        if current_category is None:
            continue

        # Try to parse as word line
        word = parse_word_line(line, current_category, current_category_id)
        if word:
            # Handle duplicate IDs
            base_id = word['id']
            if base_id in word_id_counts:
                word_id_counts[base_id] += 1
                word['id'] = f"{base_id}_{word_id_counts[base_id]}"
            else:
                word_id_counts[base_id] = 1
            words.append(word)

    # Sort categories by id
    categories.sort(key=lambda c: c['id'])

    return {'categories': categories, 'words': words}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = '/Users/xiongfusong/claude-workspace/content.html'
    output_path = os.path.join(script_dir, '..', 'src', 'data', 'words.json')
    output_path = os.path.normpath(output_path)

    print(f'Parsing: {html_path}')
    data = extract(html_path)

    print(f'Categories found: {len(data["categories"])}')
    print(f'Words found:      {len(data["words"])}')

    # Validation
    issues = []
    for w in data['words']:
        for field in ('id', 'english', 'phonetic', 'chinese', 'category', 'categoryId'):
            if not w.get(field) and w.get(field) != 0:
                issues.append(f'Missing {field} in word: {w}')
    if issues:
        print(f'\nWARNING: {len(issues)} validation issues:')
        for issue in issues[:20]:
            print(' ', issue)
    else:
        print('Validation: all words have required fields')

    # Show category list
    print('\nCategories:')
    for cat in data['categories']:
        count = sum(1 for w in data['words'] if w['categoryId'] == cat['id'])
        print(f'  {cat["id"]:2d}. {cat["name"]} ({count} words)')

    # Write output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'\nOutput written to: {output_path}')
