#!/usr/bin/env python3
"""
Classify words from docs/2024新课标外研社小学3-4年级英语单词集合.md
into the 40 categories defined in src/data/words_template.json,
then output a new src/data/words.json.
"""

import json
import re
import os

# ---------------------------------------------------------------------------
# Step 1: Parse the markdown word list (same logic as extract-words-md.py)
# ---------------------------------------------------------------------------

SEMESTER_NAMES = {
    '三年级上册': '三上',
    '三年级下册': '三下',
    '四年级上册': '四上',
    '四年级下册': '四下',
}

WORD_RE = re.compile(
    r'^-\s+'
    r'(.+?)'
    r'\s+(/[^/]+/)'
    r'\s*'
    r'(?:(?:n|v|adj|adv|det|prep|pron|int|num|conj)\.\s*)?'
    r'(.+)$'
)

WORD_NO_PHONETIC_RE = re.compile(
    r'^-\s+'
    r'([A-Za-z][\w\s\.\'\-…]+?)'
    r'\s+'
    r'([一-鿿…].*)$'
)

POS_STRIP_RE = re.compile(r'^(?:n|v|adj|adv|det|prep|pron|int|num|conj)\.\s*')

HARDCODED_ENTRIES = {
    '- the': {'english': 'the', 'phonetic': '/ðə/', 'chinese': '这；那'},
    '- here you are': {'english': 'here you are', 'phonetic': '', 'chinese': '给你'},
}


def parse_md(md_path: str):
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    words = []
    current_semester = None
    current_unit = None

    for raw_line in lines:
        line = raw_line.rstrip('\n').strip()
        if not line:
            continue

        if line.startswith('### '):
            for full, short in SEMESTER_NAMES.items():
                if full in line:
                    current_semester = short
                    break
            continue

        if line.startswith('#') and not line.startswith('### '):
            header = line.lstrip('#').strip()
            if header.startswith('Welcome') or header.startswith('Unit'):
                unit_label = header.split('（')[0].split('(')[0].strip()
                unit_label = re.sub(r'\s+', ' ', unit_label)
                current_unit = f'{current_semester} {unit_label}'
            continue

        if not line.startswith('- ') or current_unit is None:
            continue

        if line in HARDCODED_ENTRIES:
            h = HARDCODED_ENTRIES[line]
            english, phonetic, chinese = h['english'], h['phonetic'], h['chinese']
        else:
            m = WORD_RE.match(line)
            if m:
                english = m.group(1).strip()
                phonetic = m.group(2).strip()
                chinese = m.group(3).strip()
                chinese = POS_STRIP_RE.sub('', chinese)
            else:
                m2 = WORD_NO_PHONETIC_RE.match(line)
                if m2:
                    english = m2.group(1).strip()
                    phonetic = ''
                    chinese = m2.group(2).strip()
                    chinese = POS_STRIP_RE.sub('', chinese)
                else:
                    continue

        english = re.sub(r'‌', '', english)
        english = english.replace('‘', "'").replace('’', "'")
        chinese = chinese.rstrip('；;')

        words.append({
            'english': english,
            'phonetic': phonetic,
            'chinese': chinese,
            'source_unit': current_unit,
        })

    return words


# ---------------------------------------------------------------------------
# Step 2: Classification rules
# ---------------------------------------------------------------------------

