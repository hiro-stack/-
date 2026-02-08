import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

try:
    User = get_user_model()
    if not User.objects.filter(username='admin').exists():
        print("Creating superuser 'admin'...")
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Superuser created successfully.")
    else:
        print("Superuser 'admin' already exists.")
except Exception as e:
    print(f"Error creating superuser: {e}")
