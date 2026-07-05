import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import * as yaml from "js-yaml";

const ROOT = process.cwd();
const DOMAINS_PATH = path.join(ROOT, "data/knowledge-map/domains.yaml");
const DETAILS_DIR = path.join(ROOT, "data/knowledge-map/domain-details");
const ALLOWED_RELATION_TYPES = new Set([
  "prerequisite",
  "compare_with",
  "used_in",
  "related",
]);
const ALLOWED_LEVELS = new Set([
  "domain",
  "knowledge_area",
  "topic_cluster",
  "concept",
  "term",
]);
const ALLOWED_RELATED_ITEM_TYPES = new Set([
  "library",
  "framework",
  "tool",
  "standard",
  "protocol",
  "service",
  "platform",
  "pattern",
  "language",
  "method",
  "other",
]);

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readUtf8(filePath) {
  const text = fs.readFileSync(filePath, "utf8");

  if (text.includes("\uFFFD")) {
    fail(`${relative(filePath)} contains replacement characters`);
  }

  return text;
}

function loadYaml(filePath) {
  try {
    return yaml.load(readUtf8(filePath));
  } catch (error) {
    fail(`${relative(filePath)} is not valid YAML: ${error.message}`);
    return null;
  }
}

function relative(filePath) {
  return path.relative(ROOT, filePath);
}

function assertString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
    return false;
  }

  return true;
}

function validateOptionalStringArray(value, label) {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    fail(`${label} must be an array when present`);
    return;
  }

  value.forEach((item, index) => {
    assertString(item, `${label}[${index}]`);
  });
}

function validateSearchBlock(node, label) {
  if (node?.search === undefined) {
    return;
  }

  if (!node.search || typeof node.search !== "object" || Array.isArray(node.search)) {
    fail(`${label}.search must be an object when present`);
    return;
  }

  validateOptionalStringArray(node.search.keywords, `${label}.search.keywords`);
  validateOptionalStringArray(node.search.commonSignals, `${label}.search.commonSignals`);
  validateOptionalStringArray(node.search.antiSignals, `${label}.search.antiSignals`);

  if (node.search.relatedNames === undefined) {
    return;
  }

  if (!Array.isArray(node.search.relatedNames)) {
    fail(`${label}.search.relatedNames must be an array when present`);
    return;
  }

  node.search.relatedNames.forEach((item, index) => {
    const itemLabel = `${label}.search.relatedNames[${index}]`;

    assertString(item?.name, `${itemLabel}.name`);
    assertString(item?.kind, `${itemLabel}.kind`);
    assertString(item?.relevance, `${itemLabel}.relevance`);

    if (item?.kind && !ALLOWED_RELATED_ITEM_TYPES.has(item.kind)) {
      fail(`${itemLabel}.kind is not allowed: ${item.kind}`);
    }

    if (item?.officialUrl !== undefined) {
      assertString(item.officialUrl, `${itemLabel}.officialUrl`);
    }
  });
}

function collectDetailFiles() {
  if (!fs.existsSync(DETAILS_DIR)) {
    fail(`${relative(DETAILS_DIR)} does not exist`);
    return [];
  }

  return fs
    .readdirSync(DETAILS_DIR)
    .filter((fileName) => fileName.endsWith(".yaml"))
    .sort()
    .map((fileName) => path.join(DETAILS_DIR, fileName));
}

function validateDomainsFile() {
  const data = loadYaml(DOMAINS_PATH);

  if (!data || !assertArray(data.domains, "domains.yaml domains")) {
    return { domains: [], domainSlugSet: new Set() };
  }

  const seen = new Set();
  const domains = [];

  data.domains.forEach((domain, index) => {
    const prefix = `domains.yaml domains[${index}]`;

    assertString(domain?.slug, `${prefix}.slug`);
    assertString(domain?.name, `${prefix}.name`);
    assertString(domain?.summary, `${prefix}.summary`);
    assertString(domain?.whyLearn, `${prefix}.whyLearn`);
    assertString(domain?.boundaryNotes, `${prefix}.boundaryNotes`);

    if (domain?.slug) {
      if (seen.has(domain.slug)) {
        fail(`domains.yaml has duplicate domain slug: ${domain.slug}`);
      }
      seen.add(domain.slug);
      domains.push(domain);
    }
  });

  return { domains, domainSlugSet: seen };
}

