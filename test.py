from utils import *

file_path = './test.txt'
with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

regex = "第\s*(.*)章"
chapter_chars_limit = 40
chapters = split_chapter(regex, content, chapter_chars_limit)
print(chapters.__len__())

print(chapters[0])