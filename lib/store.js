// Armazenamento dos pedidos e das inscrições de notificação.
// - Na Vercel: usa o Vercel Blob em modo PRIVADO (dados só acessíveis pelo servidor).
// - No computador (desenvolvimento): grava arquivos JSON na pasta .dados/

import { promises as fs } from "node:fs";
import path from "node:path";

const useBlob = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const LOCAL_DIR = path.join(process.cwd(), ".dados");

let blobMod;
const blob = async () => (blobMod ||= await import("@vercel/blob"));

async function streamToText(stream) {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += dec.decode(value, { stream: true });
  }
  return out + dec.decode();
}

export async function saveJSON(pathname, data) {
  const body = JSON.stringify(data);
  if (useBlob) {
    const { put } = await blob();
    await put(pathname, body, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return;
  }
  const file = path.join(LOCAL_DIR, pathname);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
}

export async function readJSON(pathname) {
  if (useBlob) {
    const { get } = await blob();
    const r = await get(pathname, { access: "private", useCache: false });
    if (!r || !r.stream) return null;
    return JSON.parse(await streamToText(r.stream));
  }
  try {
    return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, pathname), "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

/** Lista caminhos com um prefixo (ordem alfabética). */
export async function listPaths(prefix) {
  if (useBlob) {
    const { list } = await blob();
    const out = [];
    let cursor;
    do {
      const r = await list({ prefix, cursor, limit: 1000 });
      out.push(...r.blobs.map(b => b.pathname));
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return out.sort();
  }
  const dir = path.join(LOCAL_DIR, prefix);
  try {
    return (await fs.readdir(dir)).filter(f => f.endsWith(".json")).map(f => prefix + f).sort();
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

export async function remove(pathname) {
  if (useBlob) {
    const { del } = await blob();
    await del(pathname);
    return;
  }
  await fs.rm(path.join(LOCAL_DIR, pathname), { force: true });
}

export const storageMode = useBlob ? "vercel-blob" : "local";