function addNode(nodes, filePath, level, node, parentKey, domainSlug, sortOrder) {
  const label = `${relative(filePath)} ${level} ${node?.slug ?? "(missing slug)"}`;

  assertString(node?.slug, `${label}.slug`);
  assertString(node?.name, `${label}.name`);
  assertString(node?.summary, `${label}.summary`);

  if (!ALLOWED_LEVELS.has(level)) {
    fail(`${label} has invalid level: ${level}`);
  }

  validateSearchBlock(node, label);

  const nodeKey = `${domainSlug}:${node.slug}`;

  nodes.push({
    key: nodeKey,
    slug: node.slug,
    level,
    parentKey,
    domainSlug,
    sortOrder,
    node,
  });

  return nodeKey;
}

function validateTerm(filePath, nodes, term, parentKey, domainSlug, sortOrder) {
  const key = addNode(nodes, filePath, "term", term, parentKey, domainSlug, sortOrder);
  const label = `${relative(filePath)} term ${term?.slug ?? "(missing slug)"}`;

  assertString(term?.whyLearn, `${label}.whyLearn`);
  assertString(term?.promptHint, `${label}.promptHint`);

  if (term?.aliases !== undefined && !Array.isArray(term.aliases)) {
    fail(`${label}.aliases must be an array when present`);
  }

  if (Array.isArray(term?.aliases)) {
    term.aliases.forEach((alias, index) => {
      assertString(alias, `${label}.aliases[${index}]`);
    });
  }

  return key;
}

function validateConcept(filePath, nodes, concept, parentKey, domainSlug, sortOrder) {
  const key = addNode(
    nodes,
    filePath,
    "concept",
    concept,
    parentKey,
    domainSlug,
    sortOrder,
  );
  const label = `${relative(filePath)} concept ${concept?.slug ?? "(missing slug)"}`;

  assertString(concept?.whyLearn, `${label}.whyLearn`);

  if (!assertArray(concept?.terms, `${label}.terms`)) {
    return key;
  }

  concept.terms.forEach((term, index) => {
    validateTerm(filePath, nodes, term, key, domainSlug, index);
  });

  return key;
}

function validateTopicCluster(filePath, nodes, cluster, parentKey, domainSlug, sortOrder) {
  const key = addNode(
    nodes,
    filePath,
    "topic_cluster",
    cluster,
    parentKey,
    domainSlug,
    sortOrder,
  );
  const label = `${relative(filePath)} topic cluster ${cluster?.slug ?? "(missing slug)"}`;

  if (!assertArray(cluster?.concepts, `${label}.concepts`)) {
    return key;
  }

  cluster.concepts.forEach((concept, index) => {
    validateConcept(filePath, nodes, concept, key, domainSlug, index);
  });

  return key;
}

function validateKnowledgeArea(filePath, nodes, knowledgeArea, parentKey, domainSlug, sortOrder) {
  const key = addNode(
    nodes,
    filePath,
    "knowledge_area",
    knowledgeArea,
    parentKey,
    domainSlug,
    sortOrder,
  );
  const label = `${relative(filePath)} knowledge area ${
    knowledgeArea?.slug ?? "(missing slug)"
  }`;

  assertString(knowledgeArea?.whyLearn, `${label}.whyLearn`);

  if (!assertArray(knowledgeArea?.topicClusters, `${label}.topicClusters`)) {
    return key;
  }

  knowledgeArea.topicClusters.forEach((cluster, index) => {
    validateTopicCluster(filePath, nodes, cluster, key, domainSlug, index);
  });

  return key;
}

