import fs from 'node:fs/promises';
import {NextResponse} from 'next/server';
import {countPdfPagesFromBytes} from '@/lib/pdf/metadata';
import {getSessionRepository} from '@/lib/repository';
import {publishCurrentSession} from '@/lib/session-update';
import {compileTypstToSvg} from '@/lib/typst/compiler';

const repo = getSessionRepository();
export const runtime = 'nodejs';

type Params = {params: Promise<{id: string}>};

export async function POST(_: Request, {params}: Params) {
  const {id} = await params;
  const session = repo.findById(id);
  if (!session) {
    return NextResponse.json({error: 'Session not found'}, {status: 404});
  }

  try {
    if (session.sourceType === 'typst') {
      if (!session.typstPath) {
        return NextResponse.json(
          {error: 'Typstファイルのパスが保存されていません'},
          {status: 400},
        );
      }

      const compiled = await compileTypstToSvg(session.typstPath);
      const updated = repo.updateSlides(id, {
        svgDir: compiled.svgDir,
        totalPages: compiled.totalPages,
      });
      if (!updated) {
        await fs.rm(compiled.svgDir, {recursive: true, force: true});
        return NextResponse.json({error: 'Session not found'}, {status: 404});
      }

      if (session.svgDir && session.svgDir !== compiled.svgDir) {
        await fs
          .rm(session.svgDir, {recursive: true, force: true})
          .catch(() => {
            // The reloaded slides are already available if old output cleanup fails.
          });
      }
    } else {
      let bytes: Uint8Array;
      if (session.sourceType === 'url') {
        if (!session.pdfUrl) {
          return NextResponse.json(
            {error: 'PDFのURLが保存されていません'},
            {status: 400},
          );
        }
        const response = await fetch(session.pdfUrl, {cache: 'no-store'});
        if (!response.ok) {
          throw new Error('PDFをURLから読み込めませんでした');
        }
        bytes = new Uint8Array(await response.arrayBuffer());
      } else {
        if (!session.pdfPath) {
          return NextResponse.json(
            {error: 'PDFファイルのパスが保存されていません'},
            {status: 400},
          );
        }
        bytes = new Uint8Array(await fs.readFile(session.pdfPath));
      }

      const totalPages = await countPdfPagesFromBytes(bytes);
      if (!repo.updateSlides(id, {totalPages})) {
        return NextResponse.json({error: 'Session not found'}, {status: 404});
      }
    }

    const clientSession = publishCurrentSession(repo, id);
    if (!clientSession) {
      return NextResponse.json({error: 'Session not found'}, {status: 404});
    }
    return NextResponse.json({session: clientSession});
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'スライドを更新できませんでした';
    return NextResponse.json({error: message}, {status: 400});
  }
}
