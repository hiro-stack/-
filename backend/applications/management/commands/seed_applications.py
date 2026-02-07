"""
テスト用の里親申請データを作成するDjango managementコマンド
使用方法: python manage.py seed_applications
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from accounts.models import User
from cats.models import Cat
from applications.models import Application
import random
from faker import Faker

fake = Faker('ja_JP')

class Command(BaseCommand):
    help = 'テスト用の里親申請データを作成します'

    def handle(self, *args, **options):
        self.stdout.write('テスト用データを作成中...')
        
        with transaction.atomic():
            # 1. 応募者ユーザー（Adopter）を作成
            adopters = []
            for i in range(5):
                username = f'adopter_test_{i+1}'
                email = f'adopter{i+1}@example.com'
                
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'email': email,
                        'user_type': 'adopter',
                        'first_name': fake.first_name(),
                        'last_name': fake.last_name(),
                        'phone_number': fake.phone_number(),
                        'address': fake.address(),
                    }
                )
                if created:
                    user.set_password('adopterpass123')
                    user.save()
                    self.stdout.write(f'  ユーザー作成: {username}')
                adopters.append(user)

            # 2. 募集中の猫を取得
            cats = Cat.objects.filter(status='open')
            if not cats.exists():
                self.stderr.write(self.style.ERROR('募集中の猫がいません。先に python manage.py seed_cats を実行してください。'))
                return

            # 3. 申請を作成
            application_count = 0
            for adopter in adopters:
                # 各ユーザーが1〜3件応募する
                num_applications = random.randint(1, 3)
                target_cats = random.sample(list(cats), min(len(cats), num_applications))
                
                for cat in target_cats:
                    # 既に同じユーザーが同じ猫に応募していないかチェック
                    if Application.objects.filter(applicant=adopter, cat=cat).exists():
                        continue
                        
                    status_choices = ['pending', 'pending', 'pending', 'reviewing', 'rejected']
                    status = random.choice(status_choices)
                    
                    Application.objects.create(
                        applicant=adopter,
                        cat=cat,
                        status=status,
                        motivation=fake.text(max_nb_chars=200),
                        applied_at=timezone.now() - timezone.timedelta(days=random.randint(0, 10)),
                        # 必須フィールドを追加
                        full_name=f"{fake.last_name()} {fake.first_name()}",
                        age=random.randint(20, 60),
                        occupation=fake.job(),
                        phone_number=fake.phone_number(),
                        address=fake.address(),
                        housing_type=random.choice(['apartment', 'house']),
                        family_members=random.randint(1, 5)
                    )
                    application_count += 1
            
            self.stdout.write(self.style.SUCCESS(f'完了！ {application_count}件の申請を作成しました。'))
