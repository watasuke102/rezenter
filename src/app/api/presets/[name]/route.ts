import {NextRequest, NextResponse} from 'next/server';
import {getMarginPresetRepository} from '@/lib/repository/margin-preset-repository';

export async function DELETE(
  req: NextRequest,
  {params}: {params: Promise<{name: string}>}
) {
  const repo = getMarginPresetRepository();
  const resolvedParams = await params;
  repo.delete(resolvedParams.name);
  const presets = repo.list();
  return NextResponse.json({presets});
}