# Explicit word -> category mappings for ambiguous or tricky words
EXPLICIT_MAP = {
    # 基础认知类 (1) - basic adjectives about size/shape/quality/description
    'big': 1, 'small': 1, 'tall': 1, 'short': 1, 'long': 1, 'little': 1,
    'new': 1, 'old': 1, 'thin': 1, 'different': 1, 'same': 1, 'real': 1,
    'only': 1, 'best': 1, 'cool': 1, 'beautiful': 1, 'amazing': 1,
    'strong': 1, 'fast': 1, 'huge': 1, 'colourful': 1, 'magical': 1,
    'important': 1, 'special': 1, 'lovely': 1, 'quite': 1,
    'sweet': 1, 'cute': 1, 'yummy': 1, 'right': 1, 'wrong': 1,
    'easy': 1, 'dirty': 1, 'safe': 1, 'true': 1, 'more': 1,
    'slowly': 1, 'high': 1, 'far': 1, 'round': 1,

    # 家庭人物篇 (2)
    'family': 2, 'dad (father)': 2, 'mum (mother)': 2, 'brother': 2,
    'sister': 2, 'grandpa (grandfather)': 2, 'grandma (grandmother)': 2,
    'daddy': 2, 'mummy': 2, 'uncle': 2, 'aunt': 2, 'baby': 2,
    'people': 2, 'child': 2, 'twin': 2, 'man': 2, 'woman': 2, 'boy': 2,
    'kid': 2,

    # 职业篇 (3)
    'doctor': 3, 'fireman': 3, 'farmer': 3, 'cook': 3, 'police': 3,
    'police officer': 3, 'painter': 3, 'scientist': 3, 'writer': 3,
    'worker': 3, 'driver': 3, 'nurse': 3, 'postman': 3, 'teacher': 3,
    'student': 3, 'dancer': 3, 'dressmaker': 3, 'keeper': 3, 'helper': 3,
    'player': 3,

    # 身体部位篇 (4)
    'body': 4, 'head': 4, 'eye': 4, 'ear': 4, 'mouth': 4, 'nose': 4,
    'hand': 4, 'arm': 4, 'leg': 4, 'foot': 4, 'toe': 4, 'hair': 4,
    'face': 4,

    # 服装篇 (5)
    'clothes': 5, 'T-shirt': 5, 'skirt': 5, 'shorts': 5, 'shirt': 5,
    'trousers': 5, 'scarf': 5, 'sweater': 5, 'dress': 5, 'coat': 5,
    'cap': 5, 'hat': 5, 'shoe': 5, 'uniform': 5, 'robe': 5,

    # 食物篇 (6)
    'food': 6, 'noodle': 6, 'chicken': 6, 'fish': 6, 'rice': 6,
    'meat': 6, 'salad': 6, 'bean': 6, 'corn': 6, 'beef': 6,
    'dumpling': 6, 'hot dog': 6, 'sushi': 6, 'cake': 6, 'cupcake': 6,
    'sandwich': 6, 'ice cream': 6, 'egg': 6, 'breakfast': 6, 'lunch': 6,
    'dinner': 6, 'afternoon tea': 6, 'tea': 6,

    # 水果篇 (7)
    'fruit': 7, 'apple': 7, 'banana': 7, 'grape': 7, 'strawberry': 7,

    # 蔬菜篇 (8)
    'vegetable': 8, 'tomato': 8, 'carrot': 8, 'cucumber': 8,

    # 饮料篇 (9)
    'juice': 9, 'milk': 9, 'water': 9,

    # 动物篇 (10)
    'animal': 10, 'panda': 10, 'elephant': 10, 'bear': 10, 'giraffe': 10,
    'monkey': 10, 'tiger': 10, 'ostrich': 10, 'chameleon': 10, 'lion': 10,
    'zebra': 10, 'dog': 10, 'cat': 10, 'bird': 10, 'pig': 10, 'cow': 10,
    'insect': 10, 'mantis': 10, 'owl': 10, 'bee': 10, 'whale': 10,
    'cheep': 10, 'miaow': 10, 'woof': 10,

    # 颜色篇 (11)
    'colour': 11, 'red': 11, 'pink': 11, 'green': 11, 'yellow': 11,
    'orange': 11, 'blue': 11, 'purple': 11, 'black': 11, 'white': 11,
    'brown': 11,

    # 数字篇 (12)
    'number': 12, 'count': 12, 'one': 12, 'two': 12, 'three': 12,
    'four': 12, 'five': 12, 'six': 12, 'seven': 12, 'eight': 12,
    'nine': 12, 'ten': 12, 'eleven': 12, 'twelve': 12, 'fifteen': 12,
    'thirty': 12, 'forty-five': 12, 'half': 12, 'first': 12,

    # 时间篇 (14)
    'time': 14, 'day': 14, 'week': 14, 'month': 14, 'year': 14,
    'morning': 14, 'afternoon': 14, 'evening': 14, 'night': 14,
    'minute': 14, 'hour': 14, 'clock': 14, "o'clock": 14,
    'tick-tock': 14, 'half past one': 14, 'today': 14, 'tomorrow': 14,
    'now': 14, 'soon': 14, 'later': 14, 'early': 14, 'birthday': 14,
    'next': 14,

    # 星期篇 (15)
    'Monday': 15, 'Tuesday': 15, 'Wednesday': 15, 'Thursday': 15,
    'Friday': 15, 'Saturday': 15, 'Sunday': 15,

    # 天气篇 (17)
    'weather': 17, 'sunny': 17, 'cloud': 17, 'cloudy': 17, 'wind': 17,
    'windy': 17, 'rain': 17, 'rainy': 17, 'snow': 17, 'snowy': 17,
    'cold': 17, 'hot': 17, 'snowstorm': 17, 'raindrop': 17,

    # 季节篇 (18)
    'season': 18, 'spring': 18, 'summer': 18, 'autumn': 18, 'winter': 18,
    'all year round': 18,

    # 交通篇 (19)
    'bus': 19, 'car': 19, 'train': 19, 'ship': 19, 'plane': 19,
    'truck': 19, 'bike': 19, 'subway': 19, 'tram': 19, 'taxi': 19,
    'wheel': 19, 'travel': 19, 'beep': 19, 'whoosh': 19, 'chug': 19,

    # 地点篇 (20)
    'home': 20, 'room': 20, 'living room': 20, 'bedroom': 20,
    'bathroom': 20, 'kitchen': 20, 'dining room': 20, 'school': 20,
    'zoo': 20, 'park': 20, 'library': 20, 'cinema': 20, 'hospital': 20,
    'supermarket': 20, 'museum': 20, 'city': 20, 'town': 20,
    'place': 20, 'station': 20, 'police station': 20, 'restaurant': 20,
    'garden': 20, 'field': 20, 'beach': 20, 'mountain': 20,
    'street': 20, 'road': 20, 'yard': 20, 'centre': 20, 'hometown': 20,

    # 学校用品篇 (21)
    'pen': 21, 'pencil': 21, 'pencil case': 21, 'bag': 21, 'ruler': 21,
    'eraser': 21, 'schoolbag': 21, 'book': 21, 'paper': 21, 'desk': 21,
    'bookmark': 21, 'brush': 21, 'card': 21, 'note': 21,

    # 动词篇 (22)
    'come': 22, 'go': 22, 'play': 22, 'run': 22, 'jump': 22, 'sit': 22,
    'stand': 22, 'open': 22, 'close': 22, 'read': 22, 'write': 22,
    'listen': 22, 'say': 22, 'point': 22, 'meet': 22, 'help': 22,
    'sing': 22, 'know': 22, 'want': 22, 'see': 22, 'find': 22,
    'look': 22, 'look at': 22, 'have': 22, 'make': 22, 'show': 22,
    'put': 22, 'share': 22, 'think': 22, 'draw': 22, 'move': 22,
    'dance': 22, 'touch': 22, 'get': 22, 'hear': 22, 'smell': 22,
    'talk': 22, 'eat': 22, 'stop': 22, 'ask': 22, 'answer': 22,
    'swim': 22, 'learn': 22, 'watch': 22, 'study': 22, 'stay': 22,
    'grow': 22, 'grow up': 22, 'tell': 22, 'call': 22, 'visit': 22,
    'teach': 22, 'wash': 22, 'feed': 22, 'sweep': 22, 'tidy': 22,
    'clean': 22, 'water': 22, 'pick': 22, 'cut': 22, 'blow': 22,
    'enjoy': 22, 'turn': 22, 'turn on': 22, 'fly': 22, 'join': 22,
    'wear': 22, 'live': 22, 'cross': 22, 'use': 22, 'brighten': 22,
    'bake': 22, 'keep': 22, 'give': 22, 'give up': 22, 'try': 22,
    'lose': 22, 'fail': 22, 'laugh': 22, 'shout': 22, 'act': 22,
    'shine': 22, 'win': 22, 'dig': 22, 'plant': 22, 'sleep': 22,
    'come back': 22, 'stand up': 22, 'sit down': 22, 'take care of': 22,
    'come on': 22, 'warm up': 22, 'come true': 22, 'ring': 22,
    'hit': 22, 'design': 22, 'vote': 22, 'guess': 22, 'paint': 22,
    'do': 22, 'pack': 22, 'can': 22, 'may': 22, 'will': 22,
    'should': 22, 'need': 22, 'feel': 22, 'taste': 22,

    # 情感与感受篇 (23)
    'happy': 23, 'sad': 23, 'scared': 23, 'angry': 23, 'excited': 23,
    'worried': 23, 'tired': 23, 'hungry': 23, 'feeling': 23,

    # 教室指令篇 (24) - classroom/school context
    'class': 24, 'lesson': 24, 'subject': 24, 'homework': 24,
    'maths': 24, 'science': 24, 'English': 24, 'art': 24,
    'activity': 24, 'club': 24, 'after school': 24, 'exam': 24,

    # 方向与位置篇 (25)
    'in': 25, 'on': 25, 'under': 25, 'left': 25, 'straight': 25,
    'back': 25, 'there': 25, 'here': 25, 'near': 25, 'away': 25,
    'outside': 25, 'around': 25, 'all around': 25, 'everywhere': 25,
    'across': 25, 'along': 25, 'underground': 25, 'out': 25,

    # 人称代词与物主代词篇 (26)
    'I': 26, 'my': 26, 'you': 26, 'your': 26, 'he': 26, 'she': 26,
    'it': 26, 'we': 26, 'they': 26, 'me': 26, 'him': 26, 'her': 26,
    'his': 26, 'our': 26, 'their': 26, 'them': 26,

    # 疑问词篇 (27)
    'what': 27, 'who': 27, 'which': 27, 'where': 27, 'when': 27,
    'why': 27, 'how': 27, 'what about...': 27,

    # 介词篇 (28)
    'to': 28, 'for': 28, 'from': 28, 'with': 28, 'about': 28,
    'by': 28, 'of': 28, 'past': 28, 'after': 28,

    # 连词篇 (29)
    'and': 29, 'or': 29, 'but': 29, 'so': 29, 'because': 29,
    'because of sb or sth': 29, 'not': 29, 'also': 29,

    # 运动篇 (31)
    'sport': 31, 'football': 31, 'basketball': 31, 'volleyball': 31,
    'ping-pong': 31, 'skate': 31, 'ski': 31, 'ball': 31, 'rope': 31,

    # 乐器篇 (32)
    'piano': 32, 'music': 32,

    # 科学类 (33)
    'computer': 33, 'robot': 33, 'equator': 33,

    # 自然篇 (34)
    'sun': 34, 'sky': 34, 'rainbow': 34, 'sea': 34, 'tree': 34,
    'flower': 34, 'grass': 34, 'bamboo': 34, 'seed': 34, 'earth': 34,
    'root': 34, 'stem': 34, 'leaf': 34, 'sunflower': 34, 'stone': 34,
    'rock': 34, 'sunshine': 34, 'ice': 34,

    # 日常用语篇 (35)
    'hello': 35, 'hi': 35, 'goodbye': 35, 'bye': 35, 'good': 35,
    'nice': 35, 'Ms': 35, 'Mr': 35, 'please': 35, 'thank': 35,
    'welcome': 35, 'OK': 35, 'great': 35, 'yes': 35, 'no': 35,
    'oh': 35, 'hey': 35, 'sorry': 35, 'hooray': 35, 'sure': 35,
    'Good job!': 35, 'phew': 35, 'urgh': 35, 'here you are': 35,
    "let's = let us": 35,

    # 校园场景补充 (36)
    'friend': 36, 'everyone': 36, 'everybody': 36, 'together': 36,
    'song': 36, 'dear': 36, 'story': 36, 'picture': 36, 'photo': 36,
    'game': 36, 'puzzle': 36, 'kite': 36, 'toy': 36, 'balloon': 36,
    'model': 36, 'gift': 36, 'party': 36,

    # 家庭生活补充 (37)
    'door': 37, 'chair': 37, 'table': 37, 'bed': 37, 'wall': 37,
    'floor': 37, 'box': 37, 'umbrella': 37, 'cooking': 37, 'TV': 37,
    'rubbish': 37, 'chore': 37, 'to-do list': 37, 'dish': 37,
    'light': 37,

    # 健康与身体 (38)
    'well': 38, 'ill': 38, 'cough': 38, 'better': 38,

    # 休闲与爱好 (39)
    'hobby': 39, 'free': 39, 'fun': 39, 'interesting': 39,
    'trip': 39, 'picnic': 39, 'fair': 39, 'festival': 39,
    'drama': 39, 'opera': 39, 'magic': 39, 'talent': 39,

    # 情感与态度补充 (40)
    'love': 40, 'like': 40, 'hope': 40, 'wish': 40, 'worry': 40,
    'dream': 40, 'enjoy': 40, 'kind': 40, 'clever': 40, 'lucky': 40,
    'brave': 40, 'careful': 40, 'be careful': 40, 'hard': 40,
    'never': 40, 'remember': 40, 'try your best': 40, 'favourite': 40,

    # 人称代词与物主代词篇 (26) - also determiners/demonstratives
    'this': 26, 'that': 26, 'these': 26, 'the': 26, 'a (an)': 26,
    'some': 26, 'any': 26, 'every': 26, 'all': 26,

    # 介词篇 (28) - additional
    "on one's own": 28, 'own': 28,

    # 连词篇 (29) - additional
    'still': 29, 'just': 29, 'too': 29, 'then': 29,

    # 日常用语篇 (35) - additional
    'name': 35, 'be (am, is, are)': 35,

    # 校园场景补充 (36) - additional school/social items
    'thing': 36, 'word': 36, 'question': 36, 'idea': 36,
    'something': 36, 'lost and found': 36, 'Chinese knot': 36,
    'report': 36, 'diary': 36, 'culture': 36,

    # 家庭生活补充 (37) - additional household items
    'sound': 37, 'night owl': 37,

    # 健康与身体 (38) - additional
    'warm': 38,

    # 休闲与爱好 (39) - additional
    'tai chi': 39, 'world': 39,

    # 动词篇 (22) - additional
    'work': 22, 'busy': 22,

    # 基础认知类 (1) - additional adverbs/adjectives
    'many': 1, 'much': 1, 'very': 1, 'very much': 1,
    'lot': 1, 'a lot': 1, 'ready': 1, 'often': 1,
    'again': 1, 'sometimes': 1, 'helpful': 1,

    # 数字篇 (12) - additional
    'part': 12,

    # 运动篇 (31) - additional
    'team': 31,

    # 科学类 (33) - additional
    'cancer': 33, 'ability': 33,

    # 地点篇 (20) - additional
    'step': 20, 'way': 20, 'country': 20,

    # 家庭生活补充 (37) - additional
    'money': 37, 'life': 37,

    # 自然篇 (34) - additional
    'snowman': 34, 'horn': 34, 'dot': 34, 'stick': 34, 'star': 34,

    # 学校用品篇 (21) - additional
    'paper': 21,

    # 动词篇 (22) - more
    'job': 22,
}

