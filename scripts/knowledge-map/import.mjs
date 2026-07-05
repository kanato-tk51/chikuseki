import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import * as yaml from "js-yaml";
import pg from "pg";

const { Pool } = pg;

const ROOT = process.cwd();
const DOMAINS_PATH = path.join(ROOT, "data/knowledge-map/domains.yaml");
const DETAILS_DIR = path.join(ROOT, "data/knowledge-map/domain-details");
const DEFAULT_DATABASE_URL =
  "postgresql://chikuseki:chikuseki@localhost:55432/chikuseki";

function relative(filePath) {
  return path.relative(ROOT, filePath);
}

function loadYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, "utf8"));
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function hashContent(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSearch(search) {
  if (!search || typeof search !== "object" || Array.isArray(search)) {
    return {
      keywords: [],
      commonSignals: [],
      antiSignals: [],
      relatedNames: [],
    };
  }

  return {
    keywords: normalizeStringList(search.keywords),
    commonSignals: normalizeStringList(search.commonSignals),
    antiSignals: normalizeStringList(search.antiSignals),
    relatedNames: Array.isArray(search.relatedNames)
      ? search.relatedNames
          .filter((item) => item && typeof item === "object")
          .map((item) => ({
            name: typeof item.name === "string" ? item.name.trim() : "",
            kind: typeof item.kind === "string" ? item.kind.trim() : "",
            relevance:
              typeof item.relevance === "string" ? item.relevance.trim() : "",
            officialUrl:
              typeof item.officialUrl === "string"
                ? item.officialUrl.trim()
                : null,
          }))
          .filter((item) => item.name && item.kind && item.relevance)
      : [],
  };
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    const key = trimmed.toLocaleLowerCase();

    if (!trimmed || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function listDetailFiles() {
  return fs
    .readdirSync(DETAILS_DIR)
    .filter((fileName) => fileName.endsWith(".yaml"))
    .sort()
    .map((fileName) => path.join(DETAILS_DIR, fileName));
}

function buildNodeKey(domainSlug, localSlug) {
  return `${domainSlug}:${localSlug}`;
}

function addNode(nodes, aliases, options) {
  const nodeKey = buildNodeKey(options.domainSlug, options.slug);
  const search = normalizeSearch(options.search);
  const record = {
    nodeKey,
    domainSlug: options.domainSlug,
    slug: options.slug,
    name: options.name,
    level: options.level,
    parentKey: options.parentKey,
    summary: options.summary,
    whyLearn: options.whyLearn ?? null,
    promptHint: options.promptHint ?? null,
    boundaryNotes: options.boundaryNotes ?? null,
    sortOrder: options.sortOrder,
    sourceFile: options.sourceFile,
    search,
    contentHash: hashContent({
      domainSlug: options.domainSlug,
      slug: options.slug,
      name: options.name,
      level: options.level,
      parentKey: options.parentKey,
      summary: options.summary,
      whyLearn: options.whyLearn ?? null,
      promptHint: options.promptHint ?? null,
      boundaryNotes: options.boundaryNotes ?? null,
      sortOrder: options.sortOrder,
      aliases: options.aliases ?? [],
      search,
    }),
  };

  nodes.push(record);

  for (const alias of options.aliases ?? []) {
    aliases.push({ nodeKey, alias });
  }

  return nodeKey;
}

function buildParentChain(node, nodeByKey) {
  const chain = [];
  let current = node;
  const seen = new Set([node.nodeKey]);

  while (current.parentKey) {
    const parent = nodeByKey.get(current.parentKey);

    if (!parent || seen.has(parent.nodeKey)) {
      break;
    }

    chain.push(parent);
    seen.add(parent.nodeKey);
    current = parent;
  }

  return chain;
}

function buildSearchMetadata(nodes, aliases) {
  const nodeByKey = new Map(nodes.map((node) => [node.nodeKey, node]));
  const aliasesByNodeKey = new Map();
  const keywordsByNodeKey = new Map();
  const relatedByNodeKey = new Map();
  const searchKeywords = [];
  const relatedItems = [];

  for (const alias of aliases) {
    const values = aliasesByNodeKey.get(alias.nodeKey) ?? [];
    values.push(alias.alias);
    aliasesByNodeKey.set(alias.nodeKey, values);
  }

  for (const node of nodes) {
    const keywordSpecs = [
      ...node.search.keywords.map((keyword) => ({
        keyword,
        keywordType: "keyword",
      })),
      ...node.search.commonSignals.map((keyword) => ({
        keyword,
        keywordType: "common_signal",
      })),
      ...node.search.antiSignals.map((keyword) => ({
        keyword,
        keywordType: "anti_signal",
      })),
    ];

    const dedupedKeywordSpecs = [];
    const seenKeywords = new Set();

    for (const spec of keywordSpecs) {
      const key = `${spec.keywordType}:${spec.keyword.toLocaleLowerCase()}`;

      if (seenKeywords.has(key)) {
        continue;
      }

      seenKeywords.add(key);
      dedupedKeywordSpecs.push(spec);
      searchKeywords.push({
        nodeKey: node.nodeKey,
        keyword: spec.keyword,
        keywordType: spec.keywordType,
        sourceFile: node.sourceFile,
      });
    }

    keywordsByNodeKey.set(node.nodeKey, dedupedKeywordSpecs);

    const dedupedRelated = [];
    const seenRelated = new Set();

    for (const item of node.search.relatedNames) {
      const key = `${item.kind}:${item.name.toLocaleLowerCase()}`;

      if (seenRelated.has(key)) {
        continue;
      }

      seenRelated.add(key);
      const record = {
        nodeKey: node.nodeKey,
        name: item.name,
        itemType: item.kind,
        relevance: item.relevance,
        officialUrl: item.officialUrl || null,
        sourceFile: node.sourceFile,
        contentHash: hashContent({
          name: item.name,
          itemType: item.kind,
          officialUrl: item.officialUrl || null,
        }),
      };
      dedupedRelated.push(record);
      relatedItems.push(record);
    }

    relatedByNodeKey.set(node.nodeKey, dedupedRelated);
  }

  const searchDocuments = nodes.map((node) => {
    const parentChain = buildParentChain(node, nodeByKey);
    const positiveKeywords = (keywordsByNodeKey.get(node.nodeKey) ?? [])
      .filter((item) => item.keywordType !== "anti_signal")
      .map((item) => item.keyword);
    const related = relatedByNodeKey.get(node.nodeKey) ?? [];
    const searchText = uniqueStrings([
      node.domainSlug,
      node.slug,
      node.name,
      node.summary,
      node.whyLearn,
      node.promptHint,
      node.boundaryNotes,
      ...(aliasesByNodeKey.get(node.nodeKey) ?? []),
      ...positiveKeywords,
      ...related.flatMap((item) => [item.name, item.relevance]),
      ...parentChain.flatMap((parent) => [
        parent.domainSlug,
        parent.slug,
        parent.name,
        parent.summary,
        parent.whyLearn,
      ]),
    ]).join("\n");

    return {
      nodeKey: node.nodeKey,
      searchText,
      contentHash: hashContent({ searchText }),
    };
  });

  return { searchKeywords, relatedItems, searchDocuments };
}

function collectSeed() {
  const domainSeed = loadYaml(DOMAINS_PATH);
  const domains = domainSeed.domains ?? [];
  const domainBySlug = new Map(domains.map((domain) => [domain.slug, domain]));
  const domainSlugs = new Set(domainBySlug.keys());
  const nodes = [];
  const aliases = [];
  const edges = [];
  const detailFiles = listDetailFiles();

  for (const filePath of detailFiles) {
    const sourceFile = relative(filePath);
    const data = loadYaml(filePath);
    const domain = data.domain;
    const domainSlug = domain.slug;
    const domainMeta = domainBySlug.get(domainSlug);

    if (!domainMeta) {
      throw new Error(`${sourceFile}: domain slug is not listed in domains.yaml`);
    }

    const domainKey = addNode(nodes, aliases, {
      domainSlug,
      slug: domainSlug,
      name: domain.name,
      level: "domain",
      parentKey: null,
      summary: domain.summary,
      whyLearn: domainMeta.whyLearn,
      boundaryNotes: domain.boundaryNotes,
      sortOrder: domains.findIndex((candidate) => candidate.slug === domainSlug),
      sourceFile,
      search: domain.search,
    });

    const localSlugs = new Set([domainSlug]);

    domain.knowledgeAreas.forEach((knowledgeArea, knowledgeAreaIndex) => {
      localSlugs.add(knowledgeArea.slug);
      const knowledgeAreaKey = addNode(nodes, aliases, {
        domainSlug,
        slug: knowledgeArea.slug,
        name: knowledgeArea.name,
        level: "knowledge_area",
        parentKey: domainKey,
        summary: knowledgeArea.summary,
        whyLearn: knowledgeArea.whyLearn,
        sortOrder: knowledgeAreaIndex,
        sourceFile,
        search: knowledgeArea.search,
      });

      knowledgeArea.topicClusters.forEach((cluster, clusterIndex) => {
        localSlugs.add(cluster.slug);
        const clusterKey = addNode(nodes, aliases, {
          domainSlug,
          slug: cluster.slug,
          name: cluster.name,
          level: "topic_cluster",
          parentKey: knowledgeAreaKey,
          summary: cluster.summary,
          sortOrder: clusterIndex,
          sourceFile,
          search: cluster.search,
        });

        cluster.concepts.forEach((concept, conceptIndex) => {
          localSlugs.add(concept.slug);
          const conceptKey = addNode(nodes, aliases, {
            domainSlug,
            slug: concept.slug,
            name: concept.name,
            level: "concept",
            parentKey: clusterKey,
            summary: concept.summary,
            whyLearn: concept.whyLearn,
            sortOrder: conceptIndex,
            sourceFile,
            search: concept.search,
          });

          concept.terms.forEach((term, termIndex) => {
            localSlugs.add(term.slug);
            addNode(nodes, aliases, {
              domainSlug,
              slug: term.slug,
              name: term.name,
              level: "term",
              parentKey: conceptKey,
              summary: term.summary,
              whyLearn: term.whyLearn,
              promptHint: term.promptHint,
              sortOrder: termIndex,
              sourceFile,
              aliases: term.aliases ?? [],
              search: term.search,
            });
          });
        });
      });
    });

    for (const [edgeIndex, edge] of (data.edges ?? []).entries()) {
      const from = resolveRef(edge.from, domainSlug, localSlugs, domainSlugs);
      const to = resolveRef(edge.to, domainSlug, localSlugs, domainSlugs);

      edges.push({
        fromKey: from.nodeKey,
        toKey: to.nodeKey,
        fromRef: edge.from,
        toRef: edge.to,
        relationType: edge.relationType,
        reason: edge.reason,
        edgeScope:
          from.scope === "local" && to.scope === "local" ? "local" : "cross_domain",
        sourceFile,
        sortOrder: edgeIndex,
      });
    }
  }

  return { nodes, aliases, edges, ...buildSearchMetadata(nodes, aliases) };
}

function resolveRef(ref, domainSlug, localSlugs, domainSlugs) {
  if (localSlugs.has(ref)) {
    return { nodeKey: buildNodeKey(domainSlug, ref), scope: "local" };
  }

  if (domainSlugs.has(ref)) {
    return { nodeKey: buildNodeKey(ref, ref), scope: "domain" };
  }

  if (ref.includes(":")) {
    return { nodeKey: ref, scope: "qualified" };
  }

  throw new Error(
    `${domainSlug}: edge ref cannot be resolved locally or as domain slug: ${ref}`,
  );
}

async function upsertNode(client, node) {
  const result = await client.query(
    `
      INSERT INTO knowledge_nodes (
        node_key,
        domain_slug,
        slug,
        name,
        level,
        parent_id,
        summary,
        why_learn,
        prompt_hint,
        boundary_notes,
        sort_order,
        curation_status,
        source_file,
        content_hash
      )
      VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, $10, 'draft', $11, $12)
      ON CONFLICT (node_key) DO UPDATE SET
        domain_slug = EXCLUDED.domain_slug,
        slug = EXCLUDED.slug,
        name = EXCLUDED.name,
        level = EXCLUDED.level,
        summary = EXCLUDED.summary,
        why_learn = EXCLUDED.why_learn,
        prompt_hint = EXCLUDED.prompt_hint,
        boundary_notes = EXCLUDED.boundary_notes,
        sort_order = EXCLUDED.sort_order,
        curation_status = CASE
          WHEN knowledge_nodes.curation_status = 'deprecated' THEN 'draft'
          ELSE knowledge_nodes.curation_status
        END,
        source_file = EXCLUDED.source_file,
        content_hash = EXCLUDED.content_hash,
        updated_at = now()
      RETURNING id
    `,
    [
      node.nodeKey,
      node.domainSlug,
      node.slug,
      node.name,
      node.level,
      node.summary,
      node.whyLearn,
      node.promptHint,
      node.boundaryNotes,
      node.sortOrder,
      node.sourceFile,
      node.contentHash,
    ],
  );

  return result.rows[0].id;
}

async function syncNodes(client, nodes) {
  const nodeIds = new Map();

  for (const node of nodes) {
    const id = await upsertNode(client, node);
    nodeIds.set(node.nodeKey, id);
  }

  for (const node of nodes) {
    const parentId = node.parentKey ? nodeIds.get(node.parentKey) : null;

    if (node.parentKey && !parentId) {
      throw new Error(`missing parent node for ${node.nodeKey}: ${node.parentKey}`);
    }

    await client.query(
      `
        UPDATE knowledge_nodes
        SET parent_id = $1, updated_at = now()
        WHERE node_key = $2
          AND parent_id IS DISTINCT FROM $1::uuid
      `,
      [parentId, node.nodeKey],
    );
  }

  await client.query(
    `
      UPDATE knowledge_nodes
      SET curation_status = 'deprecated', updated_at = now()
      WHERE source_file LIKE 'data/knowledge-map/%'
        AND NOT (node_key = ANY($1::text[]))
        AND curation_status <> 'deprecated'
    `,
    [nodes.map((node) => node.nodeKey)],
  );

  return nodeIds;
}

async function syncAliases(client, aliases, nodeIds) {
  const nodeIdValues = [...nodeIds.values()];

  if (nodeIdValues.length > 0) {
    await client.query("DELETE FROM knowledge_aliases WHERE node_id = ANY($1::uuid[])", [
      nodeIdValues,
    ]);
  }

  for (const alias of aliases) {
    const nodeId = nodeIds.get(alias.nodeKey);

    if (!nodeId) {
      throw new Error(`missing node for alias ${alias.nodeKey}:${alias.alias}`);
    }

    await client.query(
      `
        INSERT INTO knowledge_aliases (node_id, alias)
        VALUES ($1, $2)
        ON CONFLICT (node_id, alias) DO NOTHING
      `,
      [nodeId, alias.alias],
    );
  }
}

async function syncSearchDocuments(client, searchDocuments, nodeIds) {
  for (const document of searchDocuments) {
    const nodeId = nodeIds.get(document.nodeKey);

    if (!nodeId) {
      throw new Error(`missing node for search document ${document.nodeKey}`);
    }

    await client.query(
      `
        INSERT INTO knowledge_node_search_documents (
          node_id,
          search_text,
          content_hash
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (node_id) DO UPDATE SET
          search_text = EXCLUDED.search_text,
          content_hash = EXCLUDED.content_hash,
          updated_at = now()
      `,
      [nodeId, document.searchText, document.contentHash],
    );
  }
}

async function syncSearchKeywords(client, searchKeywords, nodeIds) {
  const nodeIdValues = [...nodeIds.values()];

  if (nodeIdValues.length > 0) {
    await client.query(
      "DELETE FROM knowledge_node_search_keywords WHERE node_id = ANY($1::uuid[])",
      [nodeIdValues],
    );
  }

  for (const keyword of searchKeywords) {
    const nodeId = nodeIds.get(keyword.nodeKey);

    if (!nodeId) {
      throw new Error(`missing node for search keyword ${keyword.nodeKey}`);
    }

    await client.query(
      `
        INSERT INTO knowledge_node_search_keywords (
          node_id,
          keyword,
          keyword_type,
          source_file
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (node_id, keyword, keyword_type) DO NOTHING
      `,
      [nodeId, keyword.keyword, keyword.keywordType, keyword.sourceFile],
    );
  }
}

async function syncRelatedItems(client, relatedItems, nodeIds) {
  const nodeIdValues = [...nodeIds.values()];

  if (nodeIdValues.length > 0) {
    await client.query(
      "DELETE FROM knowledge_node_related_items WHERE node_id = ANY($1::uuid[])",
      [nodeIdValues],
    );
  }

  for (const item of relatedItems) {
    const nodeId = nodeIds.get(item.nodeKey);

    if (!nodeId) {
      throw new Error(`missing node for related item ${item.nodeKey}`);
    }

    const result = await client.query(
      `
        INSERT INTO knowledge_related_items (
          name,
          item_type,
          official_url,
          content_hash
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name, item_type) DO UPDATE SET
          official_url = EXCLUDED.official_url,
          content_hash = EXCLUDED.content_hash,
          updated_at = now()
        RETURNING id
      `,
      [item.name, item.itemType, item.officialUrl, item.contentHash],
    );

    await client.query(
      `
        INSERT INTO knowledge_node_related_items (
          node_id,
          related_item_id,
          relevance,
          source_file
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (node_id, related_item_id) DO UPDATE SET
          relevance = EXCLUDED.relevance,
          source_file = EXCLUDED.source_file
      `,
      [nodeId, result.rows[0].id, item.relevance, item.sourceFile],
    );
  }

  await client.query(
    `
      DELETE FROM knowledge_related_items
      WHERE NOT EXISTS (
        SELECT 1
        FROM knowledge_node_related_items
        WHERE knowledge_node_related_items.related_item_id = knowledge_related_items.id
      )
    `,
  );
}

async function syncEdges(client, edges, nodeIds) {
  await client.query(
    "DELETE FROM knowledge_edges WHERE source_file LIKE 'data/knowledge-map/domain-details/%'",
  );

  for (const edge of edges) {
    const fromId = nodeIds.get(edge.fromKey);
    const toId = nodeIds.get(edge.toKey);

    if (!fromId) {
      throw new Error(`missing from node for edge ${edge.fromRef}: ${edge.fromKey}`);
    }

    if (!toId) {
      throw new Error(`missing to node for edge ${edge.toRef}: ${edge.toKey}`);
    }

    await client.query(
      `
        INSERT INTO knowledge_edges (
          from_node_id,
          to_node_id,
          from_ref,
          to_ref,
          relation_type,
          reason,
          edge_scope,
          source_file
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (from_node_id, to_node_id, relation_type) DO UPDATE SET
          from_ref = EXCLUDED.from_ref,
          to_ref = EXCLUDED.to_ref,
          reason = EXCLUDED.reason,
          edge_scope = EXCLUDED.edge_scope,
          source_file = EXCLUDED.source_file,
          updated_at = now()
      `,
      [
        fromId,
        toId,
        edge.fromRef,
        edge.toRef,
        edge.relationType,
        edge.reason,
        edge.edgeScope,
        edge.sourceFile,
      ],
    );
  }
}

async function main() {
  const seed = collectSeed();
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const nodeIds = await syncNodes(client, seed.nodes);
    await syncAliases(client, seed.aliases, nodeIds);
    await syncSearchDocuments(client, seed.searchDocuments, nodeIds);
    await syncSearchKeywords(client, seed.searchKeywords, nodeIds);
    await syncRelatedItems(client, seed.relatedItems, nodeIds);
    await syncEdges(client, seed.edges, nodeIds);
    await client.query("COMMIT");

    console.log("Knowledge Map import complete");
    console.log(`nodes=${seed.nodes.length}`);
    console.log(`aliases=${seed.aliases.length}`);
    console.log(`searchDocuments=${seed.searchDocuments.length}`);
    console.log(`searchKeywords=${seed.searchKeywords.length}`);
    console.log(`relatedItems=${seed.relatedItems.length}`);
    console.log(`edges=${seed.edges.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
