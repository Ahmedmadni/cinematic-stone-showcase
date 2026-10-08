#!/usr/bin/env python3
"""Create truthful, continuous scene cuts and a web tour; requires ffmpeg/ffprobe."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]
out = repo / 'src/assets/official/video'
out.mkdir(parents=True, exist_ok=True)
cuts = [('hero', 40, 9), ('production', 64, 9), ('fleet', 136, 8), ('facilities', 108, 9), ('quarry', 167, 9)]
records = []
def run(cmd):
    subprocess.run(cmd, check=True)
def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,codec_type,width,height,avg_frame_rate', '-of', 'json', str(path)]))
def encode(name, start, duration, crf):
    path = out / (name + '.mp4')
    temp = out / (name + '.pending.mp4')
    cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(start), '-i', str(args.source)]
    if duration is not None:
        cmd += ['-t', str(duration)]
    cmd += ['-an', '-vf', 'scale=960:-2,fps=24' if duration is None else 'scale=1280:-2,fps=24', '-c:v', 'libx264', '-preset', 'medium', '-crf', str(crf), '-maxrate', '500k' if duration is None else '800k', '-bufsize', '1000k' if duration is None else '1600k', '-pix_fmt', 'yuv420p', '-g', '48', '-movflags', '+faststart', '-threads', '2', str(temp)]
    run(cmd)
    temp.replace(path)
    metadata = probe(path)
    records.append({'id': name, 'start_seconds': start, 'duration_seconds': float(metadata['format']['duration']), 'path': path.relative_to(repo).as_posix(), 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'streams': metadata['streams']})
    webm = out / (name + '.webm')
    temp_webm = out / (name + '.pending.webm')
    cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(start), '-i', str(args.source)]
    if duration is not None:
        cmd += ['-t', str(duration)]
    cmd += ['-an', '-vf', 'scale=960:-2,fps=24' if duration is None else 'scale=1280:-2,fps=24', '-c:v', 'libvpx-vp9', '-crf', '43' if duration is None else '40', '-b:v', '450k' if duration is None else '650k', '-maxrate', '500k' if duration is None else '800k', '-bufsize', '1000k' if duration is None else '1600k', '-row-mt', '1', '-cpu-used', '4', '-threads', '4', '-g', '48', str(temp_webm)]
    run(cmd)
    temp_webm.replace(webm)
    records[-1]['webm'] = {'path': webm.relative_to(repo).as_posix(), 'bytes': webm.stat().st_size, 'sha256': hashlib.sha256(webm.read_bytes()).hexdigest(), 'streams': probe(webm)['streams']}
    poster = out / (name + '-poster.webp')
    temp_poster = out / (name + '-poster.pending.webp')
    poster_time = 16 if name == 'full-tour' else start
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(poster_time), '-i', str(args.source), '-frames:v', '1', '-vf', 'scale=1280:-2', '-c:v', 'libwebp', '-quality', '80', str(temp_poster)])
    temp_poster.replace(poster)
    records[-1]['poster'] = {'source_seconds': poster_time, 'path': poster.relative_to(repo).as_posix(), 'bytes': poster.stat().st_size, 'sha256': hashlib.sha256(poster.read_bytes()).hexdigest()}
    print(name, path.stat().st_size, flush=True)
for name, start, duration in cuts:
    encode(name, start, duration, 31)
encode('full-tour', 0, None, 32)
manifest = {'source_name': args.source.name, 'source_sha256': hashlib.sha256(args.source.read_bytes()).hexdigest(), 'source': probe(args.source), 'treatment': 'Continuous source cuts, scaling, frame-rate conversion and compression only. No fabricated or replaced scene content; reversible CSS display grading.', 'videos': records}
(repo / 'docs/official-video-source-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
