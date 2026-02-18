from shelters.models import Shelter
from cats.models import Cat

print("Starting data update...")
s_count = Shelter.objects.all().count()
Shelter.objects.update(public_profile_enabled=True, verification_status='approved')
print(f"Updated {s_count} shelters.")

c_count = Cat.objects.all().count()
Cat.objects.update(is_public=True, status='open')
print(f"Updated {c_count} cats.")
print("Done!")
