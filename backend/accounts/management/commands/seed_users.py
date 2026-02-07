"""
テスト用ユーザーを作成するDjango managementコマンド
使用方法: python manage.py seed_users
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from shelters.models import Shelter, ShelterUser

User = get_user_model()


class Command(BaseCommand):
    help = 'テスト用ユーザーを作成します'

    def handle(self, *args, **options):
        self.stdout.write('テスト用ユーザーを作成中...')
        
        with transaction.atomic():
            # 一般ユーザー（飼い主希望者）を作成
            test_users = [
                {
                    'username': 'testuser',
                    'email': 'testuser@example.com',
                    'password': 'testpass123',
                    'user_type': 'adopter',
                    'phone_number': '090-1234-5678',
                    'address': '東京都渋谷区代々木1-1-1',
                    'bio': '猫が大好きです。一人暮らしで、在宅勤務が多いので猫と過ごす時間がたくさんあります。',
                },
                {
                    'username': 'hanako',
                    'email': 'hanako@example.com',
                    'password': 'testpass123',
                    'user_type': 'adopter',
                    'phone_number': '080-9876-5432',
                    'address': '神奈川県横浜市中区1-2-3',
                    'bio': '家族で猫を飼いたいと思っています。',
                },
            ]
            
            for user_data in test_users:
                password = user_data.pop('password')
                user, created = User.objects.get_or_create(
                    username=user_data['username'],
                    defaults=user_data
                )
                if created:
                    user.set_password(password)
                    user.save()
                    self.stdout.write(self.style.SUCCESS(
                        f'  一般ユーザー「{user.username}」を作成しました'
                    ))
                else:
                    self.stdout.write(f'  一般ユーザー「{user.username}」は既に存在します')
            
            # 保護団体スタッフを作成
            shelter = Shelter.objects.first()
            if not shelter:
                self.stderr.write(self.style.ERROR(
                    '保護団体が存在しません。先に python manage.py seed_cats を実行してください。'
                ))
                return
            
            shelter_staff_data = [
                {
                    'username': 'shelter_staff',
                    'email': 'staff@nekohouse.example.com',
                    'password': 'staffpass123',
                    'user_type': 'shelter',
                    'phone_number': '03-1234-5678',
                    'bio': 'ねこハウス東京のスタッフです。',
                },
                {
                    'username': 'shelter_admin',
                    'email': 'admin@nekohouse.example.com',
                    'password': 'adminpass123',
                    'user_type': 'shelter',
                    'phone_number': '03-1234-5679',
                    'bio': 'ねこハウス東京の管理者です。',
                },
            ]
            
            for staff_data in shelter_staff_data:
                password = staff_data.pop('password')
                user, created = User.objects.get_or_create(
                    username=staff_data['username'],
                    defaults=staff_data
                )
                if created:
                    user.set_password(password)
                    user.save()
                    self.stdout.write(self.style.SUCCESS(
                        f'  団体スタッフ「{user.username}」を作成しました'
                    ))
                    
                    # ShelterUserを作成
                    role = 'admin' if 'admin' in user.username else 'staff'
                    ShelterUser.objects.get_or_create(
                        shelter=shelter,
                        user=user,
                        defaults={'role': role}
                    )
                    self.stdout.write(f'    → {shelter.name}に{role}として所属')
                else:
                    self.stdout.write(f'  団体スタッフ「{user.username}」は既に存在します')
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('完了！'))
            self.stdout.write('')
            self.stdout.write('=== ログイン情報 ===')
            self.stdout.write('')
            self.stdout.write('【一般ユーザー】')
            self.stdout.write('  ユーザー名: testuser')
            self.stdout.write('  パスワード: testpass123')
            self.stdout.write('')
            self.stdout.write('【団体スタッフ】')
            self.stdout.write('  ユーザー名: shelter_staff')
            self.stdout.write('  パスワード: staffpass123')
            self.stdout.write('')
            self.stdout.write('【団体管理者】')
            self.stdout.write('  ユーザー名: shelter_admin')
            self.stdout.write('  パスワード: adminpass123')
