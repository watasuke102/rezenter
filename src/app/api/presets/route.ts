import {NextRequest, NextResponse} from 'next/server';
import {getMarginPresetRepository} from '@/lib/repository/margin-preset-repository';

export async function GET() {
  const repo = getMarginPresetRepository();
  const presets = repo.list();
  return NextResponse.json({presets});
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const repo = getMarginPresetRepository();
  repo.save({
    name: payload.name,
    marginTop: payload.marginTop,
    marginBottom: payload.marginBottom,
    marginLeft: payload.marginLeft,
    marginRight: payload.marginRight,
  });
  const presets = repo.list();
  return NextResponse.json({presets});
}
