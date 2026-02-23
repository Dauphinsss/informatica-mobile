import * as admin from "firebase-admin";
import { DocumentReference, Firestore, GeoPoint, Timestamp } from "firebase-admin/firestore";
import * as fs from "node:fs";
import * as path from "node:path";

type CliOptions = {
  collections: string[];
  sample: number;
  maxDepth: number;
  outDir: string;
  serviceAccountPath?: string;
};

type StructureNode = {
  collectionId: string;
  pathTemplate: string;
  sampledDocuments: number;
  fields: Record<string, string[]>;
  subcollections: StructureNode[];
  maxDepthReached: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    collections: [],
    sample: 100,
    maxDepth: 8,
    outDir: "exports/firestore",
    serviceAccountPath: undefined,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--collections" && next) {
      opts.collections = next
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (arg === "--sample" && next) {
      opts.sample = Math.max(1, Number(next) || 100);
      i += 1;
      continue;
    }

    if (arg === "--max-depth" && next) {
      opts.maxDepth = Math.max(1, Number(next) || 8);
      i += 1;
      continue;
    }

    if (arg === "--out-dir" && next) {
      opts.outDir = next;
      i += 1;
      continue;
    }

    if (arg === "--service-account" && next) {
      opts.serviceAccountPath = next;
      i += 1;
    }
  }

  return opts;
}

function initializeAdmin(serviceAccountPath?: string): admin.app.App {
  if (admin.apps.length) return admin.app();

  if (serviceAccountPath) {
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    const fileRaw = fs.readFileSync(absolutePath, "utf8");
    const credentialJson = JSON.parse(fileRaw);
    return admin.initializeApp({
      credential: admin.credential.cert(credentialJson),
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  const defaultPath = path.resolve(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(defaultPath)) {
    const fileRaw = fs.readFileSync(defaultPath, "utf8");
    const credentialJson = JSON.parse(fileRaw);
    return admin.initializeApp({
      credential: admin.credential.cert(credentialJson),
    });
  }

  throw new Error(
    "No se encontro credencial. Usa --service-account <ruta>, o define GOOGLE_APPLICATION_CREDENTIALS, o coloca serviceAccountKey.json en la raiz."
  );
}

function ensureDir(dir: string): void {
  fs.mkdirSync(path.resolve(process.cwd(), dir), { recursive: true });
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value instanceof Timestamp) return "timestamp";
  if (value instanceof Date) return "date";
  if (value instanceof GeoPoint) return "geopoint";
  if (value instanceof DocumentReference) return "reference";
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return "bytes";
  return typeof value;
}

function mergeSchemaInto(
  target: Record<string, Set<string>>,
  docData: Record<string, unknown>
): void {
  for (const [k, v] of Object.entries(docData)) {
    if (!target[k]) target[k] = new Set<string>();
    target[k].add(valueType(v));
  }
}

function schemaSetToObject(schemaSet: Record<string, Set<string>>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(schemaSet)) out[k] = Array.from(set).sort();
  return out;
}

async function inspectCollectionInstances(
  collectionId: string,
  pathTemplate: string,
  instances: FirebaseFirestore.CollectionReference[],
  depth: number,
  sample: number,
  maxDepth: number
): Promise<StructureNode> {
  const schemaSet: Record<string, Set<string>> = {};
  const childGroups = new Map<string, { collectionId: string; refs: FirebaseFirestore.CollectionReference[] }>();
  let sampledDocuments = 0;

  for (const ref of instances) {
    const snap = await ref.limit(sample).get();
    sampledDocuments += snap.size;

    for (const doc of snap.docs) {
      mergeSchemaInto(schemaSet, doc.data() as Record<string, unknown>);

      if (depth >= maxDepth) continue;

      const subcollections = await doc.ref.listCollections();
      for (const subcol of subcollections) {
        const childTemplate = `${pathTemplate}/{docId}/${subcol.id}`;
        const existing = childGroups.get(childTemplate);
        if (existing) {
          existing.refs.push(subcol);
        } else {
          childGroups.set(childTemplate, {
            collectionId: subcol.id,
            refs: [subcol],
          });
        }
      }
    }
  }

  const subcollections: StructureNode[] = [];
  if (depth < maxDepth) {
    const sortedChildren = Array.from(childGroups.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [childTemplate, group] of sortedChildren) {
      const childNode = await inspectCollectionInstances(
        group.collectionId,
        childTemplate,
        group.refs,
        depth + 1,
        sample,
        maxDepth
      );
      subcollections.push(childNode);
    }
  }

  return {
    collectionId,
    pathTemplate,
    sampledDocuments,
    fields: schemaSetToObject(schemaSet),
    subcollections,
    maxDepthReached: depth >= maxDepth,
  };
}

async function getCollectionNames(db: Firestore, specified: string[]): Promise<string[]> {
  if (specified.length) return specified;
  const cols = await db.listCollections();
  return cols.map((c) => c.id).sort();
}

async function exportStructure(
  db: Firestore,
  collections: string[],
  opts: CliOptions
): Promise<void> {
  const roots: StructureNode[] = [];

  for (const collectionName of collections) {
    const node = await inspectCollectionInstances(
      collectionName,
      collectionName,
      [db.collection(collectionName)],
      1,
      opts.sample,
      opts.maxDepth
    );
    roots.push(node);
    console.log(`Estructura inspeccionada: ${collectionName}`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    samplePerCollectionInstance: opts.sample,
    maxDepth: opts.maxDepth,
    rootCollections: collections.length,
    collections: roots,
  };

  const filePath = path.resolve(process.cwd(), opts.outDir, "firestore.structure.json");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Estructura completa exportada: ${filePath}`);
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  initializeAdmin(opts.serviceAccountPath);
  const db = admin.firestore();

  ensureDir(opts.outDir);

  const collections = await getCollectionNames(db, opts.collections);
  if (!collections.length) {
    console.log("No se encontraron colecciones para exportar.");
    return;
  }

  console.log(`Colecciones objetivo (${collections.length}): ${collections.join(", ")}`);
  await exportStructure(db, collections, opts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