# Fallback: words not in EXPLICIT_MAP get classified by Chinese meaning keywords
CHINESE_KEYWORD_MAP = [
    (1, ['大的', '小的', '高的', '矮的', '长的', '短的', '宽', '窄', '厚', '薄',
         '多', '少', '快', '慢', '远', '近', '正确', '错误']),
    (2, ['爸', '妈', '哥', '弟', '姐', '妹', '祖', '外祖', '家人', '家庭']),
    (3, ['医生', '护士', '老师', '学生', '警察', '消防', '司机', '农民', '厨师',
         '科学家', '作家', '画家', '工人', '邮递', '裁缝']),
    (5, ['衣', '裤', '裙', '鞋', '帽', '围巾', '外套', '衬衫', '制服']),
    (6, ['食物', '肉', '鸡', '鱼', '饭', '面', '蛋', '饺', '餐', '茶']),
    (10, ['动物', '猫', '狗', '鸟', '猴', '虎', '狮', '象', '熊', '猪', '牛',
          '蜂', '鲸', '斑马', '鸵鸟', '昆虫']),
    (11, ['色', '红', '蓝', '黄', '绿', '紫', '粉', '黑', '白', '棕']),
    (14, ['时间', '天', '周', '月', '年', '早', '午', '晚', '钟', '分钟']),
    (17, ['天气', '晴', '阴', '雨', '雪', '风', '冷', '热']),
    (20, ['家', '房', '厅', '室', '学校', '公园', '医院', '图书', '超市',
          '城市', '街', '路']),
    (22, ['来', '去', '走', '跑', '跳', '坐', '站', '打开', '关', '读', '写',
          '听', '说', '看', '找', '做', '画', '唱', '游泳', '飞']),
    (25, ['在……里', '在……上', '在……下', '左', '右', '前', '后', '旁']),
    (34, ['太阳', '月', '星', '天空', '云', '彩虹', '海', '树', '花', '草',
          '石头', '冰', '种子', '根', '茎', '叶']),
    (35, ['你好', '再见', '谢', '请', '对不起', '欢迎']),
]


