import ffmpeg from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const [input, directory] = process.argv.slice(2);
if (!input || !directory) throw new Error('Usage: node video-frames.mjs recording.mp4 output-directory');
const target = path.resolve(directory);
await mkdir(target, { recursive: true });
const child = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', '-i', path.resolve(input), '-vf', 'fps=1', '-frames:v', '12', path.join(target, 'frame-%03d.png')], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let errors = '';
child.stderr.on('data', data => { errors += data.toString(); });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('close', code => { if (code) { console.error(errors); process.exitCode = code; } else console.log(JSON.stringify({ status: 'extracted', directory: target, fps: 1, maximumFrames: 12 })); });
