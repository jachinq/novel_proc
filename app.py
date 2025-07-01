import os
from sanic import Sanic
from sanic import file
from sanic.response import json
import base64
import time
import random
from utils import *

app = Sanic("novel-processor")

upload_folder = 'templates/uploads'
app.static('/static', 'templates/static')  # 如果你有静态文件（如 CSS, JS）
app.config.TEMPLATES_AUTO_RELOAD = True  # 自动重新加载模板

@app.route('/')
async def test(request):
    return await file('templates/index.html')

@app.route('/page/<page_name>')
async def page(request, page_name):
    if page_name.endswith('.html'):
        page_name = page_name[:-5]
    return await file(f'templates/{page_name}.html')

@app.route('/resources')
async def resource(request):
    filepath = request.args.get('filepath')
    resource_name = os.path.basename(filepath)
    # print(resource_name, filepath)
    return await file(f'{filepath}')

@app.route('/upload', methods=['POST'])
async def upload(request):
    json_data = request.json
    # print(json_data)
    filename = json_data['filename']
    data = json_data['data']
    # 文件名加上时间戳和一个随机数，防止文件名冲突
    filename = f"{int(time.time())}_{random.randint(1000, 9999)}_{filename}"
    # 保存文件
    with open(f"{upload_folder}/{filename}", 'w', encoding='utf-8') as f:
        f.write(data)
    return json({'filename': filename, 'success': True})

@app.route('/filelist')
async def filelist(request):
    # 列出上传的文件列表
    file_list = os.listdir(upload_folder)
    # 拿到文件的路径
    file_list = []
    for filename in os.listdir(upload_folder):
        if filename == 'cover.jpg':
            continue
        file_list.append({'filename': filename, 'filepath': f"{upload_folder}/{filename}"})
    # print(file_list)
    return json({'file_list': file_list})

# 加载文本
@app.route('/load_text', methods=['POST'])
async def load_text(request):
    json_data = request.json
    file_path = json_data['filepath']
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return json({'success': True, 'content': content})


# 保存文本
@app.route('/save_text', methods=['POST'])
async def save_text(request):
    json_data = request.json
    file_path = json_data['filepath']
    content = json_data['content']
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return json({'success': True, 'content': content})


@app.route('/parse_chapters', methods=['POST'])
async def parse_chapters(request):
    json_data = request.json
    file_path = json_data['filepath']
    regex: str = json_data['regex']
    chapterNameLimit: int = json_data['chapterNameLimit']
    temp_map['_chapterNameLimit'] = chapterNameLimit
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        chapters = split_chapter(regex, content, temp_map['_chapterNameLimit'])
        temp_map[file_path] = chapters
        chapters2 = []
        for chapter, _ in chapters:
            chapters2.append(chapter)
        return json({'chapters': chapters2, 'filepath': file_path})

@app.route('check_enchar', methods=['POST'])
async def check_enchar(request):
    json_data = request.json
    file_path = json_data['filepath']
    exclude_words = json_data['exclude_words']
    if len(exclude_words.strip()) == 0:
        exclude_words = []
    else:
        exclude_words = exclude_words.split(',')
    if exclude_words == None:
        exclude_words = []
    lines = check_english(file_path, exclude_words)
    return json({'lines': lines})

@app.route('replace_enchar', methods=['POST'])
async def replace_enchar(request):
    json_data = request.json
    file_path = json_data['filepath']
    replace_words = json_data['replace_words']
    replace_with_words = json_data['replace_with_words']
    if replace_words == None or replace_words.strip() == '':
        return json({'success': False, 'error': '请填写需要替换的字符'})
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    with open(file_path, 'w', encoding='utf-8') as f:
        content = content.replace(replace_words, replace_with_words)
        print(f'替换结果：{len(content)}')
        f.write(content)
    
    return json({'success': True})

# 处理换行
@app.route('process_newline', methods=['POST'])
async def process_newline(request):
    json_data = request.json
    file_path = json_data['filepath']
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    with open(file_path, 'w', encoding='utf-8') as f:
        lines = content.split('\n')
        results = []
        for line in lines:
            line = line.strip()
            if len(line) == 0:
                continue
            results.append(line)
        content = '\n\n'.join(results)       
        
        print(f'处理换行结果：{len(content)}')
        f.write(content)
    
    return json({'success': True, 'content': content})

@app.route('/read_chapter', methods=['POST'])
async def read_chapter(request):
    json_data = request.json
    file_path = json_data['filepath']
    chapter_index = json_data['chapter_index']
    if file_path not in temp_map:
        return error('请先分章')
    chapters = temp_map[file_path]
    if chapter_index >= len(chapters):
        return error(f'章节索引超出范围，总共{len(chapters)}章')
    chapter, contents = chapters[chapter_index]
    return json({'chapter': chapter, 'contents': contents, 'filename': file_path})

