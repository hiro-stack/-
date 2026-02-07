"""
猫のテストデータを作成するDjango managementコマンド
使用方法: python manage.py seed_cats
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from cats.models import Cat, CatImage
from shelters.models import Shelter


class Command(BaseCommand):
    help = '猫のテストデータを作成します'

    def handle(self, *args, **options):
        self.stdout.write('猫のテストデータを作成中...')
        
        with transaction.atomic():
            # まず保護団体を作成または取得
            shelter, created = Shelter.objects.get_or_create(
                name='ねこハウス東京',
                defaults={
                    'representative': '山田太郎',
                    'address': '東京都渋谷区代々木1-2-3',
                    'phone': '03-1234-5678',
                    'email': 'info@nekohouse.example.com',
                    'description': '保護猫の里親探しを行っている団体です。毎週土日に譲渡会を開催しています。',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'保護団体「{shelter.name}」を作成しました'))
            else:
                self.stdout.write(f'既存の保護団体「{shelter.name}」を使用します')
            
            # 2つ目の保護団体
            shelter2, created2 = Shelter.objects.get_or_create(
                name='にゃんこシェルター大阪',
                defaults={
                    'representative': '佐藤花子',
                    'address': '大阪府大阪市中央区本町4-5-6',
                    'phone': '06-9876-5432',
                    'email': 'contact@nyanko-shelter.example.com',
                    'website_url': 'https://nyanko-shelter.example.com',
                    'description': '大阪を拠点に保護猫活動を行っています。TNR活動にも力を入れています。',
                }
            )
            if created2:
                self.stdout.write(self.style.SUCCESS(f'保護団体「{shelter2.name}」を作成しました'))
            
            # テスト用の猫データ
            cats_data = [
                {
                    'shelter': shelter,
                    'name': 'ミケ',
                    'gender': 'female',
                    'age_years': 2,
                    'age_months': 6,
                    'breed': '三毛猫',
                    'size': 'medium',
                    'color': '三毛（白・茶・黒）',
                    'personality': 'とても人懐っこく、甘えん坊な性格です。抱っこが大好きで、膝の上でゴロゴロと甘えてきます。他の猫とも仲良くできます。',
                    'health_status': 'ワクチン3種接種済み、避妊手術済み、健康状態良好です。',
                    'vaccination': True,
                    'neutered': True,
                    'description': 'ミケちゃんは2年前に保護された三毛猫です。最初は怖がっていましたが、今ではすっかり人に慣れ、来客があると真っ先に挨拶にきます。毎日のブラッシングが大好きです。',
                    'status': 'open',
                },
                {
                    'shelter': shelter,
                    'name': 'チャトラン',
                    'gender': 'male',
                    'age_years': 1,
                    'age_months': 3,
                    'breed': '茶トラ',
                    'size': 'medium',
                    'color': '茶トラ',
                    'personality': '好奇心旺盛で活発な性格。おもちゃで遊ぶのが大好きです。食いしん坊で、ごはんの時間になるとニャーニャー鳴きます。',
                    'health_status': 'ワクチン接種済み、去勢手術済み。健康で元気いっぱいです。',
                    'vaccination': True,
                    'neutered': True,
                    'description': 'チャトランくんは子猫の時に道端で保護されました。人が大好きで、帰宅するとすぐに玄関まで迎えに来てくれます。',
                    'status': 'open',
                },
                {
                    'shelter': shelter,
                    'name': 'クロ',
                    'gender': 'male',
                    'age_years': 5,
                    'age_months': 0,
                    'breed': '黒猫',
                    'size': 'large',
                    'color': '黒',
                    'personality': '落ち着いた性格で、静かな環境を好みます。一人でまったりするのが好きですが、撫でられるのも嫌いではありません。',
                    'health_status': '慢性腎臓病のため、特別な療法食を食べています。定期的な通院が必要です。',
                    'vaccination': True,
                    'neutered': True,
                    'description': 'クロくんは高齢の飼い主様が施設に入居されたことにより、保護されました。穏やかで落ち着いた子で、シニア猫ならではの魅力があります。',
                    'status': 'open',
                },
                {
                    'shelter': shelter2,
                    'name': 'ムギ',
                    'gender': 'female',
                    'age_years': 0,
                    'age_months': 8,
                    'breed': 'キジトラ',
                    'size': 'small',
                    'color': 'キジトラ',
                    'personality': 'とても元気いっぱいで、走り回るのが大好き！高いところに登るのも得意です。',
                    'health_status': '健康状態良好。ワクチン接種済み、避妊手術済み。',
                    'vaccination': True,
                    'neutered': True,
                    'description': 'ムギちゃんは野良猫の子として保護されました。まだ子猫なので遊び盛りです。',
                    'status': 'open',
                },
                {
                    'shelter': shelter2,
                    'name': 'シロ',
                    'gender': 'male',
                    'age_years': 3,
                    'age_months': 2,
                    'breed': '白猫',
                    'size': 'medium',
                    'color': '白',
                    'personality': '少し臆病ですが、慣れると甘えん坊になります。静かな環境で、ゆっくり信頼関係を築ける方におすすめです。',
                    'health_status': '健康状態良好。ワクチン3種接種済み、去勢手術済み。',
                    'vaccination': True,
                    'neutered': True,
                    'description': 'シロくんは多頭飼育崩壊の現場から保護されました。人見知りがありますが、根気よく接すれば心を開いてくれます。',
                    'status': 'open',
                },
                {
                    'shelter': shelter,
                    'name': 'ソラ',
                    'gender': 'female',
                    'age_years': 1,
                    'age_months': 0,
                    'breed': 'サバトラ',
                    'size': 'medium',
                    'color': 'サバトラ',
                    'personality': '穏やかで優しい性格。他の猫とも仲良くできます。鳴き声が小さく、マンションでも飼いやすいです。',
                    'health_status': 'ワクチン接種済み、避妊手術済み。健康状態良好。',
                    'vaccination': True,
                    'neutered': True,
                    'description': 'ソラちゃんは引っ越しを理由に飼えなくなった方から保護されました。トイレの躾もバッチリで、とても飼いやすい子です。',
                    'status': 'trial',
                },
                {
                    'shelter': shelter2,
                    'name': 'レオ',
                    'gender': 'male',
                    'age_years': 4,
                    'age_months': 6,
                    'breed': 'アメリカンショートヘア',
                    'size': 'large',
                    'color': 'シルバータビー',
                    'personality': '堂々とした性格のイケメン猫。自分のペースを大切にしますが、一緒にいる時間も大事にします。',
                    'health_status': '健康状態良好。ワクチン接種済み、去勢手術済み。',
                    'vaccination': True,
                    'neutered': True,
                    'description': 'レオくんは飼い主様のご事情でやむなく手放されることになりました。落ち着いた大人猫なので、初めて猫を飼う方にもおすすめです。',
                    'status': 'in_review',
                },
                {
                    'shelter': shelter,
                    'name': 'モモ',
                    'gender': 'female',
                    'age_years': 0,
                    'age_months': 5,
                    'breed': 'スコティッシュフォールド（ミックス）',
                    'size': 'small',
                    'color': 'クリーム',
                    'personality': '天真爛漫で無邪気な子猫。何にでも興味津々で、毎日が冒険です！',
                    'health_status': 'ワクチン1回目接種済み。避妊手術は適齢期に実施予定。',
                    'vaccination': True,
                    'neutered': False,
                    'description': 'モモちゃんはブリーダー廃業に伴い保護されました。耳が少し折れている特徴的なかわいい子です。',
                    'status': 'open',
                },
            ]
            
            created_count = 0
            for cat_data in cats_data:
                # 既存の同名・同シェルターの猫がいるかチェック
                existing_cat = Cat.objects.filter(
                    name=cat_data['name'],
                    shelter=cat_data['shelter']
                ).first()
                
                if existing_cat:
                    self.stdout.write(f'  猫「{cat_data["name"]}」は既に存在します（スキップ）')
                else:
                    cat = Cat.objects.create(**cat_data)
                    self.stdout.write(self.style.SUCCESS(f'  猫「{cat.name}」を作成しました (ID: {cat.id})'))
                    created_count += 1
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS(f'完了！{created_count}匹の猫を作成しました。'))
            
            # 作成された猫の一覧を表示
            self.stdout.write('')
            self.stdout.write('=== 登録されている猫の一覧 ===')
            for cat in Cat.objects.all().select_related('shelter'):
                age_str = f'{cat.age_years}歳{cat.age_months}ヶ月' if cat.age_months else f'{cat.age_years}歳'
                self.stdout.write(
                    f'  ID:{cat.id:3} | {cat.name:10} | {cat.get_gender_display():4} | '
                    f'{age_str:10} | {cat.breed:20} | {cat.get_status_display():10} | '
                    f'{cat.shelter.name}'
                )
