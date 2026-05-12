import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, toErrorMessage } from "@/lib/errors";

export async function withErrorHandling<T>(handler: () => Promise<T>) {
  try {
    const data = await handler();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          issues: error.flatten(),
        },
        { status: 422 },
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { message: toErrorMessage(error) },
      { status: 500 },
    );
  }
}