@app.route('/split_book', methods=['POST'])
async def split_book(request):
    json_data = request.json
    file_path = json_data['filepath']
    count = json_data['count'] # 拆分数量
    regex: str = json_data['regex']

    # 拿到文件名
    filename = os.path.basename(file_path)
    split_path = f"templates/split/{filename}"
    if not os.path.exists(split_path):
        os.makedirs(split_path)
    else: # 文件夹已存在，清空文件夹
        for filename in os.listdir(split_path):
            os.remove(os.path.join(split_path, filename))

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        chapters = split_chapter(regex, content, temp_map['_chapterNameLimit'])
        split_files = []
        for filename, sub_chapters in split_book_by_chapters_count(chapters, count): # 拆分并保存文件
            filepath = f"{split_path}/{filename}"
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(combine_chapter_and_contents(sub_chapters))
            split_files.append(filepath)

    return json({'success': True, 'results': split_files})

@app.route('list_split_files')
async def list_split_files(request):
    
    split_dir = 'templates/split'
    
    split_files = []
    for title in os.listdir(split_dir):
        split_book_dir = f"{split_dir}/{title}"
        for filename in os.listdir(split_book_dir):
            split_files.append({
                'filename': f"{title}/{filename}",
                'filepath': f"/resources?filepath={split_book_dir}/{filename}"
            })
    return json({'split_files': split_files})

@app.route('/covert_book', methods=['POST'])
async def covert_book(request):
    json_data = request.json
    file_path = json_data['filepath']
    count = json_data['count'] # 拆分数量
    regex: str = json_data['regex']
    title = json_data['title']
    author = json_data['author']
    cover = json_data['cover'] # base64编码的图片数据
    split = count > 0 # 是否拆分
    if title == None or title.strip() == '':
        title = "unknown"
    if author == None or author.strip() == '':
        author = "unknown"
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        return error('文件不存在')

    filename = os.path.basename(file_path)
    
    # 将base64编码的图片数据保存到本地
    if cover != None and cover.strip() != '' and not cover.startswith('http'):
        # cover 是有图片前缀的，需要去掉
        cover = cover.split(',')[1]
        # 保存图片到本地
        with open(f"{upload_folder}/cover.jpg", 'wb') as f:
            f.write(base64.b64decode(cover))

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    chapters = split_chapter(regex, content, temp_map['_chapterNameLimit'])
    epub_dir = get_epub_book_dir(filename)
    # 清空文件夹
    for tmpfilename in os.listdir(epub_dir):
        os.remove(os.path.join(epub_dir, tmpfilename))    
    
    if split: # 拿到章节后，按指定数量拆分
        for indexfilename, sub_chapters in split_book_by_chapters_count(chapters, count):
            file_prefix = os.path.splitext(indexfilename)[0] # 拿到文件名的前缀
            convert_txt_to_epub(sub_chapters, file_prefix, title, author, filename)
        
    else: # 不拆，直接转换整本书
        convert_txt_to_epub(chapters, None, title, author, filename)
    
    

    return json({'success': True})

@app.route('/list_epub_files')
async def list_epub_files(request):
    
    epub_dir = get_epub_book_dir()
    
    epub_files = []
    # 读取路径下的文件
    epub_files = []
    for title in os.listdir(epub_dir):
        epub_book_dir = get_epub_book_dir(title)
        for filename in os.listdir(epub_book_dir):
            epub_files.append({
                'filename': f"{filename}",
                'filepath': f"/resources?filepath={epub_book_dir}/{filename}"
            })
    return json({'epub_files': epub_files})

@app.route('/check_delete', methods=['POST'])
async def check_delete(request):
    json_data = request.json
    file_path = json_data['filepath']
    if not os.path.exists(file_path):
        return error('文件不存在')

    splits, epubs = get_spit_epub_files(file_path)
    return success(data={'splits': splits, 'epubs': epubs})

@app.route('/delete_book', methods=['POST'])
async def delete_book(request):
    json_data = request.json
    file_path = json_data['filepath']
    if not os.path.exists(file_path):
        return error('文件不存在')

    rows = delete_split_epub_files(file_path)
    return success(f"成功删除{rows}个文件")

temp_map = {}
temp_map['_chapterNameLimit'] = 40

if __name__ == '__main__':
    # 从环境变量中获取端口号
    port = os.getenv('PORT', '8000')
    app.run(host='0.0.0.0', port=int(port), debug=True)