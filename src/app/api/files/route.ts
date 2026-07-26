import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {NextRequest, NextResponse} from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rawPath = request.nextUrl.searchParams.get('path') || os.homedir();
  const requestedPath =
    rawPath === '~'
      ? os.homedir()
      : rawPath.startsWith('~/')
        ? path.join(os.homedir(), rawPath.slice(2))
        : rawPath;
  const currentPath = path.resolve(requestedPath);

  try {
    const stat = await fs.stat(currentPath);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        {error: '指定されたパスはディレクトリではありません'},
        {status: 400},
      );
    }

    const dirents = await fs.readdir(currentPath, {withFileTypes: true});
    const entries = dirents
      .filter(entry => entry.isDirectory() || entry.name.endsWith('.typ'))
      .map(entry => ({
        name: entry.name,
        path: path.join(currentPath, entry.name),
        type: entry.isDirectory() ? ('directory' as const) : ('typst' as const),
      }))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'ja', {numeric: true});
      });

    return NextResponse.json({
      path: currentPath,
      parent:
        path.dirname(currentPath) === currentPath
          ? null
          : path.dirname(currentPath),
      entries,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'ディレクトリを読み取れませんでした';
    return NextResponse.json({error: message}, {status: 400});
  }
}
