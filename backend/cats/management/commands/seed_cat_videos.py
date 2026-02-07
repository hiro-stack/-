"""
テスト用の猫の動画データを作成するDjango managementコマンド
使用方法: python manage.py seed_cat_videos
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.files.base import ContentFile
from cats.models import Cat, CatVideo
import urllib.request
import os


class Command(BaseCommand):
    help = 'テスト用の猫動画データを作成します'

    def handle(self, *args, **options):
        self.stdout.write('テスト用猫動画データを作成中...')
        
        # サンプル動画URL（パブリックドメインの短い動画）
        sample_video_urls = [
            "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        ]
        
        with transaction.atomic():
            cats = Cat.objects.all()[:3]  # 最初の3匹に動画を追加
            
            if not cats:
                self.stderr.write(self.style.ERROR(
                    '猫のデータが存在しません。先に python manage.py seed_cats を実行してください。'
                ))
                return
            
            for cat_index, cat in enumerate(cats):
                # 既存の動画をチェック
                existing_videos = CatVideo.objects.filter(cat=cat).count()
                
                if existing_videos > 0:
                    self.stdout.write(f'  {cat.name}: 既に{existing_videos}件の動画があります（スキップ）')
                    continue
                
                # 各猫に1つの動画を追加
                video_url = sample_video_urls[cat_index % len(sample_video_urls)]
                
                try:
                    # 動画をダウンロード
                    self.stdout.write(f'  {cat.name}: 動画をダウンロード中...')
                    
                    # URLからファイル名を取得
                    video_filename = f"cat_{cat.id}_video_{cat_index + 1}.mp4"
                    
                    # 動画ファイルをダウンロードして保存
                    request = urllib.request.Request(
                        video_url,
                        headers={'User-Agent': 'Mozilla/5.0'}
                    )
                    response = urllib.request.urlopen(request, timeout=30)
                    video_content = response.read()
                    
                    # CatVideoを作成
                    cat_video = CatVideo(
                        cat=cat,
                        sort_order=1,
                        caption=f"{cat.name}の紹介動画"
                    )
                    cat_video.video.save(
                        video_filename,
                        ContentFile(video_content),
                        save=True
                    )
                    
                    self.stdout.write(self.style.SUCCESS(
                        f'  {cat.name}: 動画を追加しました'
                    ))
                    
                except Exception as e:
                    self.stderr.write(self.style.WARNING(
                        f'  {cat.name}: 動画のダウンロードに失敗しました（{str(e)}）'
                    ))
                    continue
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('完了！'))
            self.stdout.write('')
            self.stdout.write('猫の詳細ページで動画が表示されるようになりました。')
