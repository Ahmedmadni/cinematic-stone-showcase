#!/usr/bin/env python3
"""Prepare truthful web derivatives from the supplied Al Somman photo folder.

Requires Pillow. Only resizing/encoding is applied; documentary color treatment
is non-destructive CSS. Geometry, equipment and original documents stay intact.
Run: python scripts/prepare-official-media.py --source-dir /path/somman-photos
"""
import argparse
import hashlib
import json
import io
import os
import shutil
from collections import Counter
from pathlib import Path
from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', type=Path, required=True)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]
root = args.source_dir
source = root / 'webp للموقع'
output = repo / 'src/assets/official'
photos = sorted(source.rglob('*.webp'))
assert len(photos) == 77, f'Expected 77 source photos, got {len(photos)}'

curated = {
 'DJI_0146.webp': 'hero/hero-crusher-aerial-01.webp',
 'تكامل النفق والجدار الاستنادي مع خط الانتاج 2.webp': 'hero/hero-tunnel-integration-01.webp',
 'موقع المحجر.webp': 'hero/hero-quarry-site-01.webp',
 'DJI_0168.webp': 'hero/hero-equipment-lineup-01.webp',
 'DJI_0191.webp': 'production/production-primary-crusher-01.webp',
 'DJI_0111.webp': 'production/production-conveyor-01.webp',
 'المكاتب.webp': 'facilities/facility-office-01.webp',
 'الورشة.webp': 'facilities/facility-workshop-01.webp',
 'الموازين.webp': 'facilities/facility-weighbridge-01.webp',
 'سكن العمال.webp': 'facilities/facility-housing-01.webp',
 'DJI_0169.webp': 'equipment/equipment-loader-01.webp',
 'DJI_0166.webp': 'equipment/equipment-fleet-lineup-01.webp',
}
labels = {
 'المصلى والاستراحة.webp': ('facilities', 'Prayer room and rest area', 'المصلى والاستراحة'),
 'المكاتب.webp': ('facilities', 'Site administration offices', 'مكاتب الإدارة بالموقع'),
 'الموازين.webp': ('facilities', 'Truck weighbridge and access lanes', 'ميزان الشاحنات ومسارات الدخول'),
 'الورشة.webp': ('facilities', 'Maintenance workshop and yard', 'ورشة الصيانة والساحة'),
 'تكامل النفق والجدار الاستنادي مع خط الانتاج 2.webp': ('production', 'Tunnel and retaining wall with the crushing line', 'النفق والجدار الاستنادي وخط التكسير'),
 'تكامل النفق والجدار الاستنادي مع خط الانتاج.webp': ('production', 'Crushing line and integrated feed infrastructure', 'خط التكسير وبنية التغذية المتكاملة'),
 'خزانات المياه.webp': ('facilities', 'Site water tanks', 'خزانات المياه بالموقع'),
 'خزانات الوقود.webp': ('facilities', 'Site fuel tanks', 'خزانات الوقود بالموقع'),
 'سكن اخر.webp': ('facilities', 'Additional staff accommodation', 'سكن إضافي للعاملين'),
 'سكن العمال.webp': ('facilities', 'Staff housing and service area', 'سكن العمال ومنطقة الخدمات'),
 'سيور متنقلة.webp': ('equipment', 'Mobile conveyors in the equipment yard', 'سيور متنقلة في ساحة المعدات'),
 'صورة للمحجر.webp': ('quarry', 'Quarry excavation benches', 'مصاطب الاستخراج بالمحجر'),
 'كسارات متنقلة.webp': ('equipment', 'Mobile crushing equipment', 'معدات التكسير المتنقلة'),
 'مدخل 2.webp': ('facilities', 'Main site entrance and access road', 'مدخل الموقع وطريق الدخول'),
 'مدخل الكسارة.webp': ('facilities', 'Crusher site entrance', 'مدخل موقع الكسارة'),
 'موقع المحجر.webp': ('quarry', 'Quarry benches and internal haul roads', 'مصاطب المحجر وطرق النقل الداخلية'),
 'DJI_0204.webp': ('facilities', 'Tanks and support infrastructure', 'الخزانات والبنية التشغيلية المساندة'),
 'DJI_0166.webp': ('equipment', 'Aerial view of the heavy-equipment lineup', 'تصوير جوي لاصطفاف المعدات الثقيلة'),
 'DJI_0167.webp': ('equipment', 'Loaders and excavators in the site yard', 'شيولات وحفارات في ساحة الموقع'),
 'DJI_0168.webp': ('equipment', 'Heavy-equipment fleet at Al Somman', 'أسطول المعدات الثقيلة في الصمان'),
 'DJI_0169.webp': ('equipment', 'Loader and excavator parked at the site', 'شيول وحفار داخل الموقع'),
 'DJI_0172.webp': ('equipment', 'Loader and excavator, front view', 'شيول وحفار من الواجهة الأمامية'),
 'DJI_0173.webp': ('equipment', 'Loader and excavator, side view', 'شيول وحفار من الجانب'),
}
wide = {'DJI_0063.webp','DJI_0064.webp','DJI_0065.webp','DJI_0066.webp','DJI_0067.webp','DJI_0146.webp','DJI_0147.webp','DJI_0183.webp'}
feed = {'DJI_0098.webp','DJI_0099.webp','DJI_0100.webp','DJI_0101.webp','DJI_0191.webp','DJI_0192.webp','DJI_0193.webp','DJI_0194.webp'}
conveyor = {'DJI_0105.webp','DJI_0107.webp','DJI_0110.webp','DJI_0111.webp','DJI_0113.webp','DJI_0078.webp','DJI_0079.webp'}
screens = {'DJI_0085.webp','DJI_0086.webp','DJI_0087.webp','DJI_0131.webp','DJI_0132.webp','DJI_0174.webp','DJI_0176.webp','DJI_0190.webp','DJI_0080.webp','DJI_0082.webp'}
def write_image(im, dest, format, **options):
    buffer = io.BytesIO()
    im.save(buffer, format, **options)
    temp = dest.with_name(dest.name + '.tmp')
    with temp.open('wb') as stream:
        stream.write(buffer.getvalue())
        stream.flush()
        os.fsync(stream.fileno())
    temp.replace(dest)