function validateDetailFile(filePath, domainSlugSet) {
  const data = loadYaml(filePath);
  const nodes = [];
  const edgeRefs = [];

  if (!data || typeof data !== "object") {
    fail(`${relative(filePath)} must contain a YAML object`);
    return { data, nodes, edgeRefs, domainSlug: null };
  }

  const domain = data.domain;

  if (!domain || typeof domain !== "object") {
    fail(`${relative(filePath)} missing domain object`);
    return { data, nodes, edgeRefs, domainSlug: null };
  }

  const domainSlug = domain.slug;
  const fileSlug = path.basename(filePath, ".yaml");
  const domainKey = domainSlug ? `${domainSlug}:${domainSlug}` : null;

  assertString(domain.slug, `${relative(filePath)} domain.slug`);
  assertString(domain.name, `${relative(filePath)} domain.name`);
  assertString(domain.summary, `${relative(filePath)} domain.summary`);
  assertString(domain.boundaryNotes, `${relative(filePath)} domain.boundaryNotes`);

  if (domainSlug && domainSlug !== fileSlug) {
    fail(`${relative(filePath)} file name must match domain slug (${domainSlug})`);
  }

  if (domainSlug && !domainSlugSet.has(domainSlug)) {
    fail(`${relative(filePath)} domain slug is not listed in domains.yaml: ${domainSlug}`);
  }

  if (domainSlug) {
    addNode(nodes, filePath, "domain", domain, null, domainSlug, 0);
  }

  if (assertArray(domain.knowledgeAreas, `${relative(filePath)} domain.knowledgeAreas`)) {
    domain.knowledgeAreas.forEach((knowledgeArea, index) => {
      validateKnowledgeArea(filePath, nodes, knowledgeArea, domainKey, domainSlug, index);
    });
  }

  const slugCounts = new Map();
  nodes.forEach((node) => {
    slugCounts.set(node.slug, (slugCounts.get(node.slug) ?? 0) + 1);
  });

  const duplicates = [...slugCounts.entries()].filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    fail(
      `${relative(filePath)} has duplicate local slugs: ${duplicates
        .map(([slug, count]) => `${slug}(${count})`)
        .join(", ")}`,
    );
  }

  if (!assertArray(data.edges, `${relative(filePath)} edges`)) {
    return { data, nodes, edgeRefs, domainSlug };
  }

  data.edges.forEach((edge, index) => {
    const label = `${relative(filePath)} edges[${index}]`;

    assertString(edge?.from, `${label}.from`);
    assertString(edge?.to, `${label}.to`);
    assertString(edge?.relationType, `${label}.relationType`);
    assertString(edge?.reason, `${label}.reason`);

    if (edge?.relationType && !ALLOWED_RELATION_TYPES.has(edge.relationType)) {
      fail(`${label}.relationType is not allowed: ${edge.relationType}`);
    }

    if (edge?.from && edge?.to) {
      edgeRefs.push({
        filePath,
        edge,
        index,
        from: edge.from,
        to: edge.to,
        domainSlug,
      });
    }
  });

  return { data, nodes, edgeRefs, domainSlug };
}

function resolveRef(ref, fileInfo, domainSlugSet, globalNodeKeySet) {
  const localNodeKey = `${fileInfo.domainSlug}:${ref}`;

  if (fileInfo.localSlugSet.has(ref)) {
    return { ok: true, scope: "local", key: localNodeKey };
  }

  if (domainSlugSet.has(ref)) {
    return { ok: true, scope: "domain", key: `${ref}:${ref}` };
  }

  if (ref.includes(":") && globalNodeKeySet.has(ref)) {
    return { ok: true, scope: "qualified", key: ref };
  }

  return { ok: false };
}

