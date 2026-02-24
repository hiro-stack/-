from cats.models import Cat, CatImage, CatVideo
from shelters.models import Shelter
from django.core.files.storage import default_storage

print("--- Data Summary ---")
print(f"Total Cats: {Cat.objects.count()}")
print(f"Total Shelters: {Shelter.objects.count()}")
print(f"Total CatImages: {CatImage.objects.count()}")
print(f"Total CatVideos: {CatVideo.objects.count()}")

print("\n--- Checking for Corrupted Data ---")

deleted_items = []

# 1. Cats with no shelter
orphaned_cats = Cat.objects.filter(shelter__isnull=True)
for cat in orphaned_cats:
    msg = f"Found Orphaned Cat (ID: {cat.id}, Name: {cat.name}) - No shelter assigned."
    print(msg)
    # Depending on the rule, we might delete them
    # cat.delete()
    # deleted_items.append(msg)

# 2. Images with missing files
for img in CatImage.objects.all():
    name = img.image.name if img.image else None
    if not name or not default_storage.exists(name):
        msg = f"Deleted Corrupted CatImage (ID: {img.id}, Cat: {img.cat.name if img.cat else 'Unknown'}) - File missing: {name}"
        print(msg)
        img.delete()
        deleted_items.append(msg)

# 3. Videos with missing files
for vid in CatVideo.objects.all():
    name = vid.video.name if vid.video else None
    if not name or not default_storage.exists(name):
        msg = f"Deleted Corrupted CatVideo (ID: {vid.id}, Cat: {vid.cat.name if vid.cat else 'Unknown'}) - File missing: {name}"
        print(msg)
        vid.delete()
        deleted_items.append(msg)

print("\n" + "="*50)
print(f"Cleanup Complete. Total items deleted: {len(deleted_items)}")
for item in deleted_items:
    print(f"- {item}")
print("="*50)