records = []
imports = []
items = []
for i, path in enumerate(photos, 1):
 category, en, ar = labels.get(path.name, ('production', 'Crushing line and processing equipment', 'خط التكسير ومعدات المعالجة'))
 if path.name not in labels:
  if path.name in wide: en, ar = 'Aerial overview of the crushing plant', 'تصوير جوي لمنظومة الكسارات'
  elif path.name in feed: en, ar = 'Feed hopper and primary crushing equipment', 'هوبر التغذية ومعدات التكسير الأولي'
  elif path.name in conveyor: en, ar = 'Production conveyors and material transfer', 'سيور الإنتاج ونقل المواد'
  elif path.name in screens: en, ar = 'Screening plant and conveyors', 'منظومة الفرز والسيور'
  elif path.name == 'DJI_0083.webp': en, ar = 'Tunnel feeding the production line', 'نفق تغذية خط الإنتاج'
 ident = f'photo-{i:03d}'
 dest = output / curated.get(path.name, f'archive/{ident}.webp')
 thumb = output / 'thumbnails' / f'{ident}.webp'
 dest.parent.mkdir(parents=True, exist_ok=True)
 thumb.parent.mkdir(parents=True, exist_ok=True)
 with Image.open(path) as original:
  original.load()
  original_size = list(original.size)
  im = ImageOps.exif_transpose(original).convert('RGB')
  im.thumbnail((1600,1600), Image.Resampling.LANCZOS)
  write_image(im, dest, 'WEBP', quality=80, method=6)
  full_size = list(im.size)
  im.thumbnail((480,480), Image.Resampling.LANCZOS)
  write_image(im, thumb, 'WEBP', quality=76, method=6)
 imports.extend([f'import photo{i} from "@/assets/{dest.relative_to(repo / "src/assets").as_posix()}";', f'import thumb{i} from "@/assets/{thumb.relative_to(repo / "src/assets").as_posix()}";'])
 items.append(f'  {{ id: "{ident}", category: "{category}", image: photo{i}, thumbnail: thumb{i}, en: {json.dumps(en)}, ar: {json.dumps(ar, ensure_ascii=False)}, width: {full_size[0]}, height: {full_size[1]} }},')
 records.append({'id':ident,'category':category,'source':path.relative_to(root).as_posix(),'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source_bytes':path.stat().st_size,'source_dimensions':original_size,'web_path':dest.relative_to(repo).as_posix(),'web_sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'web_bytes':dest.stat().st_size,'web_dimensions':full_size,'thumbnail_bytes':thumb.stat().st_size,'en':en,'ar':ar})

(repo/'src/data/site-photo-library.ts').write_text('\n'.join(imports)+'''

export type SitePhotoCategory = "production" | "equipment" | "facilities" | "quarry";
export type SitePhoto = {
  id: string; category: SitePhotoCategory; image: string; thumbnail: string;
  en: string; ar: string; width: number; height: number;
};

/** Verified supplied site photographs; only visible thumbnails are mounted. */
export const sitePhotoLibrary: readonly SitePhoto[] = [
'''+ '\n'.join(items)+'\n];\n')
(repo/'docs/official-media-source-manifest.json').write_text(json.dumps({'source_archive':'somman-photos(3).rar','count':len(records),'categories':dict(Counter(x['category'] for x in records)),'transformation':'Resize and WebP encoding only. Source pixels receive no generative retouching. Display grading is reversible CSS.','photos':records},ensure_ascii=False,indent=2)+'\n')

# Original supplied document scans are copied byte-for-byte.
docdir = output/'documents'; docdir.mkdir(exist_ok=True)
for filename, src in {'iso-9001.jpg':'صور الشهادات/3.jpg','iso-14001.jpg':'صور الشهادات/2.jpg','iso-45001.jpg':'صور الشهادات/Untitled.jpg','permit-1438733.png':'صور التراخيص/1438733.png','permit-14377125.png':'صور التراخيص/14377125.png','permit-1437731.png':'صور التراخيص/1437731.png'}.items():
 shutil.copyfile(root/src,docdir/filename)
 with Image.open(root/src) as im:
  im.thumbnail((320,320));write_image(im.convert('RGB'),docdir/(Path(filename).stem+'-preview.webp'),'WEBP',quality=80,method=6)
brand = output/'brand'; brand.mkdir(exist_ok=True)
with Image.open(root/'الشعار مفرغ.png') as im:
 im.thumbnail((420,600), Image.Resampling.LANCZOS)
 write_image(im,brand/'alostool-logo.png','PNG',optimize=True)
print(json.dumps({'count':len(records),'categories':dict(Counter(x['category'] for x in records)),'source_mib':round(sum(x['source_bytes'] for x in records)/1048576,2),'web_mib':round(sum(x['web_bytes'] for x in records)/1048576,2),'thumbnails_mib':round(sum(x['thumbnail_bytes'] for x in records)/1048576,2),'largest_kib':round(max(x['web_bytes'] for x in records)/1024,1)}))
