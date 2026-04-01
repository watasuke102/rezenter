import {NextResponse} from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import {nanoid} from 'nanoid';
import {parseNotesJson} from '@/lib/notes';
import {getSessionRepository} from '@/lib/repository';

const repo = getSessionRepository();

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
    const pdfFile = formData.get('pdfFile');
    const hasPdfFile =
      pdfFile instanceof File && pdfFile.size > 0 && pdfFile.name.length > 0;
    const hasPdfUrl = pdfUrl.length > 0;

    if (hasPdfFile && hasPdfUrl) {
      return NextResponse.json(
        {error: 'Specify either pdfFile or pdfUrl, not both'},
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
      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      await fs.mkdir(uploadsDir, {recursive: true});
      const filename = `${Date.now()}-${nanoid(8)}.pdf`;
      const targetPath = path.join(uploadsDir, filename);
      const bytes = Buffer.from(await pdfFile.arrayBuffer());
      await fs.writeFile(targetPath, bytes);

      const session = repo.create({
        title,
        sourceType: 'upload',
        pdfPath: targetPath,
        notes,
      });

      return NextResponse.json({session}, {status: 201});
    }

    if (!hasPdfUrl) {
      return NextResponse.json(
        {error: 'Either pdfFile or pdfUrl is required'},
        {status: 400},
      );
    }

    const session = repo.create({
      title,
      sourceType: 'url',
      pdfUrl,
      notes,
    });

    return NextResponse.json({session}, {status: 201});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({error: message}, {status: 400});
  }
}
