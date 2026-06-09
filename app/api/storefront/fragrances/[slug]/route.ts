import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type TodoResponse = {
  message: string;
  slug: string;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<TodoResponse>> {
  void request;
  const {slug} = await context.params;
  // TODO: Return one published fragrance by slug with images, variants, notes, and collections.
  return NextResponse.json(
    {message: "TODO: get storefront fragrance", slug},
    {status: 501}
  );
}
