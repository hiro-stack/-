"""
猫のテストデータに画像を追加するDjango managementコマンド
使用方法: python manage.py seed_cat_images
"""
import os
import urllib.request
import ssl
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction
from cats.models import Cat, CatImage


class Command(BaseCommand):
    help = '猫のテストデータに画像を追加します'

    # Unsplashなどから取得した猫の画像URL（無料・著作権フリー）
    CAT_IMAGE_URLS = [
        # 茶トラ猫
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
        # 黒猫
        'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?w=800',
        # キジトラ猫
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800',
        # 白猫
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800',
        # 子猫
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800',
        # グレー猫
        'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800',
        # 三毛猫風
        'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800',
        # サバトラ
        'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=800',
        # 追加画像
        'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800',
        'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800',
        'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=800',
        'https://images.unsplash.com/photo-1583795128727-6ec3642408f8?w=800',
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='既存の画像があっても追加する',
        )

    def download_image(self, url, timeout=30):
        """URLから画像をダウンロード"""
        try:
            # SSL証明書の検証を無視（開発用）
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=timeout, context=context) as response:
                return ContentFile(response.read())
        except Exception as e:
            self.stderr.write(f'  画像ダウンロードエラー: {e}')
            return None

    def handle(self, *args, **options):
        self.stdout.write('猫の画像データを追加中...')
        
        cats = Cat.objects.all()
        
        if not cats.exists():
            self.stderr.write(self.style.ERROR(
                '猫が登録されていません。先に python manage.py seed_cats を実行してください。'
            ))
            return
        
        force = options.get('force', False)
        image_index = 0
        added_count = 0
        
        for cat in cats:
            # 既に画像があるかチェック
            existing_images = cat.images.count()
            if existing_images > 0 and not force:
                self.stdout.write(f'  {cat.name}: 画像が既に{existing_images}枚あります（スキップ）')
                continue
            
            self.stdout.write(f'  {cat.name}に画像を追加中...')
            
            # 各猫に1〜2枚の画像を追加
            num_images = 2 if cat.id % 2 == 0 else 1
            
            for i in range(num_images):
                url = self.CAT_IMAGE_URLS[image_index % len(self.CAT_IMAGE_URLS)]
                image_index += 1
                
                image_content = self.download_image(url)
                if image_content:
                    try:
                        with transaction.atomic():
                            cat_image = CatImage(
                                cat=cat,
                                is_primary=(i == 0),  # 最初の画像をメイン画像に
                                sort_order=i,
                                caption=f'{cat.name}の写真{i + 1}' if i > 0 else f'{cat.name}のメイン写真'
                            )
                            # 画像ファイルを保存
                            filename = f'{cat.name}_{i + 1}.jpg'
                            cat_image.image.save(filename, image_content, save=True)
                            added_count += 1
                            self.stdout.write(self.style.SUCCESS(
                                f'    画像追加: {filename} (メイン: {cat_image.is_primary})'
                            ))
                    except Exception as e:
                        self.stderr.write(f'    画像保存エラー: {e}')
                else:
                    self.stderr.write(f'    画像のダウンロードに失敗しました')
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'完了！{added_count}枚の画像を追加しました。'))
        
        # 画像付き猫の一覧を表示
        self.stdout.write('')
        self.stdout.write('=== 猫と画像の一覧 ===')
        for cat in Cat.objects.all():
            image_count = cat.images.count()
            primary = cat.images.filter(is_primary=True).first()
            primary_url = primary.image.url if primary else 'なし'
            self.stdout.write(f'  {cat.name}: {image_count}枚 (メイン: {primary_url})')
