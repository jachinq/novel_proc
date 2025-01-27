import os
import re
import random
from ebooklib import epub
from sanic.response import json
from sanic.response import JSONResponse

def error(message: str, data: dict = {}):
    return json({"success": False, "message": message, 'data': data})
def success(message='操作成功', data: dict = {}):
    return json({"success": True, "message": message, 'data': data})

def split_chapter(regex, data: str, chapterNameLimit: int = 40):
    # 正则匹配章节标题
    chapter_pattern = re.compile(regex)
    # 查找所有匹配的章节名
    # chapters = chapter_pattern.findall(data)    
    
    print(chapter_pattern, len(data))
    
    chapters = []
    contents = []
    for line in data.split('\n'):
        # 去除前后空格
        line = line.strip()
        
        length = len(line)
        isOverLimit = length > chapterNameLimit
        
        match = chapter_pattern.match(line)
        if match and line.startswith('第') and not isOverLimit:
            chapters.append((line, contents))
            contents = []
        else:
            contents.append(line)
    
    if len(chapters) == 0:
        chapters.append(('Unkown', contents))
    
    return chapters # [(chapter_name, contents), (chapter_name, contents), ...]

def print_chapters(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        chapters = split_chapter(r'第\s*(.*)章', content)
        length = len(chapters)
        print(f"共{length}章")
        # 计算出章节位数
        max_length = len(str(length))
        for i, (chapter, contents) in enumerate(chapters, start=1):
            # i 格式 001, 002, 003, ...
            print(f"{i:0{max_length}d}: {chapter} ({len(contents)}行)")

# 统计汉字个数
def count_words(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        # 统计汉字个数
        words = re.findall(r'[\u4e00-\u9fa5]+', content)
        # 格式化为 000,000,000 形式
        words_count = len(words)
        print(f"共 {words_count:,} 个汉字")
        # print(f"共 {len(words)} 个汉字")
    
# 检查文件中包含的英文字符
def check_english(file_path, exclude_words=[]):
    
    def is_exclude_word(line: str):
        for exclude in exclude_words:
            if line.__contains__(exclude):
                return True
        return False
    
    match_lines = []
    regex = r'[a-zA-Z]+'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        for line in content.split("\n"):
            if is_exclude_word(line):
                continue
            
            match = re.search(regex, line)
            if match:
                match_lines.append(line)
                
    return match_lines

# 按章节数分割文件
def split_book_by_chapters_count(chapters, count):
    # 计算出章节位数
    max_length = len(str(len(chapters)))
    file_list = [] # 根据章节数分割后的文件名
    for i in range(0, len(chapters), count):
        file_list.append(f"{i+1:0{max_length}d}.txt") # 格式 001.txt, 002.txt, 003.txt, ...

    results = []
    for i, filepname in enumerate(file_list):
        # print(f"分割文件 {file}...")
        # with open(file, 'w', encoding='utf-8') as f:
        start = i * count
        end = (i+1) * count
        # 取出当前要处理的sublist
        sub_chapters = []
        for j in range(start, end):
            if j >= len(chapters):
                break
            sub_chapters.append(chapters[j])
        results.append((filepname, sub_chapters))
        
    return results

def combine_chapter_and_contents(chapters):
    file_content = ""
    for chapter, contents in chapters:
        file_content += f"{chapter}\n"
        file_content += "\n".join(contents)
        file_content += "\n\n"
    return file_content

# 按字符数分割文件
def split_book_by_chars_count(split_path, content, count):
    # 计算出章节位数
    max_length = len(str(len(content // count)))
    file_list = [] # 根据章节数分割后的文件名
    for i in range(0, len(content), count):
        file_list.append(f"{split_path}/{i+1:0{max_length}d}.txt")
        
    for i, file in enumerate(file_list):
        print(f"分割文件 {file}...")
        with open(file, 'w', encoding='utf-8') as f:
            start = i * count
            end = (i+1) * count
            sub_content = []
            for j in range(start, end):
                if j >= len(content):
                    break
                sub_content.append(content[j])
            for line in sub_content:
                f.write(line)
                f.write("\n")

def get_epub_book_dir(title=''):
    epub_path = f"templates/epub/{title}"
    if not os.path.exists(epub_path):
        os.makedirs(epub_path)

    return epub_path

def convert_txt_to_epub(split_chapters: list, index, title, author, filename):
    title = f"{title}_{index}"
    epub_path = f"{get_epub_book_dir(filename)}/{title}.epub"

    # 计算出章节数
    chapter_count = len(split_chapters)
    # 计算出章节位数
    max_length = len(str(chapter_count))
    
    cover_path = 'templates/uploads/cover.jpg'

    # 创建EpubBook对象
    book = epub.EpubBook()
    book.set_title(title)
    book.add_author(author)
    book.set_language('zh-CN')
    book.set_cover('cover.jpg', open(cover_path, 'rb').read())

    # cover_html = f'<html><head><title>Cover</title></head><body><div><img src="images/cover.jpg" alt="书籍封面"/></div></body></html>'
    # cover = epub.EpubHtml(title='封面', file_name='cover.xhtml', lang='zh-CN', content=cover_html)
    # book.add_item(cover)
    # book.toc.append(epub.Link('cover.xhtml', '封面', 'cover'))
    
    
    # 创建目录文件
    book.add_item(epub.EpubNav())

    # 创建目录和章节内容
    chapters = []
    for i, (chapter, contents) in enumerate(split_chapters, start=1):
        # i 格式 001, 002, 003, ...
        chapter_file_name = f"chap{i:0{max_length}d}.xhtml"
        nav_item = epub.Link(href=chapter_file_name, title=chapter, uid=f"chap{i:0{max_length}d}")
        book.toc.append(nav_item)

        # 创建Chapter对象
        chap_content = epub.EpubHtml(title=chapter, file_name=chapter_file_name, lang='zh-CN', content=convert_txt_to_html(chapter, contents))
        book.add_item(chap_content)
        chapters.append(chap_content)
    
    # 添加书签
    book.add_item(epub.EpubNcx())    

    # 添加 spine
    book.spine = ['cover', 'nav'] + chapters
    # book.guide = [
    #     {'href': 'cover.xhtml', 'title': 'Cover', 'type': 'cover'},
    #     {'href': 'nav.xhtml', 'title': '目录', 'type': 'toc'}
    # ]
    
    # 保存EPUB
    epub.write_epub(epub_path, book)
    # print(f"保存文件 {output_path} 成功")
    
def convert_txt_to_html(chapter: str, lines: list):
    html_content = '<html><head><meta charset="utf-8"></head><body>'
    html_content += f"<h2>{chapter}</h2>"
    for line in lines:
        if line.strip() == '':
            continue
        html_content += f"<p>{line}</p>"
    html_content += '</body></html>'
    return html_content

def get_spit_epub_files(file_path):
    if not os.path.exists(file_path):
        return ([],[])

    filename = os.path.basename(file_path)
    # 拿 split 文件夹下的文件名
    split_dir = f'templates/split/{filename}'
    split_files = []
    if os.path.exists(split_dir):
        for filename in os.listdir(split_dir):
            split_files.append(f"{split_dir}/{filename}")
    # 拿 epub 文件夹下的文件名
    epub_dir = get_epub_book_dir(filename)
    epub_files = []
    if os.path.exists(epub_dir):
        for filename in os.listdir(epub_dir):
            epub_files.append(f"{epub_dir}/{filename}")
    return (split_files, epub_files)

def delete_split_epub_files(file_path):
    splits, epubs = get_spit_epub_files(file_path)
    all_files = splits + epubs
    filename = os.path.basename(file_path)
    split_dir = f'templates/split/{filename}'
    epub_dir = get_epub_book_dir(filename)
    # 删除
    for filepath in all_files:
        os.remove(filepath)
    # 删除 split 文件夹
    if os.path.exists(split_dir):
        os.rmdir(split_dir)
    # 删除 epub 文件夹
    if os.path.exists(epub_dir):
        os.rmdir(epub_dir)
    os.remove(file_path)
    return len(all_files) + 1
    
if __name__ == '__main__':
    file_path = r'D:\\CODE\\Rust\\novel\\tmp.txt'
    # file_path = r'tmp.txt'
    print_chapters(file_path)
    # count_words(file_path)
    # check_english(file_path, ["BOSS", "FAN", "POSE", "S级", "VS", " - ", "YY", "PK"])