function validateEdgeRefs(fileInfos, domainSlugSet) {
  const globalNodeKeySet = new Set();

  fileInfos.forEach((fileInfo) => {
    fileInfo.nodes.forEach((node) => globalNodeKeySet.add(node.key));
  });

  fileInfos.forEach((fileInfo) => {
    fileInfo.edgeRefs.forEach((edgeRef) => {
      const from = resolveRef(edgeRef.from, fileInfo, domainSlugSet, globalNodeKeySet);
      const to = resolveRef(edgeRef.to, fileInfo, domainSlugSet, globalNodeKeySet);
      const label = `${relative(edgeRef.filePath)} edges[${edgeRef.index}]`;

      if (!from.ok) {
        fail(`${label}.from cannot be resolved locally, as domain slug, or as nodeKey: ${edgeRef.from}`);
      }

      if (!to.ok) {
        fail(`${label}.to cannot be resolved locally, as domain slug, or as nodeKey: ${edgeRef.to}`);
      }
    });
  });
}

function validateFileSet(domains, detailFiles) {
  const expected = domains.map((domain) => domain.slug).sort();
  const actual = detailFiles.map((filePath) => path.basename(filePath, ".yaml")).sort();
  const missing = expected.filter((slug) => !actual.includes(slug));
  const extra = actual.filter((slug) => !expected.includes(slug));

  if (missing.length > 0) {
    fail(`missing domain detail files: ${missing.join(", ")}`);
  }

  if (extra.length > 0) {
    fail(`extra domain detail files: ${extra.join(", ")}`);
  }
}

function warnGlobalSlugCollisions(fileInfos) {
  const bySlug = new Map();

  fileInfos.forEach((fileInfo) => {
    fileInfo.nodes.forEach((node) => {
      if (!bySlug.has(node.slug)) {
        bySlug.set(node.slug, []);
      }
      bySlug.get(node.slug).push(node.key);
    });
  });

  const collisions = [...bySlug.entries()]
    .filter(([, keys]) => keys.length > 1)
    .sort(([a], [b]) => a.localeCompare(b));

  collisions.forEach(([slug, keys]) => {
    warn(`global slug appears in multiple nodes: ${slug} -> ${keys.join(", ")}`);
  });
}

function printSummary(fileInfos) {
  console.log("Knowledge Map seed validation");
  console.log("");

  fileInfos
    .slice()
    .sort((a, b) => a.domainSlug.localeCompare(b.domainSlug))
    .forEach((fileInfo) => {
      const knowledgeAreas = fileInfo.nodes.filter((node) => node.level === "knowledge_area").length;
      const edges = fileInfo.edgeRefs.length;
      const crossDomainRefs = fileInfo.edgeRefs.filter(
        (edgeRef) =>
          !fileInfo.localSlugSet.has(edgeRef.from) || !fileInfo.localSlugSet.has(edgeRef.to),
      ).length;

      console.log(
        `ok ${fileInfo.domainSlug} nodes=${fileInfo.nodes.length} knowledgeAreas=${knowledgeAreas} edges=${edges} crossRefs=${crossDomainRefs}`,
      );
    });

  console.log("");
  console.log(
    `totals domains=${fileInfos.length} nodes=${fileInfos.reduce(
      (sum, fileInfo) => sum + fileInfo.nodes.length,
      0,
    )} edges=${fileInfos.reduce((sum, fileInfo) => sum + fileInfo.edgeRefs.length, 0)}`,
  );
}

const { domains, domainSlugSet } = validateDomainsFile();
const detailFiles = collectDetailFiles();

validateFileSet(domains, detailFiles);

const fileInfos = detailFiles.map((filePath) => {
  const result = validateDetailFile(filePath, domainSlugSet);

  return {
    ...result,
    filePath,
    localSlugSet: new Set(result.nodes.map((node) => node.slug)),
  };
});

validateEdgeRefs(fileInfos, domainSlugSet);
warnGlobalSlugCollisions(fileInfos);
printSummary(fileInfos);

if (warnings.length > 0) {
  console.log("");
  console.log(`warnings=${warnings.length}`);
  warnings.forEach((message) => console.log(`warning: ${message}`));
}

if (errors.length > 0) {
  console.error("");
  console.error(`errors=${errors.length}`);
  errors.forEach((message) => console.error(`error: ${message}`));
  process.exit(1);
}
