import { execFile } from "node:child_process";
import { createWriteStream, unlink } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { File } from "@google-cloud/storage";

const execFileAsync = promisify(execFile);
const unlinkAsync = promisify(unlink);

/**
 * Fetch a GCS file to a temp path, run ffprobe to get duration (seconds),
 * and clean up. Throws if ffprobe fails or duration cannot be read.
 */
export async function probeVideoDuration(gcsFile: File): Promise<number> {
  const tmpPath = join(tmpdir(), `probe-${Date.now()}.bin`);
  try {
    // Stream the object down to a temp file
    const nodeStream = gcsFile.createReadStream();
    const ws = createWriteStream(tmpPath);
    await pipeline(nodeStream, ws);

    // Run ffprobe against the local file
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      tmpPath,
    ]);
    const parsed = JSON.parse(stdout);
    const duration = parseFloat(parsed?.format?.duration ?? "0");
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Could not read video duration");
    }
    return duration;
  } finally {
    unlinkAsync(tmpPath).catch(() => undefined);
  }
}
