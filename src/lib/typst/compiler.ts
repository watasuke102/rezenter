import 'server-only';

import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {nanoid} from 'nanoid';

export type CompiledTypst = {
  sourcePath: string;
  svgDir: string;
  totalPages: number;
};

function runTypst(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const command = process.env.TYPST_BIN?.trim() || 'typst';
    const child = spawn(command, args, {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
    });
    child.stderr.on('data', chunk => {
      stderr += chunk;
    });
    child.once('error', error => {
      reject(
        new Error(
          error.message.includes('ENOENT')
            ? 'typst コマンドが見つかりません。TYPST_BIN を設定してください。'
            : error.message,
        ),
      );
    });
    child.once('close', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          stderr.trim() ||
            stdout.trim() ||
            `typst compile が終了コード ${code ?? 'unknown'} で失敗しました`,
        ),
      );
    });
  });
}

export async function compileTypstToSvg(
  inputPath: string,
): Promise<CompiledTypst> {
  const sourcePath = path.resolve(inputPath);
  const stat = await fs.stat(sourcePath);
  if (!stat.isFile() || path.extname(sourcePath).toLowerCase() !== '.typ') {
    throw new Error('有効な .typ ファイルを選択してください');
  }

  const svgDir = path.join(
    process.cwd(),
    'data',
    'typst',
    `${Date.now()}-${nanoid(8)}`,
  );
  await fs.mkdir(svgDir, {recursive: true});

  try {
    await runTypst([
      'compile',
      '--root',
      path.parse(sourcePath).root,
      sourcePath,
      path.join(svgDir, 'page-{p}.svg'),
    ]);

    const entries = await fs.readdir(svgDir);
    const totalPages = entries.filter(name =>
      /^page-\d+\.svg$/.test(name),
    ).length;
    if (totalPages === 0) {
      throw new Error('TypstからSVGページが生成されませんでした');
    }

    return {sourcePath, svgDir, totalPages};
  } catch (error) {
    await fs.rm(svgDir, {recursive: true, force: true});
    throw error;
  }
}
