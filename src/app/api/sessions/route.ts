import {NextResponse} from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import {nanoid} from 'nanoid';
import {parseNotesJson} from '@/lib/notes';
import {countPdfPagesFromBytes} from '@/lib/pdf/metadata';
import {getSessionRepository} from '@/lib/repository';
import {compileTypstToSvg} from '@/lib/typst/compiler';

const repo = getSessionRepository();
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({sessions: repo.list()});
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title =
      String(formData.get('title') || 'Untitled Session').trim() ||
      'Untitled Session';
    const pdfUrl = String(formData.get('pdfUrl') || '').trim();
    const typstPath = String(formData.get('typstPath') || '').trim();
    const pdfFile = formData.get('pdfFile');
    const hasPdfFile =
      pdfFile instanceof File && pdfFile.size > 0 && pdfFile.name.length > 0;
    const hasPdfUrl = pdfUrl.length > 0;
    const hasTypstPath = typstPath.length > 0;

    if ([hasPdfFile, hasPdfUrl, hasTypstPath].filter(Boolean).length > 1) {
      return NextResponse.json(
        {
          error:
            'PDFファイル、PDF URL、Typstファイルのいずれか1つを指定してください',
        },
        {status: 400},
      );
    }

    let notes: ReturnType<typeof parseNotesJson> | undefined;
    const notesFile = formData.get('notesFile');
    const hasNotesFile =
      notesFile instanceof File &&
      notesFile.size > 0 &&
      notesFile.name.length > 0;

    if (hasNotesFile && notesFile instanceof File) {
      notes = parseNotesJson(await notesFile.text());
    }

    if (hasPdfFile && pdfFile instanceof File) {
      const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
      const totalPages = await countPdfPagesFromBytes(pdfBytes);

      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      await fs.mkdir(uploadsDir, {recursive: true});
      const filename = `${Date.now()}-${nanoid(8)}.pdf`;
      const targetPath = path.join(uploadsDir, filename);
      const bytes = Buffer.from(pdfBytes);
      await fs.writeFile(targetPath, bytes);

      const session = repo.create({
        title,
        sourceType: 'upload',
        pdfPath: targetPath,
        totalPages,
        notes,
      });

      return NextResponse.json({session}, {status: 201});
    }

    if (hasTypstPath) {
      const compiled = await compileTypstToSvg(typstPath);
      try {
        const session = repo.create({
          title,
          sourceType: 'typst',
          typstPath: compiled.sourcePath,
          svgDir: compiled.svgDir,
          totalPages: compiled.totalPages,
          notes,
        });

        return NextResponse.json({session}, {status: 201});
      } catch (error) {
        await fs.rm(compiled.svgDir, {recursive: true, force: true});
        throw error;
      }
    }

    if (!hasPdfUrl) {
      return NextResponse.json(
        {error: '表示するPDFまたはTypstファイルを指定してください'},
        {status: 400},
      );
    }

    const sourceResponse = await fetch(pdfUrl);
    if (!sourceResponse.ok) {
      return NextResponse.json(
        {error: 'Failed to fetch PDF from URL'},
        {status: 400},
      );
    }

    const sourceBytes = new Uint8Array(await sourceResponse.arrayBuffer());
    const totalPages = await countPdfPagesFromBytes(sourceBytes);

    const session = repo.create({
      title,
      sourceType: 'url',
      pdfUrl,
      totalPages,
      notes,
    });

    return NextResponse.json({session}, {status: 201});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({error: message}, {status: 400});
  }
}