def classify_word(english: str, chinese: str) -> int:
    if english in EXPLICIT_MAP:
        return EXPLICIT_MAP[english]

    # Try Chinese keyword matching
    for cat_id, keywords in CHINESE_KEYWORD_MAP:
        for kw in keywords:
            if kw in chinese:
                return cat_id

    # Default: put unclassified words in 基础认知类 (1) as catch-all
    return 1


# ---------------------------------------------------------------------------
# Step 3: Build output
# ---------------------------------------------------------------------------

def make_word_id(category_id: int, english: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '_', english.lower()).strip('_')
    return f'cat{category_id}_{slug}'


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.normpath(os.path.join(
        script_dir, '..', 'docs', '2024新课标外研社小学3-4年级英语单词集合.md'))
    old_path = os.path.normpath(os.path.join(
        script_dir, '..', 'src', 'data', 'words_template.json'))
    output_path = os.path.normpath(os.path.join(
        script_dir, '..', 'src', 'data', 'words.json'))

    # Load old categories
    with open(old_path, 'r', encoding='utf-8') as f:
        old_data = json.load(f)
    categories = old_data['categories']
    cat_name_map = {c['id']: c['name'] for c in categories}

    # Parse new words
    raw_words = parse_md(md_path)
    print(f'Parsed {len(raw_words)} words from markdown')

    # Classify
    words = []
    word_id_counts = {}
    unclassified = []

    for rw in raw_words:
        cat_id = classify_word(rw['english'], rw['chinese'])
        cat_name = cat_name_map.get(cat_id, '基础认知类')

        word = {
            'id': make_word_id(cat_id, rw['english']),
            'english': rw['english'],
            'phonetic': rw['phonetic'],
            'chinese': rw['chinese'],
            'emoji': '',
            'category': cat_name,
            'categoryId': cat_id,
        }

        base_id = word['id']
        if base_id in word_id_counts:
            word_id_counts[base_id] += 1
            word['id'] = f"{base_id}_{word_id_counts[base_id]}"
        else:
            word_id_counts[base_id] = 1

        words.append(word)

        if rw['english'] not in EXPLICIT_MAP:
            unclassified.append((rw['english'], rw['chinese'], cat_id, cat_name))

    # Only keep categories that have words
    used_cat_ids = set(w['categoryId'] for w in words)
    active_categories = [c for c in categories if c['id'] in used_cat_ids]

    data = {'categories': active_categories, 'words': words}

    # Stats
    print(f'Categories used: {len(active_categories)}/{len(categories)}')
    print(f'Words output:    {len(words)}')

    print('\nCategory distribution:')
    for cat in active_categories:
        count = sum(1 for w in words if w['categoryId'] == cat['id'])
        print(f'  {cat["id"]:2d}. {cat["name"]} ({count} words)')

    if unclassified:
        print(f'\nAuto-classified by Chinese keywords ({len(unclassified)} words):')
        for eng, chn, cid, cname in unclassified[:30]:
            print(f'  {eng} ({chn}) -> {cid}. {cname}')
        if len(unclassified) > 30:
            print(f'  ... and {len(unclassified) - 30} more')

    # Write
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'\nOutput written to: {output_path}')


if __name__ == '__main__':
    main()
